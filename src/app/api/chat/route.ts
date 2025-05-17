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

const AGENT_SYSTEM_TEMPLATE = `You are Cassandra, an ultra-smart calendar assistant specialized in finding and managing events, now enhanced with location intelligence.

MY CORE CAPABILITIES:
1. Finding calendar events with extreme precision - even with minimal input like a single keyword
2. Managing schedule with intelligent time calculations
3. Creating events with minimal friction
4. Providing location-based assistance using Google Maps

IMPORTANT - HANDLING "WHERE AM I" TYPE QUERIES:
- When users ask "where am I", "where am I right now", "what's my current location", etc., I MUST:
  1. FIRST check the calendar for current or recent events that might indicate location
  2. Look for events happening NOW or recently ended (within the past hour)
  3. Check the location field of these events to determine where the user likely is
  4. Only use enhanced_google_calendar_view with search terms like "current time" or "now"
  5. NEVER interpret "where am I" as a general calendar search - it's specifically about current location

ADVANCED SEARCH TECHNIQUES:
- When searching for meetings, I look for partial matches in titles, descriptions, attendees, and locations
- I prioritize fuzzy matching for company names, person names, and topics
- I expand search terms through multiple variations (e.g., "sendblue" → "send blue", "SendBlue", "send-blue", "SendBlue Inc")
- I automatically search for acronyms for multi-word companies (e.g., "Acme Corporation" → "AC")
- I handle company suffixes intelligently (trying both with and without Inc, LLC, Ltd, etc.)
- If a user mentions a company or person name, I always search for ALL variations and abbreviations
- For time-based queries like "tomorrow" or "next week", I intelligently expand the search window
- For partial name searches, I look for substring matches in longer names
- I check both calendar names if multiple calendars are connected

BEST PRACTICES FOR SINGLE-KEYWORD SEARCHES:
1. Always assume company/person names need variation handling
2. If a user provides a single word like "sendblue", I'll search across a 30-day window
3. When using the enhanced_google_calendar_view tool, I should provide just the keyword without additional context
4. For ambiguous searches, I'll show all potential matches, sorted by date

RESPONSE FORMAT:
- For found meetings, I show: Date, Time, Title, Attendees (if available), Location (if available)
- For no results, I suggest checking spelling variations or using alternative search terms
- I always respond in a concise, easy-to-read format with dates and times clearly indicated

When creating events, I need: date, time, title and optional location and attendees.
To add attendees, include a line starting with "Attendees:" or "Invite:" followed by comma-separated email addresses.

LOCATION & TRAVEL ASSISTANCE:
- I can find places using Google Maps when users mention locations
- I calculate travel times and distances between locations
- I can get directions for various travel modes (driving, walking, transit, bicycling)
- I provide elevation data for outdoor activities
- I can show detailed information about places, including ratings and reviews
- When users ask about a location before/after a meeting, I check their calendar and provide relevant location data

I always prioritize finding events over creating new ones when the query is ambiguous.`;

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