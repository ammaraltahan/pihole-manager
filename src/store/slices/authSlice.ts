import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '../types';

const initialState: AuthState = {
  isAuthenticated: false,
  requiresAuth: true, // Assume auth is required until we check
  sid: undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthentication: (state, action: PayloadAction<{ isAuthenticated: boolean; sid: string | null | undefined }>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.sid = action.payload.sid;
    },
    setAuthRequired: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload;
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.sid = undefined;
    },
  },
});

export const { setAuthentication, setAuthRequired, clearAuth } = authSlice.actions;
export default authSlice;