import { GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";

/**
 * Enhanced Google Calendar View Tool with improved keyword search capabilities and time awareness
 * Extends the standard Google Calendar View Tool to handle minimal input searches and show current time
 */
export class EnhancedGoogleCalendarViewTool extends GoogleCalendarViewTool {
  name = "enhanced_google_calendar_view";
  description = "Get events from Google Calendar with advanced search capabilities and current time awareness.";

  // Helper method to get current time with timezone information
  private getCurrentTimeInfo(): string {
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Format the current time in various helpful ways
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(now);
    
    // Also include ISO format for precision
    const isoTime = now.toISOString();
    
    return `Current time: ${formattedTime}\nISO format: ${isoTime}\nTimezone: ${timezone}`;
  }

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
  private expandTimeWindowForQuery(query: string): { timeMin?: string; timeMax?: string } {
    const timeRangeKeywords = [
      'today', 'tomorrow', 'yesterday', 
      'this week', 'next week', 'last week',
      'this month', 'next month'
    ];
    
    // If query has time references like "tomorrow" or "next week", use them to inform time window
    const hasTimeReference = timeRangeKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    const result: { timeMin?: string; timeMax?: string } = {};
    
    // Simple query (1-2 words) with no explicit time reference
    if (!hasTimeReference && query.trim().split(/\s+/).length <= 2) {
      // Default to start of yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      result.timeMin = yesterday.toISOString();
      
      // Default to 30 days from timeMin
      const timeMax = new Date(yesterday);
      timeMax.setDate(timeMax.getDate() + 31); // 30 days forward
      result.timeMax = timeMax.toISOString();
    } 
    // If there's a time reference, provide generous buffer
    else if (hasTimeReference) {
      const now = new Date();
      
      if (query.toLowerCase().includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        result.timeMin = tomorrow.toISOString();
        
        const endTime = new Date(tomorrow);
        endTime.setDate(endTime.getDate() + 3); // tomorrow + 2 days buffer
        result.timeMax = endTime.toISOString();
      } else if (query.toLowerCase().includes('this week')) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        result.timeMin = startOfWeek.toISOString();
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 10); // current week + buffer
        result.timeMax = endOfWeek.toISOString();
      } else if (query.toLowerCase().includes('next week')) {
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + (7 - now.getDay()) + 7);
        nextWeek.setHours(0, 0, 0, 0);
        result.timeMin = nextWeek.toISOString();
        
        const endTime = new Date(nextWeek);
        endTime.setDate(endTime.getDate() + 14); // next week + buffer
        result.timeMax = endTime.toISOString();
      }
    }
    
    return result;
  }

  // Override the _call method to add our enhancements
  async _call(query: string, runManager?: CallbackManagerForToolRun): Promise<string> {
    try {
      // Always show current time at the beginning
      const timePrefix = `${this.getCurrentTimeInfo()}\n\n`;
      
      // Extract potential time range from query
      const timeWindow = this.expandTimeWindowForQuery(query);
      
      // Generate variations of the query for better matching
      const variations = this.generateNameVariations(query);
      const enhancedQuery = variations.join(' OR ');
      
      // Build an enhanced query that includes time window if available
      let finalQuery = enhancedQuery;
      if (timeWindow.timeMin || timeWindow.timeMax) {
        // Add time boundaries to the query in a way the parent class can understand
        if (timeWindow.timeMin) {
          finalQuery += ` after:${timeWindow.timeMin.split('T')[0]}`;
        }
        if (timeWindow.timeMax) {
          finalQuery += ` before:${timeWindow.timeMax.split('T')[0]}`;
        }
      }
      
      // Debug logging for development
      console.log(`Enhanced calendar search: Expanded "${query}" to search for variations: ${variations.length} alternatives`);
      
      // Call the parent implementation with our enhanced query
      const result = await super._call(finalQuery, runManager);
      
      // Add extra context for the agent if this was a single-word search
      if (query && query.trim().split(/\s+/).length === 1) {
        // If no events were found with the enhanced search
        if (result.includes("No events found") || result.includes("Could not find any events")) {
          return `${timePrefix}${result}\n\nNote: I searched for "${query}" using multiple variations (${variations.join(", ")}), but couldn't find any matching events in your calendar. Try using a different keyword or check if the event exists.`;
        }
        
        // If events were found, add context that advanced search was used
        return `${timePrefix}${result}\n\nNote: I found these events by searching for variations of "${query}" across a wide date range.`;
      }
      
      return `${timePrefix}${result}`;
    } catch (error) {
      console.error("Enhanced calendar search error:", error);
      
      // Provide helpful error message based on the type of error
      const timeInfo = `${this.getCurrentTimeInfo()}\n\n`;
      
      if (error instanceof Error) {
        if (error.message.includes("token")) {
          return `${timeInfo}I encountered an authentication issue when searching your calendar. Please try logging out and back in to refresh your access.`;
        } else if (error.message.includes("permission") || error.message.includes("scope")) {
          return `${timeInfo}I don't have sufficient permissions to search your calendar. Please check your Google Calendar permissions.`;
        } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
          return `${timeInfo}I've hit a rate limit when searching your calendar. Please try again in a moment.`;
        }
      }
      
      // Generic error message
      return `${timeInfo}I encountered an issue when searching your calendar. Please try again with a more specific query.`;
    }
  }
}