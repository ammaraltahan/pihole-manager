import { BaseQueryApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ServersState } from '../types';

const baseQueryWithReauth = async (args: string | FetchArgs, api: BaseQueryApi, extraOptions: {}) => {
  const state = api.getState() as { servers: ServersState };
  const { servers, activeServerId, sessions } = state.servers;
  const activeServer = servers.find(s => s.id === activeServerId);
  const sid = activeServerId ? sessions[activeServerId]?.sid : undefined;

  const rawQuery = fetchBaseQuery({
    baseUrl: `${activeServer?.baseUrl ?? ''}/api`,
    prepareHeaders: (headers) => {
      if (sid) headers.set('X-FTL-SID', sid);
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      headers.set('User-Agent', 'PiHoleManager/1.0.0');
      return headers;
    },
    timeout: 10000,
  });

  let result = await rawQuery(args, api, extraOptions);

  if (result.error && result.error.status === 'FETCH_ERROR') {
    result.error = {
      status: 'CUSTOM_ERROR',
      error: 'Network request failed. Check your connection and ensure you can access the Pi-hole server.',
      data: {
        message: 'Network request failed. ' + JSON.stringify(result.error),
        originalError: result.error,
      },
    };
  }

  if (result.error && result.error.status === 'TIMEOUT_ERROR') {
    result.error = {
      status: 'TIMEOUT_ERROR',
      error: 'Network request timed out. ' + JSON.stringify(result.error),
    };
  }

  if (result.error && result.error.status === 401) {
    if (typeof args === 'object' && args.url?.includes('/auth') && args.method === 'GET') {
      return {
        data: {
          connected: true,
          requiresAuth: true,
          message: 'Authentication required',
        },
      };
    }
  }

  return result;
};

export default baseQueryWithReauth;
