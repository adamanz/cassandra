import { EnhancedGoogleCalendarViewTool } from '../../lib/enhanced-calendar-tools';
import { GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";

// Mock the parent class
jest.mock('@langchain/community/tools/google_calendar', () => {
  return {
    GoogleCalendarViewTool: jest.fn().mockImplementation(() => {
      return {
        _call: jest.fn().mockResolvedValue('Mocked calendar response')
      };
    })
  };
});

describe('EnhancedGoogleCalendarViewTool', () => {
  let tool: EnhancedGoogleCalendarViewTool;
  let mockCallManager: CallbackManagerForToolRun;
  let mockParentCall: jest.Mock;
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    // Mock console to capture logs
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();

    // Create tool instance
    tool = new EnhancedGoogleCalendarViewTool({});
    
    // Mock the parent _call method
    mockParentCall = jest.fn().mockResolvedValue('Mock calendar events');
    (tool as any).constructor.prototype._call = mockParentCall;
    
    // Mock the super._call
    Object.setPrototypeOf(tool, {
      _call: mockParentCall
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  describe('getCurrentTimeInfo', () => {
    it('should return current time information in the correct format', () => {
      const timeInfo = (tool as any).getCurrentTimeInfo();
      
      expect(timeInfo).toContain('Current time:');
      expect(timeInfo).toContain('ISO format:');
      expect(timeInfo).toContain('Timezone:');
      
      // Check that ISO format is valid
      const isoMatch = timeInfo.match(/ISO format: (.+)/);
      expect(isoMatch).toBeTruthy();
      if (isoMatch) {
        expect(() => new Date(isoMatch[1])).not.toThrow();
      }
    });
  });

  describe('generateNameVariations', () => {
    it('should generate variations for single words', () => {
      const variations = (tool as any).generateNameVariations('Google');
      
      expect(variations).toContain('Google');
      expect(variations).toContain('google');
      expect(variations).toContain('GOOGLE');
      expect(variations).toContain('Googl'); // partial match
    });

    it('should generate variations for multiple words', () => {
      const variations = (tool as any).generateNameVariations('Google Calendar');
      
      expect(variations).toContain('Google Calendar');
      expect(variations).toContain('google calendar');
      expect(variations).toContain('GOOGLE CALENDAR');
      expect(variations).toContain('GoogleCalendar'); // no spaces
      expect(variations).toContain('Google-Calendar'); // hyphens
      expect(variations).toContain('googleCalendar'); // camelCase
      expect(variations).toContain('GoogleCalendar'); // PascalCase
      expect(variations).toContain('GC'); // acronym
    });

    it('should handle company suffixes', () => {
      const variations = (tool as any).generateNameVariations('Microsoft Inc');
      
      expect(variations).toContain('Microsoft Inc');
      expect(variations).toContain('Microsoft'); // without suffix
      
      const variations2 = (tool as any).generateNameVariations('Apple');
      expect(variations2).toContain('Apple Inc'); // with suffix
    });
  });

  describe('expandTimeWindowForQuery', () => {
    beforeEach(() => {
      // Mock Date to have consistent tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should expand time window for simple queries', () => {
      const result = (tool as any).expandTimeWindowForQuery('meeting');
      
      expect(result.timeMin).toBeDefined();
      expect(result.timeMax).toBeDefined();
      
      // Should start from yesterday
      const timeMin = new Date(result.timeMin);
      expect(timeMin.toISOString()).toContain('2024-03-14');
      
      // Should end 30 days after timeMin
      const timeMax = new Date(result.timeMax);
      expect(timeMax.toISOString()).toContain('2024-04-14');
    });

    it('should handle "tomorrow" keyword', () => {
      const result = (tool as any).expandTimeWindowForQuery('meeting tomorrow');
      
      const timeMin = new Date(result.timeMin);
      expect(timeMin.toISOString()).toContain('2024-03-16'); // tomorrow
      
      const timeMax = new Date(result.timeMax);
      expect(timeMax.toISOString()).toContain('2024-03-19'); // +3 days buffer
    });

    it('should handle "this week" keyword', () => {
      const result = (tool as any).expandTimeWindowForQuery('meetings this week');
      
      expect(result.timeMin).toBeDefined();
      expect(result.timeMax).toBeDefined();
    });

    it('should handle "next week" keyword', () => {
      const result = (tool as any).expandTimeWindowForQuery('schedule next week');
      
      expect(result.timeMin).toBeDefined();
      expect(result.timeMax).toBeDefined();
    });
  });

  describe('_call method', () => {
    it('should include current time in the response', async () => {
      const result = await tool._call('test query');
      
      expect(result).toContain('Current time:');
      expect(result).toContain('ISO format:');
      expect(result).toContain('Timezone:');
      expect(result).toContain('Mock calendar events');
    });

    it('should generate query variations and call parent with enhanced query', async () => {
      await tool._call('meeting');
      
      expect(mockParentCall).toHaveBeenCalled();
      const callArgs = mockParentCall.mock.calls[0][0];
      expect(callArgs).toContain('meeting');
      expect(callArgs).toContain('OR');
    });

    it('should add time boundaries to the query', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-15T10:00:00Z'));
      
      await tool._call('meeting');
      
      const callArgs = mockParentCall.mock.calls[0][0];
      expect(callArgs).toContain('after:');
      expect(callArgs).toContain('before:');
      
      jest.useRealTimers();
    });

    it('should handle single-word searches with additional context', async () => {
      mockParentCall.mockResolvedValue('No events found');
      
      const result = await tool._call('Google');
      
      expect(result).toContain('Note: I searched for "Google" using multiple variations');
      expect(result).toContain('No events found');
    });

    it('should handle errors with time info included', async () => {
      const error = new Error('token expired');
      mockParentCall.mockRejectedValue(error);
      
      const result = await tool._call('test');
      
      expect(result).toContain('Current time:');
      expect(result).toContain('authentication issue');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle permission errors', async () => {
      const error = new Error('insufficient permission');
      mockParentCall.mockRejectedValue(error);
      
      const result = await tool._call('test');
      
      expect(result).toContain('permissions');
    });

    it('should handle rate limit errors', async () => {
      const error = new Error('rate limit exceeded');
      mockParentCall.mockRejectedValue(error);
      
      const result = await tool._call('test');
      
      expect(result).toContain('rate limit');
    });

    it('should handle generic errors', async () => {
      const error = new Error('unknown error');
      mockParentCall.mockRejectedValue(error);
      
      const result = await tool._call('test');
      
      expect(result).toContain('encountered an issue');
    });
  });

  describe('Class properties', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('enhanced_google_calendar_view');
      expect(tool.description).toBe('Get events from Google Calendar with advanced search capabilities and current time awareness.');
    });
  });
});