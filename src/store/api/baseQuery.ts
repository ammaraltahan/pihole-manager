import {BaseQueryApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Custom base query with better error handling
const customBaseQuery = fetchBaseQuery({
  baseUrl: 'http://pi.hole/api', // Using full URL to Pi-hole server
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const sid = state.auth?.sid;
    if (sid) {
      headers.set('X-FTL-SID', sid);
    }
    
    headers.set('Content-Type', 'application/json');
    
    // Add headers to help with local network access
    headers.set('Accept', 'application/json');
    headers.set('User-Agent', 'PiHoleManager/1.0.0');
    
    return headers;
  },
  // Increase timeout for local network requests
  timeout: 10000,
});

// Wrap the base query with better error handling
const baseQueryWithReauth = async (args: string | FetchArgs, api: BaseQueryApi, extraOptions: {}) => {
  let result = await customBaseQuery(args, api, extraOptions);

  // Handle network errors
  if (result.error && result.error.status === 'FETCH_ERROR') {
    console.error('Network error:', result.error);
    // Transform network errors to have proper status codes
    result.error = {
      status: 'CUSTOM_ERROR',
      error: "Network request failed. Check your connection and ensure you can access the Pi-hole server.",
      data: {
        message: 'Network request failed.' + JSON.stringify(result.error),
        originalError: result.error
      }
    }
  }

  if(result.error && result.error.status === 'TIMEOUT_ERROR') {
    result.error = {
      status: 'TIMEOUT_ERROR',
      error: "Network request timed out." + JSON.stringify(result.error),
    }
  }
  
  // Handle 401 errors (authentication required)
  if (result.error && result.error.status === 401) {
    // This is expected for auth endpoint without credentials

    if(typeof args === 'object' && args.url?.includes('/auth') && args.method === 'GET') {
       // Transform this into a "success" for connection test purposes
      return {
        data: {
          connected: true,
          requiresAuth: true,
          message: 'Authentication required'
        }
      }
    }
  }
  
  return result;
};
export default baseQueryWithReauth;