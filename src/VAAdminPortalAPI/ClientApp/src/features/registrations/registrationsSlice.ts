import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getNotificationRegistrations, getRegistrations } from '../../api/client';
import type { AiVirtualAssistantRegistration, RegistrationQuery } from '../../api/types';

export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface RegistrationsState {
  items: AiVirtualAssistantRegistration[];
  chartItems: AiVirtualAssistantRegistration[];
  notificationItems: AiVirtualAssistantRegistration[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
  requestId: string | null;
  chartStatus: LoadStatus;
  chartError: string | null;
  chartRequestId: string | null;
  notificationStatus: LoadStatus;
  notificationError: string | null;
  notificationRequestId: string | null;
  selectedId: string | null;
}

const initialState: RegistrationsState = {
  items: [],
  chartItems: [],
  notificationItems: [],
  totalCount: 0,
  pageIndex: 0,
  pageSize: 10,
  status: 'idle',
  error: null,
  requestId: null,
  chartStatus: 'idle',
  chartError: null,
  chartRequestId: null,
  notificationStatus: 'idle',
  notificationError: null,
  notificationRequestId: null,
  selectedId: null,
};

export const fetchRegistrations = createAsyncThunk(
  'registrations/fetch',
  async (query: RegistrationQuery = {}, { signal }) => {
    return await getRegistrations(query, signal);
  },
);

export const fetchNotificationRegistrations = createAsyncThunk(
  'registrations/fetchNotifications',
  async (_, { signal }) => await getNotificationRegistrations(signal),
);

export const fetchRegistrationCharts = createAsyncThunk(
  'registrations/fetchCharts',
  async (query: RegistrationQuery, { signal }) => {
    const snapshot = { ...query };
    const registrations: AiVirtualAssistantRegistration[] = [];
    const ids = new Set<string>();
    let totalCount: number | undefined;

    for (let pageIndex = 0; ; pageIndex += 1) {
      signal.throwIfAborted();
      const page = await getRegistrations({ ...snapshot, pageIndex, pageSize: 100 }, signal);
      signal.throwIfAborted();
      totalCount ??= page.totalCount;
      if (
        !Number.isSafeInteger(totalCount) || totalCount < 0 ||
        page.totalCount !== totalCount || page.pageIndex !== pageIndex || page.pageSize !== 100 ||
        page.registrations.length !== Math.min(100, totalCount - registrations.length)
      ) {
        throw new Error('Analysis data changed or is incomplete. Reload analysis to try again.');
      }
      for (const item of page.registrations) {
        if (ids.has(item.id)) {
          throw new Error('Analysis pages overlap. Reload analysis to try again.');
        }
        ids.add(item.id);
        registrations.push(item);
      }
      if (registrations.length === totalCount) return registrations;
    }
  },
);

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    invalidateRegistrationCharts(state) {
      state.chartItems = [];
      state.chartStatus = 'idle';
      state.chartError = null;
      state.chartRequestId = null;
    },
    selectRegistration(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    registrationUpdated(state, action: PayloadAction<AiVirtualAssistantRegistration>) {
      const itemIndex = state.items.findIndex((item) => item.id === action.payload.id);
      if (itemIndex >= 0) state.items[itemIndex] = action.payload;

      const notificationIndex = state.notificationItems.findIndex((item) => item.id === action.payload.id);
      if (notificationIndex >= 0) state.notificationItems[notificationIndex] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegistrations.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(
        fetchRegistrations.fulfilled,
        (state, action) => {
          if (state.requestId !== action.meta.requestId) return;
          state.status = 'idle';
          state.items = action.payload.registrations;
          state.totalCount = action.payload.totalCount;
          state.pageIndex = action.payload.pageIndex;
          state.pageSize = action.payload.pageSize;
          state.requestId = null;
        },
      )
      .addCase(fetchRegistrations.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = action.meta.aborted ? 'idle' : 'failed';
        state.error = action.meta.aborted ? null : action.error.message ?? 'Failed to load registrations.';
        state.requestId = null;
      })
      .addCase(fetchNotificationRegistrations.pending, (state, action) => {
        state.notificationStatus = 'loading';
        state.notificationError = null;
        state.notificationRequestId = action.meta.requestId;
      })
      .addCase(fetchNotificationRegistrations.fulfilled, (state, action) => {
        if (state.notificationRequestId !== action.meta.requestId) return;
        state.notificationItems = action.payload;
        state.notificationStatus = 'succeeded';
        state.notificationRequestId = null;
      })
      .addCase(fetchNotificationRegistrations.rejected, (state, action) => {
        if (state.notificationRequestId !== action.meta.requestId) return;
        state.notificationStatus = action.meta.aborted ? 'idle' : 'failed';
        state.notificationError = action.meta.aborted ? null : action.error.message ?? 'Failed to load notifications.';
        state.notificationRequestId = null;
      })
      .addCase(fetchRegistrationCharts.pending, (state, action) => {
        state.chartItems = [];
        state.chartStatus = 'loading';
        state.chartError = null;
        state.chartRequestId = action.meta.requestId;
      })
      .addCase(fetchRegistrationCharts.fulfilled, (state, action) => {
        if (state.chartRequestId !== action.meta.requestId) return;
        state.chartItems = action.payload;
        state.chartStatus = 'succeeded';
      })
      .addCase(fetchRegistrationCharts.rejected, (state, action) => {
        if (state.chartRequestId !== action.meta.requestId) return;
        state.chartStatus = action.meta.aborted ? 'idle' : 'failed';
        state.chartError = action.meta.aborted ? null : action.error.message ?? 'Failed to load analysis data.';
      });
  },
});

export const { invalidateRegistrationCharts, registrationUpdated, selectRegistration } = registrationsSlice.actions;
export default registrationsSlice.reducer;
