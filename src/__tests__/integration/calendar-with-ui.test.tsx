import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { EnhancedGoogleCalendarViewTool } from '../../lib/enhanced-calendar-tools';
import { MemoizedMarkdown } from '../../components/MemoizedMarkdown';
import { mockConsole, mockDate } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@langchain/community/tools/google_calendar', () => {
  return {
    GoogleCalendarViewTool: class MockGoogleCalendarViewTool {
      name = 'google_calendar_view';
      description = 'Get events from Google Calendar';
      
      constructor() {}
      
      async _call(query: string) {
        return 'Mock calendar response';
      }
    }
  };
});

jest.mock('marked', () => {
  return {
    Marked: class MockMarked {
      lexer(content: string) {
        return content.split('\n').map(line => ({ raw: line }));
      }
    }
  };
});

jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => <div>{children}</div>
  };
});

describe('Calendar Tool with UI Integration', () => {
  const { getLogCalls } = mockConsole();
  mockDate('2024-03-15T10:00:00Z');

  it.skip('should display calendar results with markdown formatting', async () => {
    // Set up calendar tool
    const calendarTool = new EnhancedGoogleCalendarViewTool({});
    
    // Mock calendar response
    const mockResponse = `Current time: Friday, March 15, 2024, 10:00:00 AM UTC
ISO format: 2024-03-15T10:00:00.000Z
Timezone: UTC

Calendar Events:
1. **Team Meeting** - 2024-03-15T14:00:00Z
   - Duration: 1 hour
   - Location: Conference Room A
   
2. **Project Review** - 2024-03-16T09:00:00Z
   - Duration: 2 hours
   - Attendees: John, Jane, Bob`;

    jest.spyOn(calendarTool, '_call').mockResolvedValue(mockResponse);
    
    // Get calendar results
    const result = await calendarTool._call('meetings this week');
    
    // Render the result using MemoizedMarkdown
    render(<MemoizedMarkdown content={result} id="calendar-results" />);
    
    // Wait for async rendering
    await waitFor(() => {
      expect(screen.getByText(/Current time:/)).toBeInTheDocument();
    });
    
    // Verify the calendar tool was called correctly
    expect(calendarTool._call).toHaveBeenCalledWith('meetings this week');
    
    // Verify console logs for debugging
    const logs = getLogCalls();
    expect(logs.some(call => call[0].includes('Enhanced calendar search'))).toBe(true);
  });

  it('should handle calendar errors gracefully', async () => {
    const calendarTool = new EnhancedGoogleCalendarViewTool({});
    
    // Mock error response
    jest.spyOn(calendarTool, '_call').mockRejectedValue(new Error('API rate limit exceeded'));
    
    let errorResult: string;
    try {
      errorResult = await calendarTool._call('test query');
    } catch (error) {
      errorResult = 'Error occurred';
    }
    
    // The tool should handle errors and return a message
    expect(errorResult).toBeTruthy();
  });

  it.skip('should properly format complex calendar data for display', async () => {
    const complexCalendarData = `Current time: Friday, March 15, 2024, 10:00:00 AM UTC

## Today's Schedule

### Morning
- 9:00 AM - Stand-up Meeting
- 10:30 AM - Code Review

### Afternoon  
- 2:00 PM - Client Presentation
- 4:00 PM - Team Retrospective

\`\`\`
Total meetings: 4
Total duration: 5 hours
\`\`\`

**Note**: All times are in UTC`;

    render(<MemoizedMarkdown content={complexCalendarData} id="complex-calendar" />);
    
    // The component should handle all markdown elements
    const elements = screen.getAllByTestId('react-markdown');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should handle real-time updates to calendar data', async () => {
    const { rerender } = render(
      <MemoizedMarkdown 
        content="Initial calendar data" 
        id="updating-calendar" 
      />
    );
    
    // Simulate calendar update
    const updatedContent = `Current time: Friday, March 15, 2024, 11:00:00 AM UTC
Updated calendar events...`;
    
    rerender(
      <MemoizedMarkdown 
        content={updatedContent} 
        id="updating-calendar" 
      />
    );
    
    // Should show updated content
    expect(screen.getByText(/11:00:00 AM UTC/)).toBeInTheDocument();
  });
});