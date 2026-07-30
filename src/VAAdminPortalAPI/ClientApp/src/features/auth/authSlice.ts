import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getAdminInfo } from '../../api/client';
import type { AdminInfo } from '../../api/types';

interface AuthState {
  admin: AdminInfo | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const STORAGE_KEY = 'va-admin-portal.admin';

function loadPersisted(): AdminInfo | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminInfo) : null;
  } catch {
    return null;
  }
}

const persisted = loadPersisted();

const initialState: AuthState = {
  admin: persisted,
  isAuthenticated: persisted != null,
  status: 'idle',
  error: null,
};

// The mock backend has no real auth; we "sign in" by loading the admin profile.
export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: { userId: string; password: string }) => {
    if (!credentials.userId || !credentials.password) {
      throw new Error('Please enter both a user id and a password.');
    }
    const admin = await getAdminInfo(credentials.userId);
    return admin;
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signOut(state) {
      state.admin = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      sessionStorage.removeItem(STORAGE_KEY);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action: PayloadAction<AdminInfo>) => {
        state.status = 'idle';
        state.admin = action.payload;
        state.isAuthenticated = true;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Sign in failed.';
        state.isAuthenticated = false;
      });
  },
});

export const { signOut, clearError } = authSlice.actions;
export default authSlice.reducer;
