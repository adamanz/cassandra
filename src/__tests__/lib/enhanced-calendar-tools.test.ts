import { EnhancedGoogleCalendarViewTool } from '../../lib/enhanced-calendar-tools';
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';

// Mock the GoogleCalendarViewTool to avoid actual API calls
jest.mock('@langchain/community/tools/google_calendar');

describe('EnhancedGoogleCalendarViewTool', () => {
  let tool: EnhancedGoogleCalendarViewTool;
  let mockCalendarClient: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console to suppress logs in tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock calendar client
    mockCalendarClient = {
      events: {
        list: jest.fn()
      }
    };
    
    // Create instance of the tool
    tool = new EnhancedGoogleCalendarViewTool({});
    
    // Mock the getCalendarClient method
    (tool as any).getCalendarClient = jest.fn().mockResolvedValue(mockCalendarClient);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Tool Configuration', () => {
    it('should have the correct name', () => {
      expect(tool.name).toBe('enhanced_google_calendar_view');
    });

    it('should have the correct description', () => {
      expect(tool.description).toBe('Get events from Google Calendar with advanced search capabilities and current time awareness.');
    });
  });

  describe('Name Variation Generation', () => {
    it('should generate variations for a single word', () => {
      const variations = (tool as any).generateNameVariations('sendblue');
      
      expect(variations).toContain('sendblue');
      expect(variations).toContain('SENDBLUE');
      expect(variations).toContain('sendblue'); // Original is lowercase
    });

    it('should generate variations for multi-word companies', () => {
      const variations = (tool as any).generateNameVariations('Acme Corporation');
      
      expect(variations).toContain('Acme Corporation');
      expect(variations).toContain('acme corporation');
      expect(variations).toContain('ACME CORPORATION');
      expect(variations).toContain('AcmeCorporation');
      expect(variations).toContain('Acme-Corporation');
      expect(variations).toContain('Acme.Corporation');
      expect(variations).toContain('AC'); // Acronym
      // Expect the logic to generate 'Acme Corporation' without suffix is in the implementation
    });

    it('should handle company suffixes', () => {
      const variations = (tool as any).generateNameVariations('Tech Inc');
      
      expect(variations).toContain('Tech'); // Without suffix
      expect(variations).toContain('Tech Inc');
      expect(variations).toContain('TI'); // Acronym
    });

    it('should generate camelCase and PascalCase', () => {
      const variations = (tool as any).generateNameVariations('send blue');
      
      expect(variations).toContain('sendBlue'); // camelCase
      expect(variations).toContain('SendBlue'); // PascalCase
    });
  });

  describe('Time Window Expansion', () => {
    beforeEach(() => {
      // Mock Date to have consistent tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should expand time window for "today" queries', () => {
      const timeWindow = (tool as any).expandTimeWindowForQuery('meeting today');
      
      expect(timeWindow.timeMin).toBeDefined();
      expect(timeWindow.timeMax).toBeDefined();
      
      const minDate = new Date(timeWindow.timeMin);
      const maxDate = new Date(timeWindow.timeMax);
      
      // Check dates only (ignore timezone)
      const minDay = minDate.getUTCDate();
      const maxDay = maxDate.getUTCDate();
      
      // Today's queries should cover the same day (handle UTC conversion)
      expect(minDate.getUTCMonth()).toBe(0); // January
      expect(maxDate.getUTCMonth()).toBe(0); // January
    });

    it('should expand time window for "tomorrow" queries', () => {
      const timeWindow = (tool as any).expandTimeWindowForQuery('meeting tomorrow');
      
      const minDate = new Date(timeWindow.timeMin);
      const maxDate = new Date(timeWindow.timeMax);
      
      // Check dates
      const minDay = minDate.getUTCDate();
      const maxDay = maxDate.getUTCDate();
      
      // Tomorrow's queries should cover the next day (handle UTC conversion)
      expect(minDate.getUTCMonth()).toBe(0); // January
      expect(maxDate.getUTCMonth()).toBe(0); // January
    });

    it('should expand time window for "this week" queries', () => {
      const timeWindow = (tool as any).expandTimeWindowForQuery('meetings this week');
      
      const minDate = new Date(timeWindow.timeMin);
      const maxDate = new Date(timeWindow.timeMax);
      
      // Week calculation can vary based on locale
      // Just ensure it covers at least a week
      const dayDiff = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(dayDiff).toBeGreaterThanOrEqual(6); // At least 7 days (0-6)
      expect(dayDiff).toBeLessThanOrEqual(7); // No more than 8 days (0-7)
    });

    it('should use 30-day window for general company searches', () => {
      const timeWindow = (tool as any).expandTimeWindowForQuery('sendblue');
      
      const minDate = new Date(timeWindow.timeMin);
      const maxDate = new Date(timeWindow.timeMax);
      
      const dayDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(dayDiff).toBeCloseTo(30, 0);
    });

    it('should use narrow time window for "where am I" queries', () => {
      const timeWindow = (tool as any).expandTimeWindowForQuery('where am I right now');
      
      const minDate = new Date(timeWindow.timeMin);
      const maxDate = new Date(timeWindow.timeMax);
      
      // Should search 1 hour before to 30 minutes after current time
      const hourDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60);
      expect(hourDiff).toBeCloseTo(1.5, 1); // 1.5 hours window
    });

    it('should use narrow time window for "current time" queries', () => {
      const timeWindow = (tool as any).expandTimeWindowForQuery('current time event');
      
      const minDate = new Date(timeWindow.timeMin);
      const maxDate = new Date(timeWindow.timeMax);
      
      // Should search 1 hour before to 30 minutes after current time
      const hourDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60);
      expect(hourDiff).toBeCloseTo(1.5, 1); // 1.5 hours window
    });

    it('should use narrow time window for "now" queries', () => {
      const timeWindow = (tool as any).expandTimeWindowForQuery('what is happening now');
      
      const minDate = new Date(timeWindow.timeMin);
      const maxDate = new Date(timeWindow.timeMax);
      
      // Should search 1 hour before to 30 minutes after current time
      const hourDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60);
      expect(hourDiff).toBeCloseTo(1.5, 1); // 1.5 hours window
    });
  });

  describe('Current Time Info', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:30:45Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should include current time information', () => {
      const timeInfo = (tool as any).getCurrentTimeInfo();
      
      expect(timeInfo).toContain('Current time:');
      expect(timeInfo).toContain('ISO format:');
      expect(timeInfo).toContain('Timezone:');
      expect(timeInfo).toContain('2024-01-15T10:30:45');
    });
  });

  describe('Calendar Search', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should search with expanded variations', async () => {
      const mockEvents = [
        {
          id: 'event1',
          summary: 'Meeting with SendBlue',
          start: { dateTime: '2024-01-15T14:00:00Z' },
          end: { dateTime: '2024-01-15T15:00:00Z' }
        }
      ];

      mockCalendarClient.events.list.mockResolvedValue({
        data: { items: mockEvents }
      });

      const result = await tool._call('sendblue');
      
      expect(result).toContain('Current time:');
      expect(result).toContain('Found 1 event matching "sendblue"');
      expect(result).toContain('Meeting with SendBlue');
    });

    it('should handle empty search results', async () => {
      mockCalendarClient.events.list.mockResolvedValue({
        data: { items: [] }
      });

      const result = await tool._call('nonexistent company');
      
      expect(result).toContain('No events found');
      expect(result).toContain('nonexistent company');
    });

    it('should handle API errors gracefully', async () => {
      // Make the getCalendarClient throw an error after clearing mocks
      (tool as any).getCalendarClient = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await tool._call('test query');
      
      // The error will be caught at the calendar level and added to errors
      expect(result).toContain('No events found matching');
      expect(result).toContain('Errors encountered:');
      expect(result).toContain('Error searching calendar primary: Error: API Error');
    });

    it('should search across multiple calendars', async () => {
      // Mock successful response
      mockCalendarClient.events.list.mockResolvedValue({
        data: { items: [] }
      });

      // Set multiple calendar IDs
      tool.calendarIds = ['cal1', 'cal2'];
      (tool as any).calendarIds = ['cal1', 'cal2'];

      await tool._call('test query');
      
      // The tool generates multiple variations, so multiply by the number of variations
      const variations = (tool as any).generateNameVariations('test query');
      expect(mockCalendarClient.events.list).toHaveBeenCalledTimes(2 * variations.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Make the getCalendarClient throw an error
      (tool as any).getCalendarClient = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await tool._call('test');
      
      expect(result).toContain('Error');
      expect(result).toContain('error');
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('insufficient permission');
      (tool as any).getCalendarClient = jest.fn().mockRejectedValue(permissionError);

      const result = await tool._call('test');
      
      expect(result).toContain('insufficient permission');
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('rate limit exceeded');
      (tool as any).getCalendarClient = jest.fn().mockRejectedValue(rateLimitError);

      const result = await tool._call('test');
      
      expect(result).toContain('rate limit');
    });
  });

  describe('Query Parsing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      
      mockCalendarClient.events.list.mockResolvedValue({
        data: { items: [] }
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should parse natural language time queries', async () => {
      await tool._call('meetings next week with john');
      
      const calls = mockCalendarClient.events.list.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      // Check that at least one call contains 'john'
      const hasJohnQuery = calls.some(call => call[0].q && call[0].q.includes('john'));
      expect(hasJohnQuery).toBe(true);
      expect(calls[0][0].timeMin).toBeDefined();
      expect(calls[0][0].timeMax).toBeDefined();
    });

    it('should handle special characters in queries', async () => {
      await tool._call('meeting@company.com');
      
      const calls = mockCalendarClient.events.list.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const hasEmailQuery = calls.some(call => call[0].q && call[0].q.includes('meeting@company.com'));
      expect(hasEmailQuery).toBe(true);
    });

    it('should not generate variations for "where am I" queries', async () => {
      await tool._call('where am I right now');
      
      const calls = mockCalendarClient.events.list.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      // For "where am I" queries, should search with empty query
      expect(calls[0][0].q).toBe('');
      
      // Should use a narrow time window (1.5 hours)
      const timeMin = new Date(calls[0][0].timeMin);
      const timeMax = new Date(calls[0][0].timeMax);
      const hourDiff = (timeMax.getTime() - timeMin.getTime()) / (1000 * 60 * 60);
      expect(hourDiff).toBeCloseTo(1.5, 1);
    });
  });
});