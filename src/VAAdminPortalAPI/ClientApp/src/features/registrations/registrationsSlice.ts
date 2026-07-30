import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getRegistrations } from '../../api/client';
import type { AiVirtualAssistantRegistration, RegistrationQuery } from '../../api/types';

interface RegistrationsState {
  items: AiVirtualAssistantRegistration[];
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
  selectedId: string | null;
}

const initialState: RegistrationsState = {
  items: [],
  status: 'idle',
  error: null,
  selectedId: null,
};

export const fetchRegistrations = createAsyncThunk(
  'registrations/fetch',
  async (query: RegistrationQuery = {}) => {
    return await getRegistrations(query);
  },
);

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    selectRegistration(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegistrations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(
        fetchRegistrations.fulfilled,
        (state, action: PayloadAction<AiVirtualAssistantRegistration[]>) => {
          state.status = 'idle';
          state.items = action.payload;
        },
      )
      .addCase(fetchRegistrations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load registrations.';
      });
  },
});

export const { selectRegistration } = registrationsSlice.actions;
export default registrationsSlice.reducer;
