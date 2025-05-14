#!/usr/bin/env node

/**
 * Test script to verify the EnhancedGoogleCalendarViewTool functionality
 * 
 * This script simulates the processing of different types of queries through
 * our enhanced calendar search tool without making actual API calls.
 * 
 * Usage: 
 * 1. Run with `node scripts/test-enhanced-calendar.js`
 * 2. Check console for output showing how queries are transformed
 */

// Mock the GoogleCalendarViewTool parent class to avoid API calls
class MockGoogleCalendarViewTool {
  constructor(params) {
    this.params = params;
  }
  
  async _call(input) {
    return {
      input,
      message: "This is a mock test - no actual API call was made"
    };
  }
}

// Import the variation generation and time window expansion logic
const { z } = require('zod');

// Define schema similar to the original class
const schema = z.object({
  query: z.string().optional(),
  calendarId: z.string().optional().default("primary"),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  maxResults: z.number().optional().default(20),
  singleEvents: z.boolean().optional().default(true),
});

// Helper method to generate common variations of company/person names
function generateNameVariations(query) {
  const originalQuery = query.trim();
  const words = originalQuery.split(/\s+/);
  
  // Base variations
  const variations = [
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
function expandTimeWindow(input, query) {
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
  
  return input;
}

// Function to simulate a search query
async function simulateCalendarSearch(queryString) {
  console.log(`\n------------------------------`);
  console.log(`Testing query: "${queryString}"`);
  console.log(`------------------------------`);
  
  // Initialize input object
  const input = { query: queryString };
  
  // Keep original query for search window expansion logic
  const originalQuery = input.query || '';
  
  // Expand time window based on query context
  const expandedInput = expandTimeWindow(input, originalQuery);
  console.log(`Time window expansion:`, {
    timeMin: expandedInput.timeMin,
    timeMax: expandedInput.timeMax
  });

  // Process query with advanced fuzzy search capabilities
  if (input.query) {
    // Generate variations of the query
    const variations = generateNameVariations(input.query);
    
    // Replace original query with OR-joined variations
    input.query = variations.join(' OR ');
    
    console.log(`Generated ${variations.length} variations for "${originalQuery}":`);
    console.log(variations);
    console.log(`\nResulting search query:`, input.query);
  }
  
  return {
    original: originalQuery,
    expanded: input
  };
}

// Test different query types
async function runTests() {
  // Test single company name
  await simulateCalendarSearch("sendblue");
  
  // Test with time reference
  await simulateCalendarSearch("meeting tomorrow");
  
  // Test multi-word company name
  await simulateCalendarSearch("Acme Corporation");
  
  // Test with company suffix
  await simulateCalendarSearch("Apple Inc");
  
  // Test with time range
  await simulateCalendarSearch("next week doctor");
}

// Run the tests
runTests().then(() => {
  console.log("\nAll tests completed!");
});