import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getRegistrations } from '../../api/client';
import type { AiVirtualAssistantRegistration, RegistrationQuery } from '../../api/types';

interface RegistrationsState {
  items: AiVirtualAssistantRegistration[];
  chartItems: AiVirtualAssistantRegistration[];
  totalCount: number;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
  selectedId: string | null;
}

const initialState: RegistrationsState = {
  items: [],
  chartItems: [],
  totalCount: 0,
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

export const fetchRegistrationCharts = createAsyncThunk(
  'registrations/fetchCharts',
  async (query: RegistrationQuery = {}) => {
    return await getRegistrations({ ...query, pageIndex: 0, pageSize: 0 });
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
        (state, action) => {
          state.status = 'idle';
          state.items = action.payload.registrations;
          state.totalCount = action.payload.totalCount;
        },
      )
      .addCase(fetchRegistrations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load registrations.';
      })
      .addCase(fetchRegistrationCharts.fulfilled, (state, action) => {
        state.chartItems = action.payload.registrations;
      });
  },
});

export const { selectRegistration } = registrationsSlice.actions;
export default registrationsSlice.reducer;
