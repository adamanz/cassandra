import { EnhancedGoogleCalendarCreateTool } from '../../lib/enhanced-calendar-create-tool';
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { GoogleCalendarCreateTool } from '@langchain/community/tools/google_calendar';

// Mock the GoogleCalendarCreateTool to avoid actual API calls
jest.mock('@langchain/community/tools/google_calendar');

describe('EnhancedGoogleCalendarCreateTool', () => {
  let tool: EnhancedGoogleCalendarCreateTool;
  let mockCalendarClient: any;
  let mockRunManager: CallbackManagerForToolRun;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods to suppress logs in tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Mock calendar client
    mockCalendarClient = {
      events: {
        get: jest.fn(),
        insert: jest.fn(),
        update: jest.fn()
      }
    };
    
    // Create instance of the tool
    tool = new EnhancedGoogleCalendarCreateTool({});
    
    // Mock the getCalendarClient method
    (tool as any).getCalendarClient = jest.fn().mockResolvedValue(mockCalendarClient);
    
    // Mock the parent class _call method for basic functionality
    jest.spyOn(GoogleCalendarCreateTool.prototype, '_call').mockResolvedValue(
      'Event created successfully. Event ID: test-event-id'
    );
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Tool Configuration', () => {
    it('should have the correct name', () => {
      expect(tool.name).toBe('enhanced_google_calendar_create');
    });

    it('should have the correct description', () => {
      expect(tool.description).toBe('Create events in Google Calendar with support for adding attendees by email. Automatically sends email invitations.');
    });
  });

  describe('Basic Event Creation', () => {
    it('should create event without attendees', async () => {
      const input = 'Meeting tomorrow at 2pm';
      const result = await tool._call(input, mockRunManager);
      
      expect(result).toContain('Event created successfully');
      expect(GoogleCalendarCreateTool.prototype._call).toHaveBeenCalledWith(input, mockRunManager);
    });

    it('should pass through parent class errors', async () => {
      jest.spyOn(GoogleCalendarCreateTool.prototype, '_call').mockRejectedValue(
        new Error('Calendar API error')
      );
      
      const result = await tool._call('Invalid event', mockRunManager);
      
      expect(result).toContain('Error creating calendar event');
    });
  });

  describe('Event Creation with Attendees', () => {
    it('should parse and add attendees with "Attendees:" prefix', async () => {
      const input = `Meeting tomorrow at 2pm
Attendees: john@example.com, jane@example.com`;
      
      const mockEvent = {
        data: {
          id: 'test-event-id',
          summary: 'Meeting',
          start: { dateTime: '2024-01-16T14:00:00Z' },
          end: { dateTime: '2024-01-16T15:00:00Z' }
        }
      };
      
      mockCalendarClient.events.get.mockResolvedValue(mockEvent);
      mockCalendarClient.events.update.mockResolvedValue({ data: { ...mockEvent.data, attendees: [] } });
      
      const result = await tool._call(input, mockRunManager);
      
      expect(mockCalendarClient.events.get).toHaveBeenCalledWith({
        calendarId: tool.calendarId || 'primary',
        eventId: 'test-event-id'
      });
      
      expect(mockCalendarClient.events.update).toHaveBeenCalledWith({
        calendarId: tool.calendarId || 'primary',
        eventId: 'test-event-id',
        requestBody: expect.objectContaining({
          attendees: expect.arrayContaining([
            expect.objectContaining({ email: 'john@example.com' }),
            expect.objectContaining({ email: 'jane@example.com' })
          ])
        }),
        sendUpdates: 'all'
      });
      
      expect(result).toContain('Attendees invited: john@example.com, jane@example.com');
    });

    it('should parse and add attendees with "Invite:" prefix', async () => {
      const input = `Team meeting next Friday at 3pm
Location: Conference Room A
Invite: alice@company.com, bob@company.com, charlie@company.com`;
      
      const mockEvent = {
        data: {
          id: 'test-event-id',
          summary: 'Team meeting',
          location: 'Conference Room A'
        }
      };
      
      mockCalendarClient.events.get.mockResolvedValue(mockEvent);
      mockCalendarClient.events.update.mockResolvedValue({ data: mockEvent.data });
      
      const result = await tool._call(input, mockRunManager);
      
      expect(mockCalendarClient.events.update).toHaveBeenCalledWith({
        calendarId: tool.calendarId || 'primary',
        eventId: 'test-event-id',
        requestBody: expect.objectContaining({
          attendees: expect.arrayContaining([
            expect.objectContaining({ email: 'alice@company.com' }),
            expect.objectContaining({ email: 'bob@company.com' }),
            expect.objectContaining({ email: 'charlie@company.com' })
          ])
        }),
        sendUpdates: 'all'
      });
      
      expect(result).toContain('Attendees invited: alice@company.com, bob@company.com, charlie@company.com');
    });

    it('should handle single attendee', async () => {
      const input = `Quick sync tomorrow at 10am
Attendees: manager@company.com`;
      
      const mockEvent = {
        data: {
          id: 'test-event-id',
          summary: 'Quick sync'
        }
      };
      
      mockCalendarClient.events.get.mockResolvedValue(mockEvent);
      mockCalendarClient.events.update.mockResolvedValue({ data: mockEvent.data });
      
      const result = await tool._call(input, mockRunManager);
      
      expect(mockCalendarClient.events.update).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: tool.calendarId || 'primary',
          requestBody: expect.objectContaining({
            attendees: expect.arrayContaining([
              expect.objectContaining({ email: 'manager@company.com' })
            ])
          }),
          sendUpdates: 'all'
        })
      );
    });

    it('should filter out empty email addresses', async () => {
      const input = `Meeting at 4pm
Attendees: valid@email.com, , , another@email.com`;
      
      const mockEvent = {
        data: {
          id: 'test-event-id'
        }
      };
      
      mockCalendarClient.events.get.mockResolvedValue(mockEvent);
      mockCalendarClient.events.update.mockResolvedValue({ data: mockEvent.data });
      
      const result = await tool._call(input, mockRunManager);
      
      expect(mockCalendarClient.events.update).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: tool.calendarId || 'primary',
          requestBody: expect.objectContaining({
            attendees: expect.arrayContaining([
              expect.objectContaining({ email: 'valid@email.com' }),
              expect.objectContaining({ email: 'another@email.com' })
            ])
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle event not found error when adding attendees', async () => {
      const input = `Meeting at 2pm
Attendees: test@example.com`;
      
      mockCalendarClient.events.get.mockRejectedValue(new Error('Event not found'));
      
      const result = await tool._call(input, mockRunManager);
      
      expect(result).toContain('Event created successfully');
      expect(result).toContain("Event created but couldn't add attendees");
    });

    it('should handle invalid email error', async () => {
      jest.spyOn(GoogleCalendarCreateTool.prototype, '_call').mockRejectedValue(
        new Error('Invalid email address provided')
      );
      
      const result = await tool._call('Meeting with invalid@', mockRunManager);
      
      expect(result).toContain('One or more attendee email addresses are invalid');
    });

    it('should handle permission error', async () => {
      jest.spyOn(GoogleCalendarCreateTool.prototype, '_call').mockRejectedValue(
        new Error('Insufficient permission to create event')
      );
      
      const result = await tool._call('Private meeting', mockRunManager);
      
      expect(result).toContain("You don't have permission to create events");
    });

    it('should handle quota exceeded error', async () => {
      jest.spyOn(GoogleCalendarCreateTool.prototype, '_call').mockRejectedValue(
        new Error('Calendar quota exceeded')
      );
      
      const result = await tool._call('Another meeting', mockRunManager);
      
      expect(result).toContain('Calendar quota exceeded');
    });

    it('should handle generic errors', async () => {
      jest.spyOn(GoogleCalendarCreateTool.prototype, '_call').mockRejectedValue(
        new Error('Unknown error')
      );
      
      const result = await tool._call('Meeting', mockRunManager);
      
      expect(result).toContain('Error creating calendar event');
      expect(result).toContain('Please check the event details');
    });

    it('should handle update failure when adding attendees', async () => {
      const input = `Meeting tomorrow
Attendees: test@example.com`;
      
      const mockEvent = {
        data: {
          id: 'test-event-id'
        }
      };
      
      mockCalendarClient.events.get.mockResolvedValue(mockEvent);
      mockCalendarClient.events.update.mockRejectedValue(new Error('Update failed'));
      
      const result = await tool._call(input, mockRunManager);
      
      expect(result).toContain('Event created successfully');
      expect(result).toContain("Event created but couldn't add attendees");
    });
  });

  describe('Input Parsing', () => {
    it('should preserve event details when extracting attendees', async () => {
      const input = `Important client meeting
Date: Next Monday at 2pm
Location: Office Building A
Duration: 1 hour
Attendees: client@external.com, team@internal.com
Notes: Bring presentation materials`;
      
      const expectedCleanedInput = `Important client meeting
Date: Next Monday at 2pm
Location: Office Building A
Duration: 1 hour
Notes: Bring presentation materials`;
      
      const result = await tool._call(input, mockRunManager);
      
      // The parent class should receive the input without the attendees line
      expect(GoogleCalendarCreateTool.prototype._call).toHaveBeenCalledWith(
        expectedCleanedInput,
        mockRunManager
      );
    });

    it('should handle case-insensitive attendee prefixes', async () => {
      const inputs = [
        'Meeting\nATTENDEES: test@example.com',
        'Meeting\nattendees: test@example.com',
        'Meeting\nAtTeNdEeS: test@example.com',
        'Meeting\nINVITE: test@example.com',
        'Meeting\ninvite: test@example.com'
      ];
      
      for (const input of inputs) {
        jest.clearAllMocks();
        
        const mockEvent = {
          data: { id: 'test-event-id' }
        };
        
        mockCalendarClient.events.get.mockResolvedValue(mockEvent);
        mockCalendarClient.events.update.mockResolvedValue({ data: mockEvent.data });
        
        await tool._call(input, mockRunManager);
        
        expect(mockCalendarClient.events.update).toHaveBeenCalledWith(
          expect.objectContaining({
            calendarId: tool.calendarId || 'primary',
            requestBody: expect.objectContaining({
              attendees: expect.arrayContaining([
                expect.objectContaining({ email: 'test@example.com' })
              ])
            })
          })
        );
      }
    });

    it('should handle attendees with various email formats', async () => {
      const input = `Team sync
Attendees: simple@example.com, with.dots@example.com, with+plus@example.co.uk, with-dash@sub.example.org`;
      
      const mockEvent = {
        data: { id: 'test-event-id' }
      };
      
      mockCalendarClient.events.get.mockResolvedValue(mockEvent);
      mockCalendarClient.events.update.mockResolvedValue({ data: mockEvent.data });
      
      const result = await tool._call(input, mockRunManager);
      
      expect(mockCalendarClient.events.update).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: tool.calendarId || 'primary',
          requestBody: expect.objectContaining({
            attendees: expect.arrayContaining([
              expect.objectContaining({ email: 'simple@example.com' }),
              expect.objectContaining({ email: 'with.dots@example.com' }),
              expect.objectContaining({ email: 'with+plus@example.co.uk' }),
              expect.objectContaining({ email: 'with-dash@sub.example.org' })
            ])
          }),
          sendUpdates: 'all'
        })
      );
    });
  });

  describe('Event ID Extraction', () => {
    it('should create event with attendees directly when provided', async () => {
      const input = `Meeting\nAttendees: test@example.com`;
      
      const mockResponse = {
        data: {
          id: 'created-event-id',
          summary: 'Meeting',
          start: { dateTime: '2024-01-15T14:00:00Z' },
          end: { dateTime: '2024-01-15T15:00:00Z' }
        }
      };
      
      mockCalendarClient.events.insert.mockResolvedValue(mockResponse);
      
      const result = await tool._call(input, mockRunManager);
      
      expect(mockCalendarClient.events.insert).toHaveBeenCalledWith({
        calendarId: tool.calendarId || 'primary',
        requestBody: expect.objectContaining({
          attendees: expect.arrayContaining([
            expect.objectContaining({ email: 'test@example.com' })
          ])
        }),
        sendUpdates: 'all',
        conferenceDataVersion: 1
      });
      
      expect(result).toContain('Event "Meeting" created successfully');
      expect(result).toContain('Attendees invited: test@example.com');
      expect(result).toContain('Email invitations sent to all attendees');
    });

    it('should not attempt to add attendees if event ID not found', async () => {
      jest.spyOn(GoogleCalendarCreateTool.prototype, '_call').mockResolvedValue(
        'Event created but no ID returned'
      );
      
      const input = `Meeting\nAttendees: test@example.com`;
      
      const result = await tool._call(input, mockRunManager);
      
      expect(mockCalendarClient.events.get).not.toHaveBeenCalled();
      expect(mockCalendarClient.events.update).not.toHaveBeenCalled();
      expect(result).toBe('Event created but no ID returned');
    });
  });
});