import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

const rawBaseQuery = fetchBaseQuery({
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const sid = state.auth?.sid;
    if (sid) {
      headers.set('X-FTL-SID', sid);
    }
    
    headers.set('Content-Type', 'application/json');
    
    // Add headers to help with local network access
    headers.set('Accept', 'application/json');
    
    return headers;
  },
  // Increase timeout for local network requests
  timeout: 10000,
});

const normalizeBaseUrl = (url: string): string => {
  return url.trim().replace(/\/+$/, '');
};

const needsAbsoluteUrl = (url: string): boolean => {
  return /^https?:\/\//i.test(url);
};

// Build absolute Pi-hole API URLs from the configured base URL in settings.
export const customBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const configuredBaseUrl = state.settings?.piHoleConfig?.baseUrl;

    console.log('Custom base query', { args, configuredBaseUrl });

    if(typeof args === 'string' && args.startsWith('http')){
     
      return rawBaseQuery(args, api, extraOptions);
    }

    if(typeof args === 'object' && args.url?.startsWith('http')){

      return rawBaseQuery(args, api, extraOptions);
    }

    if (!configuredBaseUrl) {
      return {
        error: {
          status: 'CUSTOM_ERROR',
          error: 'Pi-hole base URL is not configured',
        },
      };
    }

    const apiBase = `${normalizeBaseUrl(configuredBaseUrl)}/api`;
    const originalUrl = typeof args === 'string' ? args : args.url;

    if (!needsAbsoluteUrl(originalUrl)) {
      const normalizedPath = originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`;
      const absoluteUrl = `${apiBase}${normalizedPath}`;

      args =
        typeof args === 'string'
          ? absoluteUrl
          : {
              ...args,
              url: absoluteUrl,
            };
    }

    return rawBaseQuery(args, api, extraOptions);
  };