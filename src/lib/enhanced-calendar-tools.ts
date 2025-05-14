import { GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';
import { z } from 'zod';

/**
 * Enhanced Google Calendar View Tool with improved keyword search capabilities
 * Extends the standard Google Calendar View Tool to handle minimal input searches
 */
export class EnhancedGoogleCalendarViewTool extends GoogleCalendarViewTool {
  name = "enhanced_google_calendar_view";
  description = "Get events from Google Calendar with advanced search capabilities.";

  // Enhanced schema with better query parameters
  schema = z.object({
    query: z
      .string()
      .optional()
      .describe(
        "Query string for finding events. This is HIGHLY FLEXIBLE and can match partial words in title, description, attendees. Always expand abbreviations and try variations of company names."
      ),
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("The ID of the calendar to query"),
    timeMin: z
      .string()
      .optional()
      .describe(
        "The start time of the query range in ISO 8601 format. If empty, defaults to the beginning of the current day."
      ),
    timeMax: z
      .string()
      .optional()
      .describe(
        "The end time of the query range in ISO 8601 format. If empty and timeMin is specified, defaults to timeMin + 7 days. If timeMin is also empty, defaults to the end of the current day."
      ),
    maxResults: z
      .number()
      .optional()
      .default(20)
      .describe("The maximum number of events to return."),
    singleEvents: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to expand recurring events into single events."),
  });

  // Helper method to generate common variations of company/person names
  private generateNameVariations(query: string): string[] {
    const originalQuery = query.trim();
    const words = originalQuery.split(/\s+/);
    
    // Base variations
    const variations: string[] = [
      originalQuery,                          // Original
      originalQuery.toLowerCase(),            // lowercase
      originalQuery.toUpperCase(),            // UPPERCASE
      originalQuery.replace(/\s+/g, ''),     // Remove spaces
      originalQuery.replace(/\s+/g, '-'),    // Replace spaces with hyphens
      originalQuery.replace(/\s+/g, '.'),    // Replace spaces with dots
    ];
    
    // Add camelCase and PascalCase variations
    if (words.length > 1) {
      // camelCase: first word lowercase, rest capitalized
      variations.push(
        words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
      );
      
      // PascalCase: all words capitalized
      variations.push(
        words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
      );
    }
    
    // Add acronym (first letter of each word)
    if (words.length > 1) {
      variations.push(words.map(word => word[0]).join('').toUpperCase());
    }
    
    // Add partial matches for single words (useful for long company names)
    if (originalQuery.length > 5 && !originalQuery.includes(' ')) {
      // Add substring from the beginning (first 5+ chars)
      variations.push(originalQuery.substring(0, Math.ceil(originalQuery.length * 0.7)));
    }
    
    // Handle common company suffixes
    const companySuffixes = [' Inc', ' LLC', ' Ltd', ' Corp', ' Co'];
    for (const suffix of companySuffixes) {
      if (originalQuery.endsWith(suffix)) {
        // Add version without the suffix
        variations.push(originalQuery.slice(0, -suffix.length));
      } else {
        // Add version with the suffix (only for single words or short queries)
        if (words.length <= 2 && originalQuery.length < 15) {
          variations.push(originalQuery + suffix);
        }
      }
    }
    
    // Return unique variations only
    return [...new Set(variations)];
  }

  // Helper method to expand search time windows based on query context
  private expandTimeWindow(input: z.infer<typeof this.schema>, query: string): void {
    const timeRangeKeywords = [
      'today', 'tomorrow', 'yesterday', 
      'this week', 'next week', 'last week',
      'this month', 'next month'
    ];
    
    // If query has time references like "tomorrow" or "next week", use them to inform time window
    const hasTimeReference = timeRangeKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    // Simple query (1-2 words) with no explicit time reference
    if (!hasTimeReference && query.trim().split(/\s+/).length <= 2) {
      // Default to start of yesterday if not specified 
      if (!input.timeMin) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        input.timeMin = yesterday.toISOString();
      }
      
      // Default to 30 days from timeMin if not specified
      if (!input.timeMax) {
        const timeMin = new Date(input.timeMin);
        const timeMax = new Date(timeMin);
        timeMax.setDate(timeMax.getDate() + 30); // Look ahead 30 days
        input.timeMax = timeMax.toISOString();
      }
    } 
    // If there's a time reference but no explicit timeMax, provide generous buffer
    else if (hasTimeReference && input.timeMin && !input.timeMax) {
      const timeMin = new Date(input.timeMin);
      const timeMax = new Date(timeMin);
      
      // Add buffer days based on the time reference
      if (query.toLowerCase().includes('tomorrow')) {
        timeMax.setDate(timeMax.getDate() + 3); // tomorrow + 2 days buffer
      } else if (query.toLowerCase().includes('this week')) {
        timeMax.setDate(timeMax.getDate() + 10); // current week + buffer
      } else if (query.toLowerCase().includes('next week')) {
        timeMax.setDate(timeMax.getDate() + 14); // next week + buffer
      } else if (query.toLowerCase().includes('this month') || query.toLowerCase().includes('next month')) {
        timeMax.setDate(timeMax.getDate() + 45); // month + buffer
      } else {
        timeMax.setDate(timeMax.getDate() + 7); // default buffer
      }
      
      input.timeMax = timeMax.toISOString();
    }
  }

  async _call(input: z.infer<typeof this.schema>) {
    try {
      // Keep original query for search window expansion logic
      const originalQuery = input.query || '';
      
      // Expand time window based on query context
      this.expandTimeWindow(input, originalQuery);
  
      // Process query with advanced fuzzy search capabilities
      if (input.query) {
        // Generate variations of the query
        const variations = this.generateNameVariations(input.query);
        
        // Replace original query with OR-joined variations
        input.query = variations.join(' OR ');
        
        // Debug logging for development 
        console.log(`Enhanced calendar search: Expanded "${originalQuery}" to search for variations: ${variations.length} alternatives`);
      }
  
      // Call the parent implementation with our enhanced parameters
      const result = await super._call(input);
      
      // Add extra context for the agent if this was a single-word search
      if (originalQuery && originalQuery.trim().split(/\s+/).length === 1) {
        // If no events were found with the enhanced search
        if (result.includes("No events found") || result.includes("Could not find any events")) {
          return `${result}\n\nNote: I searched for "${originalQuery}" using multiple variations (${this.generateNameVariations(originalQuery).join(", ")}), but couldn't find any matching events in your calendar. Try using a different keyword or check if the event exists.`;
        }
        
        // If events were found, add context that advanced search was used
        return `${result}\n\nNote: I found these events by searching for variations of "${originalQuery}" across a wide date range.`;
      }
      
      return result;
    } catch (error) {
      console.error("Enhanced calendar search error:", error);
      
      // Provide helpful error message based on the type of error
      if (error instanceof Error) {
        if (error.message.includes("token")) {
          return "I encountered an authentication issue when searching your calendar. Please try logging out and back in to refresh your access.";
        } else if (error.message.includes("permission") || error.message.includes("scope")) {
          return "I don't have sufficient permissions to search your calendar. Please check your Google Calendar permissions.";
        } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
          return "I've hit a rate limit when searching your calendar. Please try again in a moment.";
        }
      }
      
      // Generic error message
      return "I encountered an issue when searching your calendar. Please try again with a more specific query.";
    }
  }
}