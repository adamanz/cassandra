import { GoogleCalendarCreateTool } from '@langchain/community/tools/google_calendar';
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";

/**
 * Enhanced Google Calendar Create Tool that supports adding attendees to events
 */
export class EnhancedGoogleCalendarCreateTool extends GoogleCalendarCreateTool {
  name = "enhanced_google_calendar_create";
  description = "Create events in Google Calendar with support for adding attendees by email.";

  async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
    try {
      // Parse the input to extract attendees if present
      const inputLines = input.split('\n');
      let attendeeEmails: string[] = [];
      let cleanedInput = input;

      // Look for attendees line
      for (let i = 0; i < inputLines.length; i++) {
        const line = inputLines[i].trim();
        if (line.toLowerCase().startsWith('attendees:') || line.toLowerCase().startsWith('invite:')) {
          const emailsStr = line.substring(line.indexOf(':') + 1).trim();
          attendeeEmails = emailsStr.split(',').map(email => email.trim()).filter(email => email);
          // Remove the attendees line from the input
          inputLines.splice(i, 1);
          cleanedInput = inputLines.join('\n');
          break;
        }
      }

      // Let the parent class handle the basic event creation
      const baseResult = await super._call(cleanedInput, runManager);

      // If we have attendees and the event was created successfully, update it with attendees
      if (attendeeEmails.length > 0 && baseResult.includes('successfully')) {
        try {
          // Extract event ID from the result
          const eventIdMatch = baseResult.match(/Event ID: ([\w-]+)/);
          if (eventIdMatch) {
            const eventId = eventIdMatch[1];
            const calendar = await this.getCalendarClient();

            // Get the event to update it
            const event = await calendar.events.get({
              calendarId: this.calendarId,
              eventId: eventId,
            });

            // Add attendees
            if (event.data) {
              event.data.attendees = attendeeEmails.map(email => ({ email }));
              
              // Update the event with attendees
              await calendar.events.update({
                calendarId: this.calendarId,
                eventId: eventId,
                requestBody: event.data,
                sendUpdates: 'all', // Send invitations to attendees
              });

              // Modify the result to include attendee information
              const attendeesList = attendeeEmails.join(', ');
              return baseResult + `\nAttendees invited: ${attendeesList}`;
            }
          }
        } catch (error) {
          console.error("Error adding attendees to event:", error);
          return baseResult + `\n(Note: Event created but couldn't add attendees: ${error})`;
        }
      }

      return baseResult;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("Invalid email")) {
          return "Error: One or more attendee email addresses are invalid. Please check the email addresses and try again.";
        } else if (error.message.includes("permission")) {
          return "Error: You don't have permission to create events in this calendar.";
        } else if (error.message.includes("quota")) {
          return "Error: Calendar quota exceeded. Please try again later.";
        }
      }
      
      return "Error creating calendar event. Please check the event details and try again.";
    }
  }
}