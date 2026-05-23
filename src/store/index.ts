import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from 'redux-persist';
import storage from './storage';
import { piHoleApi } from './api/piholeApi';
import serversReducer from './slices/serversSlice';
import { ServersState } from './types';

const serversPersistConfig = {
  key: 'servers',
  storage,
  blacklist: ['sessions'],  // runtime session state resets on each app start
};

export const store = configureStore({
  reducer: {
    servers: persistReducer(serversPersistConfig, serversReducer) as any,
    [piHoleApi.reducerPath]: piHoleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(piHoleApi.middleware),
});

export const persistor = persistStore(store);

// Declare RootState explicitly so selectors see ServersState rather than unknown
// (persistReducer wrapping causes the inferred type to be unknown)
export type RootState = {
  servers: ServersState;
  [key: string]: any;
};
export type AppDispatch = typeof store.dispatch;
