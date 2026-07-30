import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import registrationsReducer from '../features/registrations/registrationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    registrations: registrationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
