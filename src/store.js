import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';

import userReducer from './features/userSlice';
import tasksReducer from './features/tasksSlice';
import rewardsReducer from './features/rewardsSlice';
import { syncMiddleware } from './app/syncMiddleware';
import { achievementsMiddleware } from './app/achievementsMiddleware';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
// Vite ESM fix: Define a custom storage wrapper for redux-persist
const customStorage = {
  getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
  setItem: (key, value) => {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const persistConfig = {
  key: 'root',
  storage: customStorage,
  whitelist: ['user', 'tasks', 'rewards'] // Only persist these slices
};

const rootReducer = combineReducers({
  user: userReducer,
  tasks: tasksReducer,
  rewards: rewardsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(syncMiddleware, achievementsMiddleware),
});

export const persistor = persistStore(store);
