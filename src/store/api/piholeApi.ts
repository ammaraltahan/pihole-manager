import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { AuthRequest, AuthResponse, BlockingStatus, QueryLogResponse, TestAuthResponse } from '../types';
import { PiHoleSummary, RecentBlocked, SystemInfo } from '../../types/pihole';
import { PiHoleVersionResponse } from '../../types/piholeVersionResponse';
import baseQueryWithReauth from './baseQuery';

export const piHoleApi = createApi({
  reducerPath: 'piHoleApi',
  tagTypes: ['Summary', 'Status', 'Queries', 'Auth'],
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // Authentication endpoints
    // Test connection
    testConnection: builder.query<TestAuthResponse, { baseUrl: string }>({
      query: ({ baseUrl }) => ({
        url: `${baseUrl}/api/auth`,
        // Don't throw on 401 - that's expected
        validateStatus: (response, _body: any) => {
          return response.status === 200 || response.status === 401;
        },
      }),
      providesTags: ['Auth'],
      transformResponse: (baseQueryReturnValue: TestAuthResponse, meta, arg) =>{
        if(meta?.response?.ok){
          return {
            ...baseQueryReturnValue,
            connected: true,
            requiresAuth: false,
            message: 'Connected to Pi-hole server',
          };
        }

        return {
          ...baseQueryReturnValue,
          connected: true,
          requiresAuth: meta?.response?.status === 401,
          message: 'Connected to Pi-hole server',
        };
      },
      transformErrorResponse: (response: any) => {
        if (response.status === 'NETWORK_ERROR') {
          return {
            connected: false,
            requiresAuth: false,
            message: 'Network error: Cannot reach Pi-hole server'
          };
        }
        return {
          connected: false,
          requiresAuth: false,
          message: `Connection failed: ${response.status}`
        };
      },
    }),

    checkAuthRequired: builder.query<AuthResponse, void>({
      query: () => '/auth',
      providesTags: ['Auth'],
      transformErrorResponse: (error: FetchBaseQueryError) => {
        if(error.status === 401){
          return {
            requiresAuth: true,
            connected: true,
            message: `Authentication required: ${error.status} ${JSON.stringify(error.data ?? '{}')}`
          };
        }

        if (error.status === 'FETCH_ERROR') {
          return { requiresAuth: false, connected: false, message: `Network Error: Cannot reach server. ${error.error} | ${error.data}`};
        }
        else {
          return {
            requiresAuth: null,
            connected: false,
            message: `Connection error: ${error.status} ${JSON.stringify(error.data ?? '{}')}`
          }
        }
      }
    }),
    login: builder.mutation<AuthResponse, AuthRequest>({
      query: (credentials) => ({
        url: '/auth',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
      transformErrorResponse: (response: FetchBaseQueryError) => {
        if (response.status === 'FETCH_ERROR') {
          return {
            success: false,
            message: 'Network error: Cannot reach Pi-hole server'
          };
        }
        return {
          success: false,
          message: `Login failed: ${response.status} ${JSON.stringify(response.data ?? '{}')}`
        };
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth',
        method: 'DELETE'
      }),
      invalidatesTags: ['Auth']
    }),

    deleteSession: builder.mutation<void, { sid: string }>({
      query: ({ sid }) => ({
        url: `/auth/session/${sid}?${new URLSearchParams({sid: sid}).toString()}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth']
    }),

    // Metrics endpoints
    getSummary: builder.query<PiHoleSummary, void>({
      query: () => '/stats/summary',
      providesTags: ['Summary'],
      keepUnusedDataFor: 30,
    }),

    getRecentBlocked: builder.query<RecentBlocked, void>({
      query: () => '/stats/recent_blocked',
      providesTags: ['Summary'],
    }),

    getTopItems: builder.query<any, { type: 'clients' | 'domains' }>({
      query: ({ type }) => `/stats/top_${type}`,
    }),

    // DNS Control endpoints
    getBlockingStatus: builder.query<BlockingStatus, void>({
      query: () => '/dns/blocking',
      providesTags: ['Status'],
    }),

    enableBlocking: builder.mutation<void, void>({
      query: () => ({
        url: '/dns/blocking',
        method: 'POST',
        body: { enable: true },
      }),
      invalidatesTags: ['Status', 'Summary'],
    }),

    disableBlocking: builder.mutation<void, { duration?: number }>({
      query: ({ duration }) => ({
        url: '/dns/blocking',
        method: 'POST',
        body: { enable: false, ...(duration && { duration }) },
      }),
      invalidatesTags: ['Status', 'Summary'],
    }),

    // Query logs
    getQueries: builder.query<QueryLogResponse, { 
      limit?: number; 
      offset?: number;
      client?: string;
      domain?: string;
      type?: string;
    }>({
      query: (params = {}) => ({
        url: '/queries',
        params: {
          limit: params.limit || 100,
          offset: params.offset || 0,
          ...(params.client && { client: params.client }),
          ...(params.domain && { domain: params.domain }),
          ...(params.type && { type: params.type }),
        },
      }),
      providesTags: ['Queries'],
    }),

    // System info
    getVersion: builder.query<PiHoleVersionResponse, void>({
      query: () => '/info/version',
    }),

    getSystemInfo: builder.query<SystemInfo, void>({
      query: () => '/info/system',
    }),

    // Actions
    flushLogs: builder.mutation<void, void>({
      query: () => ({
        url: '/action/flush/logs',
        method: 'POST',
      }),
      invalidatesTags: ['Summary', 'Queries'],
    }),

    restartDNS: builder.mutation<void, void>({
      query: () => ({
        url: '/action/restartdns',
        method: 'POST',
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Auth
  useCheckAuthRequiredQuery,
  useLoginMutation,
  useLogoutMutation,
  useDeleteSessionMutation,
  
  // Metrics
  useGetSummaryQuery,
  useGetRecentBlockedQuery,
  useGetTopItemsQuery,
  
  // DNS Control
  useGetBlockingStatusQuery,
  useEnableBlockingMutation,
  useDisableBlockingMutation,
  
  // Logs
  useGetQueriesQuery,
  
  // System
  useGetVersionQuery,
  useGetSystemInfoQuery,
  
  // Actions
  useFlushLogsMutation,
  useRestartDNSMutation,
  
  // Connection
  useLazyTestConnectionQuery,
} = piHoleApi;