describe('Google Maps Environment Variable', () => {
  const originalEnv = process.env;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules(); // Clear module cache
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleWarnSpy.mockRestore();
  });

  it('should warn when GOOGLE_MAPS_API_KEY is not set', async () => {
    // Remove the API key
    delete process.env.GOOGLE_MAPS_API_KEY;
    
    // Import the module
    const { googleMapsGeocodeTool } = require('@/lib/google-maps-tools');
    
    // The warning should be triggered when we try to use the tool
    try {
      await googleMapsGeocodeTool.func({ address: 'Test' });
    } catch {
      // We expect an error, but we're testing the warning
    }
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'GOOGLE_MAPS_API_KEY environment variable is not set. Google Maps tools will not be available.'
    );
  });

  it('should not warn when GOOGLE_MAPS_API_KEY is set', async () => {
    // Set the API key
    process.env.GOOGLE_MAPS_API_KEY = 'test-key';
    
    // Clear module cache
    jest.resetModules();
    
    // Mock fetch for successful response
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({ status: 'OK', results: [] }),
    });
    
    // Import the module
    const { googleMapsGeocodeTool } = require('@/lib/google-maps-tools');
    
    // Use the tool (with a mock success)
    try {
      await googleMapsGeocodeTool.func({ address: 'Test' });
    } catch {
      // Ignore any errors
    }
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should throw error when trying to use tools without API key', async () => {
    // Remove the API key
    delete process.env.GOOGLE_MAPS_API_KEY;
    
    // Import the module
    const { googleMapsGeocodeTool } = require('@/lib/google-maps-tools');
    
    // Try to use the tool - should throw error
    await expect(
      googleMapsGeocodeTool.func({ address: 'Test Address' })
    ).rejects.toThrow('Google Maps API key is not configured');
  });
});