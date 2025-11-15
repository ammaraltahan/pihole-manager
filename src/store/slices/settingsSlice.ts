import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, PiHoleConfig } from '../types';

const initialState: SettingsState = {
  piHoleConfig: {baseUrl: 'http://pi.hole', sid: null},
  authRequired: null,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPiHoleConfig: (state, action: PayloadAction<PiHoleConfig>) => {
      state.piHoleConfig = action.payload;      
    },
    clearPiHoleConfig: (state) => {
      state.piHoleConfig = null;
    },
    setLastConnected: (state, action: PayloadAction<string>) => {
      state.lastConnected = action.payload;
    },
    setAuthRequired: (state, action: PayloadAction<boolean>) => {
      state.authRequired = action.payload;
    }
  },
});

export const { 
  setPiHoleConfig, 
  clearPiHoleConfig, 
  setLastConnected,
  setAuthRequired
} = settingsSlice.actions;

export default settingsSlice;