import {BaseQueryApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';
import { setAuthenticationStatus, setConnectionStatus } from '../slices/settingsSlice';

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


function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

// Wrap the base query with better error handling
const baseQueryWithReauth = async (args: string | FetchArgs, api: BaseQueryApi, extraOptions: {}) => {
  const state = api.getState() as RootState;
  const configuredBaseUrl = state.settings?.piHoleConfig?.baseUrl || 'http://pi.hole/api';

  const base = configuredBaseUrl.replace(/\/+$/, '');
  const apiRoot = `${base}/api`;

  const req: FetchArgs = typeof args === 'string' ? { url: args, method: 'GET' } : { ...args };

  // If endpoint already passed an absolute URL (e.g., testConnection), leave it.
  const isAbsolute = typeof req.url === 'string' && /^https?:\/+/.test(req.url!);
  const finalUrl = isAbsolute ? (req.url as string) : joinUrl(apiRoot, req.url as string);

  let result = await customBaseQuery({ ...req, url: finalUrl }, api, extraOptions);

  // Redux integration: update connection status and error details
  const dispatch = api.dispatch;
  if (result.error) {
    if (result.error.status === 'FETCH_ERROR' || result.error.status === 'CUSTOM_ERROR') {
      dispatch(setConnectionStatus(false));
      dispatch(setAuthenticationStatus(false));
      // Optionally, add error details to state (extend settingsSlice if needed)
    }
    if (result.error.status === 'TIMEOUT_ERROR') {
      dispatch(setConnectionStatus(false));
      // Optionally, add error details to state
    }
    if (result.error.status === 401) {
      dispatch(setConnectionStatus(true));
      dispatch(setAuthenticationStatus(false));
    }
  }

  return result;
};
export default baseQueryWithReauth;