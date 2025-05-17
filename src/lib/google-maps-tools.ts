import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Function to get API key - allows for runtime checking
const getGoogleMapsApiKey = () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY environment variable is not set. Google Maps tools will not be available.');
  }
  return apiKey;
};

// Input schemas
const geocodeSchema = z.object({
  address: z.string().describe('The address to geocode'),
});

const reverseGeocodeSchema = z.object({
  latitude: z.number().describe('Latitude coordinate'),
  longitude: z.number().describe('Longitude coordinate'),
});

const searchPlacesSchema = z.object({
  query: z.string().describe('Search query'),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional().describe('Optional center point for the search'),
  radius: z.number().optional().describe('Search radius in meters (max 50000)'),
});

const placeDetailsSchema = z.object({
  place_id: z.string().describe('The place ID to get details for'),
});

const distanceMatrixSchema = z.object({
  origins: z.array(z.string()).describe('Array of origin addresses or coordinates'),
  destinations: z.array(z.string()).describe('Array of destination addresses or coordinates'),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).optional().describe('Travel mode'),
});

const elevationSchema = z.object({
  locations: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).describe('Array of locations to get elevation for'),
});

const directionsSchema = z.object({
  origin: z.string().describe('Starting point address or coordinates'),
  destination: z.string().describe('Ending point address or coordinates'),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).optional().describe('Travel mode'),
});

// API Response interfaces
interface GoogleMapsResponse {
  status: string;
  error_message?: string;
}

interface GeocodeResponse extends GoogleMapsResponse {
  results: Array<{
    place_id: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      }
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

interface PlacesSearchResponse extends GoogleMapsResponse {
  results: Array<{
    name: string;
    place_id: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      }
    };
    rating?: number;
    types: string[];
  }>;
}

interface PlaceDetailsResponse extends GoogleMapsResponse {
  result: {
    name: string;
    place_id: string;
    formatted_address: string;
    formatted_phone_number?: string;
    website?: string;
    rating?: number;
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
    opening_hours?: {
      weekday_text: string[];
      open_now: boolean;
    };
    geometry: {
      location: {
        lat: number;
        lng: number;
      }
    };
  };
}

interface DistanceMatrixResponse extends GoogleMapsResponse {
  origin_addresses: string[];
  destination_addresses: string[];
  rows: Array<{
    elements: Array<{
      status: string;
      duration: {
        text: string;
        value: number;
      };
      distance: {
        text: string;
        value: number;
      };
    }>;
  }>;
}

interface ElevationResponse extends GoogleMapsResponse {
  results: Array<{
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
    resolution: number;
  }>;
}

interface DirectionsResponse extends GoogleMapsResponse {
  routes: Array<{
    summary: string;
    legs: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      steps: Array<{
        html_instructions: string;
        distance: {
          text: string;
          value: number;
        };
        duration: {
          text: string;
          value: number;
        };
        travel_mode: string;
      }>;
    }>;
  }>;
}

