import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Server, ServerSession, ServersState } from '../types';

const defaultSession = (): ServerSession => ({
  isConnected: false,
  isAuthenticated: false,
  sid: undefined,
  requiresAuth: true,
});

const initialState: ServersState = {
  servers: [],
  activeServerId: null,
  sessions: {},
};

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    addServer: (state, action: PayloadAction<Server>) => {
      state.servers.push(action.payload);
      if (!state.activeServerId) {
        state.activeServerId = action.payload.id;
      }
    },
    updateServer: (state, action: PayloadAction<Server>) => {
      const idx = state.servers.findIndex(s => s.id === action.payload.id);
      if (idx >= 0) state.servers[idx] = action.payload;
    },
    removeServer: (state, action: PayloadAction<string>) => {
      state.servers = state.servers.filter(s => s.id !== action.payload);
      delete state.sessions[action.payload];
      if (state.activeServerId === action.payload) {
        state.activeServerId = state.servers[0]?.id ?? null;
      }
    },
    setActiveServer: (state, action: PayloadAction<string>) => {
      state.activeServerId = action.payload;
    },
    setServerSession: (state, action: PayloadAction<{ id: string; session: Partial<ServerSession> }>) => {
      state.sessions[action.payload.id] = {
        ...(state.sessions[action.payload.id] ?? defaultSession()),
        ...action.payload.session,
      };
    },
    clearServerSession: (state, action: PayloadAction<string>) => {
      state.sessions[action.payload] = defaultSession();
    },
  },
});

export const {
  addServer,
  updateServer,
  removeServer,
  setActiveServer,
  setServerSession,
  clearServerSession,
} = serversSlice.actions;

export default serversSlice.reducer;

export const selectActiveServer = (state: { servers: ServersState }): Server | null => {
  const { servers, activeServerId } = state.servers;
  return servers.find(s => s.id === activeServerId) ?? null;
};

export const selectActiveSession = (state: { servers: ServersState }): ServerSession => {
  const { sessions, activeServerId } = state.servers;
  return activeServerId ? (sessions[activeServerId] ?? defaultSession()) : defaultSession();
};
