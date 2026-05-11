import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, PiHoleConfig } from '../types';

const initialState: SettingsState = {
  piHoleConfig: null,
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
      state.isAuthenticated = false;
    }
  },
});

export const { 
  setPiHoleConfig, 
  clearPiHoleConfig, 
} = settingsSlice.actions;
export default settingsSlice.reducer;