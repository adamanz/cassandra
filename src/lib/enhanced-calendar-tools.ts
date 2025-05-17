import { GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";

/**
 * Enhanced Google Calendar View Tool with improved keyword search capabilities,
 * time awareness, and robust error handling
 * Extends the standard Google Calendar View Tool to handle minimal input searches
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
    const now = new Date();
    const lowerQuery = query.toLowerCase();
    
    // Default to 30-day window for general searches
    let startDate = new Date(now);
    let endDate = new Date(now);
    
    // Special handling for current time/location queries
    if (lowerQuery.includes('now') || lowerQuery.includes('current time') || lowerQuery.includes('current event') || 
        lowerQuery.includes('where am i')) {
      // For "where am I" queries, check events within the past hour and next 30 minutes
      startDate.setHours(startDate.getHours() - 1);
      endDate.setMinutes(endDate.getMinutes() + 30);
    } else if (lowerQuery.includes('today')) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('tomorrow')) {
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('yesterday')) {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('this week')) {
      // Get start of current week (Sunday or Monday depending on locale)
      const dayOfWeek = startDate.getDay();
      const daysSinceStart = dayOfWeek === 0 ? 0 : dayOfWeek;
      startDate.setDate(startDate.getDate() - daysSinceStart);
      startDate.setHours(0, 0, 0, 0);
      
      // Get end of current week
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('next week')) {
      // Get start of next week
      const dayOfWeek = startDate.getDay();
      const daysUntilNextWeek = 7 - dayOfWeek;
      startDate.setDate(startDate.getDate() + daysUntilNextWeek);
      startDate.setHours(0, 0, 0, 0);
      
      // Get end of next week
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('last week')) {
      // Get end of last week
      const dayOfWeek = endDate.getDay();
      const daysSinceStart = dayOfWeek === 0 ? 7 : dayOfWeek;
      endDate.setDate(endDate.getDate() - daysSinceStart - 1);
      endDate.setHours(23, 59, 59, 999);
      
      // Get start of last week
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (lowerQuery.includes('this month')) {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      // Get last day of month
      endDate.setMonth(endDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('next month')) {
      startDate.setMonth(startDate.getMonth() + 1, 1);
      startDate.setHours(0, 0, 0, 0);
      
      // Get last day of next month
      endDate.setMonth(endDate.getMonth() + 2, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default: search 15 days in the past and 15 days in the future
      startDate.setDate(startDate.getDate() - 15);
      endDate.setDate(endDate.getDate() + 15);
    }
    
    return {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString()
    };
  }

  async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
    try {
      console.log(`Calendar search initiated for: "${input}"`);
      
      // Get current time info
      const timeInfo = this.getCurrentTimeInfo();
      console.log('Current time context:', timeInfo);
      
      // Parse the query and identify if it's likely a company/person name search
      const query = input.trim();
      const lowerQuery = query.toLowerCase();
      
      // Special handling for current time/location queries - don't generate variations
      const isCurrentLocationQuery = lowerQuery.includes('current time') || lowerQuery.includes('now') || 
                                   lowerQuery.includes('current event') || lowerQuery.includes('where am i');
      
      const isLikelyNameSearch = !isCurrentLocationQuery && (!query.includes(' ') || query.split(' ').length <= 3);
      
      // Get time window based on query
      const timeWindow = this.expandTimeWindowForQuery(query);
      console.log('Search time window:', timeWindow);
      
      // For single word or short queries, generate name variations
      let searchVariations = [query];
      if (isLikelyNameSearch) {
        searchVariations = this.generateNameVariations(query);
        console.log('Generated search variations:', searchVariations);
      } else if (isCurrentLocationQuery) {
        // For current location queries, search without the full query text
        searchVariations = [''];  // Empty search to get all events in the time window
        console.log('Current location query - searching all events in time window');
      }
      
      // Initialize results accumulator
      let allEvents: any[] = [];
      const errors: string[] = [];
      
      // Get calendar IDs to search
      const calendarIds = this.calendarIds && this.calendarIds.length > 0 ? this.calendarIds : ['primary'];
      console.log('Searching calendar IDs:', calendarIds);
      
      // Search each calendar
      for (const calendarId of calendarIds) {
        console.log(`Searching calendar: ${calendarId}`);
        
        try {
          const calendar = await this.getCalendarClient();
          
          // Search with each variation
          for (const variation of searchVariations) {
            try {
              console.log(`Searching with variation: "${variation}"`);
              
              // Build search parameters
              const searchParams: any = {
                calendarId,
                timeMin: timeWindow.timeMin,
                timeMax: timeWindow.timeMax,
                singleEvents: true,
                orderBy: 'startTime',
                q: variation,
                maxResults: 50
              };
              
              // Make API call
              const response = await calendar.events.list(searchParams);
              
              if (response.data.items && response.data.items.length > 0) {
                console.log(`Found ${response.data.items.length} events with variation "${variation}"`);
                allEvents = [...allEvents, ...response.data.items];
              }
            } catch (variationError) {
              console.error(`Error searching with variation "${variation}":`, variationError);
              // Continue with other variations
            }
          }
        } catch (calendarError) {
          const errorMsg = `Error searching calendar ${calendarId}: ${calendarError}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      // Remove duplicate events based on ID
      const uniqueEvents = Array.from(
        new Map(allEvents.map(event => [event.id, event])).values()
      );
      
      // Sort events by start time
      uniqueEvents.sort((a, b) => {
        const aStart = new Date(a.start?.dateTime || a.start?.date || 0);
        const bStart = new Date(b.start?.dateTime || b.start?.date || 0);
        return aStart.getTime() - bStart.getTime();
      });
      
      console.log(`Found ${uniqueEvents.length} unique events total`);
      
      // Format results
      if (uniqueEvents.length === 0) {
        return `${timeInfo}\n\nNo events found matching "${query}" in the specified time range.\n${errors.length > 0 ? '\nErrors encountered:\n' + errors.join('\n') : ''}`;
      }
      
      // Format events for display
      const formattedEvents = uniqueEvents.map(event => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        // Format date and time
        const dateOptions: Intl.DateTimeFormatOptions = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        };
        
        const timeOptions: Intl.DateTimeFormatOptions = {
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        };
        
        let timeDisplay = '';
        if (event.start?.dateTime) {
          timeDisplay = `${startDate.toLocaleTimeString('en-US', timeOptions)} - ${endDate.toLocaleTimeString('en-US', timeOptions)}`;
        } else {
          // All-day event
          timeDisplay = 'All day';
        }
        
        const dateDisplay = startDate.toLocaleDateString('en-US', dateOptions);
        
        // Build event string
        let eventStr = `${dateDisplay} ${timeDisplay}\n${event.summary || 'No title'}`;
        
        if (event.location) {
          eventStr += `\nLocation: ${event.location}`;
        }
        
        if (event.attendees && event.attendees.length > 0) {
          const attendeeList = event.attendees
            .map(a => a.email || a.displayName || 'Unknown')
            .join(', ');
          eventStr += `\nAttendees: ${attendeeList}`;
        }
        
        return eventStr;
      }).join('\n\n---\n\n');
      
      return `${timeInfo}\n\nFound ${uniqueEvents.length} event${uniqueEvents.length !== 1 ? 's' : ''} matching "${query}":\n\n${formattedEvents}${errors.length > 0 ? '\n\nErrors encountered:\n' + errors.join('\n') : ''}`;
      
    } catch (error) {
      console.error('Error in calendar search:', error);
      
      // Provide specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('insufficient permission') || error.message.includes('Forbidden')) {
          return `Error: Insufficient permissions to access calendar. Please ensure you have granted calendar access permissions.`;
        } else if (error.message.includes('invalid_grant')) {
          return `Error: Calendar access token has expired. Please log in again to refresh your permissions.`;
        } else if (error.message.includes('rate limit')) {
          return `Error: Calendar API rate limit exceeded. Please try again in a few moments.`;
        } else if (error.message.includes('not found')) {
          return `Error: Calendar not found. Please check your calendar settings.`;
        }
      }
      
      return `Error retrieving calendar events: ${error}. Please try again or check your calendar permissions.`;
    }
  }
}