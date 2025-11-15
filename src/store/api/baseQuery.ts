import {BaseQueryApi, FetchArgs, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';
import { setAuthRequired } from '../slices/settingsSlice';

// Custom base query with better error handling
const customBaseQuery = fetchBaseQuery({
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const sid = state.settings.piHoleConfig?.sid;
    console.log('customBaseQuery: prepareHeaders with sid=', sid);
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


function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

// Wrap the base query with better error handling
const baseQueryWithReauth = async (args: string | FetchArgs, api: BaseQueryApi, extraOptions: {}) => {
  const state = api.getState() as RootState;
  const configuredBaseUrl = state.settings?.piHoleConfig?.baseUrl || 'http://pi.hole';

  const base = configuredBaseUrl.replace(/\/+$/, '');
  const apiRoot = `${base}/api`;

  const req: FetchArgs = typeof args === 'string' ? { url: args, method: 'GET' } : { ...args };

  // If endpoint already passed an absolute URL (e.g., testConnection), leave it.
  const isAbsolute = typeof req.url === 'string' && /^https?:\/+/.test(req.url!);
  const finalUrl = isAbsolute ? (req.url as string) : joinUrl(apiRoot, req.url as string);

  let result = await customBaseQuery({ ...req, url: finalUrl }, api, extraOptions);

  if( result.error && result.error.status === 401) {
    // Unauthorized - update store to indicate auth is required
    console.warn('baseQueryWithReauth: 401 Unauthorized - setting authRequired to true');
    api.dispatch(setAuthRequired(true));
  }

  return result;
};
export default baseQueryWithReauth;