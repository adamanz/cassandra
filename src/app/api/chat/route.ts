import { NextRequest, NextResponse } from 'next/server';
import { type Message, LangChainAdapter } from 'ai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { SystemMessage } from '@langchain/core/messages';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';

import { getGoogleAccessToken } from '@/lib/auth0';
import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters';
import { logToolCallsInDevelopment } from '@/utils/stream-logging';
import { EnhancedGoogleCalendarViewTool } from '@/lib/enhanced-calendar-tools';
import { EnhancedGoogleCalendarCreateTool } from '@/lib/enhanced-calendar-create-tool';
import { googleMapsTools } from '@/lib/google-maps-tools';

const AGENT_SYSTEM_TEMPLATE = `You are Cassandra, a smart calendar and location assistant.
My Role: Find, manage, and create calendar events precisely. I use location intelligence (Google Maps), timezone awareness, track your current event/location, manage travel buffers, and provide daily overviews.
Finding Events (Key Logic):
I search flexibly: keywords, partial matches, fuzzy names, company/person variations (e.g., "SendBlue", "SB", "Send Blue Inc"), substring matches, and across multiple calendars.
PRIORITY: If you mention a specific date or date range ("tomorrow", "next week", "July 4th"), I will FILTER search results strictly to that period first. This filter takes precedence.
If no specific date is given (e.g., single keyword only), I search a default window (like 30 days) or expand based on context.
Creating Events:
I need date, time, title. Location and attendees are optional.
List attendees after "Attendees:" or "Invite:".
If a location is provided, I'll offer travel buffer suggestions.
Responses:
For found events, I will show: Date, Time, Title, Attendees (if available), Location (if available).
Formatting: I always use a concise, easy-to-read format. Dates and times are clearly indicated. When listing multiple events, I will ensure each event is clearly separated (e.g., using blank lines or distinct blocks) for maximum readability for the user.
If no results, I suggest alternatives (and note the date searched if applicable).
Location & Context:
I use Google Maps for place info and directions.
I know your current IP location and your current/next event's location/timezone.
I calculate travel times and suggest buffers.
`;

/**
 * This handler initializes and calls an tool calling ReAct agent.
 * See the docs for more information:
 *
 * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    /**
     * We represent intermediate steps as system messages for display purposes,
     * but don't want them in the chat history.
     */
    const messages = (body.messages ?? [])
      .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
      .map(convertVercelMessageToLangChainMessage);
    
    console.log(`Processing ${messages.length} messages`);

    // Check for required API keys
    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.error('Missing GOOGLE_GENAI_API_KEY or GOOGLE_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Google Generative AI API key' },
        { status: 500 }
      );
    }

    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-pro-preview-05-06',
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY,
      temperature: 0.3,
      topP: 0.95,
      maxTokens: 4096,
      streaming: true,
    });

    // Create basic tools that don't require Google integration
    const basicTools = [new Calculator()];
    
    // Add SerpAPI if the API key is available - lower logging overhead
    process.env.SERPAPI_API_KEY && basicTools.push(new SerpAPI(process.env.SERPAPI_API_KEY));
    
    // Add Google Maps tools to basic tools since they don't require Google Calendar auth
    basicTools.push(...googleMapsTools);

    try {
      // Get the access token via Auth0
      const accessToken = await getGoogleAccessToken();
      
      if (!accessToken) {
        console.warn('No Google access token available - falling back to basic tools');
        // Instead of throwing, continue with basic tools only
        const fallbackAgent = createReactAgent({
          llm,
          tools: basicTools,
          messageModifier: new SystemMessage(
            AGENT_SYSTEM_TEMPLATE + `\n\nNOTE: Calendar access unavailable. Please sign out and back in.`
          ),
        });
        
        const eventStream = fallbackAgent.streamEvents({ messages }, { version: 'v2' });
        const transformedStream = logToolCallsInDevelopment(eventStream);
        return LangChainAdapter.toDataStreamResponse(transformedStream);
      }
      
      console.log('Successfully retrieved Google access token, initializing tools');
      
      // Enhanced calendar params with more sophisticated search capabilities
      const googleCalendarViewParams = {
        credentials: { accessToken, calendarId: 'primary' },
        model: llm,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use local timezone
        maxResults: 20, // Increase from default to catch more potential matches
        singleEvents: true, // Expand recurring events for better matching
        orderBy: 'startTime',
      };
      
      const googleCalendarCreateParams = {
        credentials: { accessToken, calendarId: 'primary' },
        model: llm,
      };

      // Enhanced calendar tools with specialized parameters for better search
      const tools = [
        ...basicTools,
        new EnhancedGoogleCalendarCreateTool(googleCalendarCreateParams),
        new EnhancedGoogleCalendarViewTool(googleCalendarViewParams),
      ];
      
      console.log('Successfully created Google tools, creating agent');
      
      /**
       * Use a prebuilt LangGraph agent.
       */
      const agent = createReactAgent({
        llm,
        tools,
        /**
         * Modify the stock prompt in the prebuilt agent. See docs
         * for how to customize your agent:
         *
         * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
         */
        messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
      });

      /**
       * Stream back all generated tokens and steps from their runs.
       *
       * See: https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/
       */
      const eventStream = agent.streamEvents(
        { messages }, 
        { 
          version: 'v2',
          streamMode: 'values',
          recursionLimit: 50,
        }
      );

      // Log tool calling data. Only in development mode
      const transformedStream = logToolCallsInDevelopment(eventStream);
      // Adapt the LangChain stream to Vercel AI SDK Stream
      return LangChainAdapter.toDataStreamResponse(transformedStream);
    } catch (googleError: any) {
      console.error("Google API access error:", googleError);
      
      // Provide more detailed error messages
      let errorContext = "Google integration error";
      if (googleError.message?.includes('insufficient authentication scopes')) {
        errorContext = "Insufficient Google API permissions. The app needs additional permissions to access your Google data.";
      } else if (googleError.message?.includes('token')) {
        errorContext = "Authentication token error. Please try logging out and back in to refresh your permissions.";
      }
      
      // Fall back to using LLM without Google tools
      console.log("Falling back to LLM without Google integrations");
      
      const fallbackAgent = createReactAgent({
        llm,
        tools: basicTools,
        messageModifier: new SystemMessage(
          AGENT_SYSTEM_TEMPLATE + `\n\nNOTE: Calendar access unavailable. Please log out and back in.`
        ),
      });
      
      const eventStream = fallbackAgent.streamEvents({ messages }, { version: 'v2' });
      const transformedStream = logToolCallsInDevelopment(eventStream);
      return LangChainAdapter.toDataStreamResponse(transformedStream);
    }
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ error: e.message || 'Unknown server error' }, { status: e.status ?? 500 });
  }
}