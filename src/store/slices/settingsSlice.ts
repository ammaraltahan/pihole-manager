import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, PiHoleConfig } from '../types';

const initialState: SettingsState = {
  piHoleConfig: null,
  profiles: [],
  selectedProfileId: null,
  isConnected: false,
  isAuthenticated: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPiHoleConfig: (state, action: PayloadAction<PiHoleConfig>) => {
      state.piHoleConfig = action.payload;
      // If not in profiles, add it
      if (!state.profiles.find(p => p.baseUrl === action.payload.baseUrl)) {
        state.profiles.push(action.payload);
      }
      state.selectedProfileId = action.payload.baseUrl;
    },
    clearPiHoleConfig: (state) => {
      state.piHoleConfig = null;
      state.isConnected = false;
      state.isAuthenticated = false;
      state.selectedProfileId = null;
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
    addProfile: (state, action: PayloadAction<PiHoleConfig>) => {
      if (!state.profiles.find(p => p.baseUrl === action.payload.baseUrl)) {
        state.profiles.push(action.payload);
      }
    },
    editProfile: (state, action: PayloadAction<PiHoleConfig>) => {
      const idx = state.profiles.findIndex(p => p.baseUrl === action.payload.baseUrl);
      if (idx !== -1) {
        state.profiles[idx] = action.payload;
      }
      if (state.selectedProfileId === action.payload.baseUrl) {
        state.piHoleConfig = action.payload;
      }
    },
    removeProfile: (state, action: PayloadAction<string>) => {
      state.profiles = state.profiles.filter(p => p.baseUrl !== action.payload);
      if (state.selectedProfileId === action.payload) {
        state.selectedProfileId = null;
        state.piHoleConfig = null;
        state.isConnected = false;
        state.isAuthenticated = false;
      }
    },
    selectProfile: (state, action: PayloadAction<string>) => {
      const profile = state.profiles.find(p => p.baseUrl === action.payload);
      if (profile) {
        state.selectedProfileId = profile.baseUrl;
        state.piHoleConfig = profile;
        // Reset connection/auth state for new profile
        state.isConnected = false;
        state.isAuthenticated = false;
        state.lastConnected = undefined;
      }
    },
    clearProfiles: (state) => {
      state.profiles = [];
      state.selectedProfileId = null;
      state.piHoleConfig = null;
      state.isConnected = false;
      state.isAuthenticated = false;
    },
  },
});

export const { 
  setPiHoleConfig, 
  clearPiHoleConfig, 
  setConnectionStatus,
  setAuthenticationStatus,
  addProfile,
  editProfile,
  removeProfile,
  selectProfile,
  clearProfiles
} = settingsSlice.actions;

export default settingsSlice;