// Tool implementations
export const googleMapsGeocodeTool = new DynamicStructuredTool({
  name: 'maps_geocode',
  description: 'Convert an address into geographic coordinates',
  schema: geocodeSchema,
  func: async ({ address }) => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json() as GeocodeResponse;

    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.error_message || data.status}`);
    }

    return JSON.stringify({
      location: data.results[0].geometry.location,
      formatted_address: data.results[0].formatted_address,
      place_id: data.results[0].place_id,
    }, null, 2);
  },
});

export const googleMapsReverseGeocodeTool = new DynamicStructuredTool({
  name: 'maps_reverse_geocode',
  description: 'Convert coordinates into an address',
  schema: reverseGeocodeSchema,
  func: async ({ latitude, longitude }) => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('latlng', `${latitude},${longitude}`);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json() as GeocodeResponse;

    if (data.status !== 'OK') {
      throw new Error(`Reverse geocoding failed: ${data.error_message || data.status}`);
    }

    return JSON.stringify({
      formatted_address: data.results[0].formatted_address,
      place_id: data.results[0].place_id,
      address_components: data.results[0].address_components,
    }, null, 2);
  },
});

export const googleMapsSearchPlacesTool = new DynamicStructuredTool({
  name: 'maps_search_places',
  description: 'Search for places using Google Places API',
  schema: searchPlacesSchema,
  func: async ({ query, location, radius }) => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', apiKey);

    if (location) {
      url.searchParams.append('location', `${location.latitude},${location.longitude}`);
    }
    if (radius) {
      url.searchParams.append('radius', radius.toString());
    }

    const response = await fetch(url.toString());
    const data = await response.json() as PlacesSearchResponse;

    if (data.status !== 'OK') {
      throw new Error(`Place search failed: ${data.error_message || data.status}`);
    }

    return JSON.stringify({
      places: data.results.map((place) => ({
        name: place.name,
        formatted_address: place.formatted_address,
        location: place.geometry.location,
        place_id: place.place_id,
        rating: place.rating,
        types: place.types,
      })),
    }, null, 2);
  },
});

export const googleMapsPlaceDetailsTool = new DynamicStructuredTool({
  name: 'maps_place_details',
  description: 'Get detailed information about a specific place',
  schema: placeDetailsSchema,
  func: async ({ place_id }) => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', place_id);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json() as PlaceDetailsResponse;

    if (data.status !== 'OK') {
      throw new Error(`Place details request failed: ${data.error_message || data.status}`);
    }

    return JSON.stringify({
      name: data.result.name,
      formatted_address: data.result.formatted_address,
      location: data.result.geometry.location,
      formatted_phone_number: data.result.formatted_phone_number,
      website: data.result.website,
      rating: data.result.rating,
      reviews: data.result.reviews,
      opening_hours: data.result.opening_hours,
    }, null, 2);
  },
});

export const googleMapsDistanceMatrixTool = new DynamicStructuredTool({
  name: 'maps_distance_matrix',
  description: 'Calculate travel distance and time for multiple origins and destinations',
  schema: distanceMatrixSchema,
  func: async ({ origins, destinations, mode = 'driving' }) => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', origins.join('|'));
    url.searchParams.append('destinations', destinations.join('|'));
    url.searchParams.append('mode', mode);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json() as DistanceMatrixResponse;

    if (data.status !== 'OK') {
      throw new Error(`Distance matrix request failed: ${data.error_message || data.status}`);
    }

    return JSON.stringify({
      origin_addresses: data.origin_addresses,
      destination_addresses: data.destination_addresses,
      results: data.rows.map((row) => ({
        elements: row.elements.map((element) => ({
          status: element.status,
          duration: element.duration,
          distance: element.distance,
        })),
      })),
    }, null, 2);
  },
});

export const googleMapsElevationTool = new DynamicStructuredTool({
  name: 'maps_elevation',
  description: 'Get elevation data for locations on the earth',
  schema: elevationSchema,
  func: async ({ locations }) => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/elevation/json');
    const locationString = locations
      .map((loc) => `${loc.latitude},${loc.longitude}`)
      .join('|');
    url.searchParams.append('locations', locationString);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json() as ElevationResponse;

    if (data.status !== 'OK') {
      throw new Error(`Elevation request failed: ${data.error_message || data.status}`);
    }

    return JSON.stringify({
      results: data.results.map((result) => ({
        elevation: result.elevation,
        location: result.location,
        resolution: result.resolution,
      })),
    }, null, 2);
  },
});

export const googleMapsDirectionsTool = new DynamicStructuredTool({
  name: 'maps_directions',
  description: 'Get directions between two points',
  schema: directionsSchema,
  func: async ({ origin, destination, mode = 'driving' }) => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.append('origin', origin);
    url.searchParams.append('destination', destination);
    url.searchParams.append('mode', mode);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json() as DirectionsResponse;

    if (data.status !== 'OK') {
      throw new Error(`Directions request failed: ${data.error_message || data.status}`);
    }

    return JSON.stringify({
      routes: data.routes.map((route) => ({
        summary: route.summary,
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        steps: route.legs[0].steps.map((step) => ({
          instructions: step.html_instructions,
          distance: step.distance,
          duration: step.duration,
          travel_mode: step.travel_mode,
        })),
      })),
    }, null, 2);
  },
});

// Export all tools
export const googleMapsTools = [
  googleMapsGeocodeTool,
  googleMapsReverseGeocodeTool,
  googleMapsSearchPlacesTool,
  googleMapsPlaceDetailsTool,
  googleMapsDistanceMatrixTool,
  googleMapsElevationTool,
  googleMapsDirectionsTool,
];