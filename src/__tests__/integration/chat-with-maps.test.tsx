import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test to ensure Google Maps integration doesn't break the chat
describe('Chat with Google Maps Integration', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.AUTH0_SECRET = 'test-secret';
    process.env.AUTH0_ISSUER_BASE_URL = 'https://test.auth0.com';
    process.env.AUTH0_CLIENT_ID = 'test-client-id';
    process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';
  });

  it('should import Google Maps tools without errors', () => {
    // This test ensures our imports don't break the module system
    expect(() => {
      require('@/lib/google-maps-tools');
    }).not.toThrow();
  });

  it('should have all Google Maps tools exported', () => {
    const tools = require('@/lib/google-maps-tools');
    
    expect(tools.googleMapsGeocodeTool).toBeDefined();
    expect(tools.googleMapsReverseGeocodeTool).toBeDefined();
    expect(tools.googleMapsSearchPlacesTool).toBeDefined();
    expect(tools.googleMapsPlaceDetailsTool).toBeDefined();
    expect(tools.googleMapsDistanceMatrixTool).toBeDefined();
    expect(tools.googleMapsElevationTool).toBeDefined();
    expect(tools.googleMapsDirectionsTool).toBeDefined();
    expect(tools.googleMapsTools).toBeDefined();
    expect(Array.isArray(tools.googleMapsTools)).toBe(true);
    expect(tools.googleMapsTools).toHaveLength(7);
  });

  it('should handle missing Google Maps API key gracefully', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    
    // Re-import to test the warning
    jest.resetModules();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const tools = require('@/lib/google-maps-tools');
    
    // Trigger the warning by trying to use a tool
    try {
      await tools.googleMapsGeocodeTool.func({ address: 'Test' });
    } catch {
      // Expected to throw
    }
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'GOOGLE_MAPS_API_KEY environment variable is not set. Google Maps tools will not be available.'
    );
    
    consoleWarnSpy.mockRestore();
  });
});