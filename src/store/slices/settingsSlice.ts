import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, PiHoleConfig } from '../types';

const initialState: SettingsState = {
  piHoleConfig: null,
  isConnected: false,
  isAuthenticated: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPiHoleConfig: (state, action: PayloadAction<PiHoleConfig>) => {
      state.piHoleConfig = action.payload;
    },
    clearPiHoleConfig: (state) => {
      state.piHoleConfig = null;
      state.isConnected = false;
      state.isAuthenticated = false;
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.lastConnected = new Date().toISOString();
      }
    },
    setAuthenticationStatus: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { 
  setPiHoleConfig, 
  clearPiHoleConfig, 
  setConnectionStatus,
  setAuthenticationStatus 
} = settingsSlice.actions;

export default settingsSlice;