import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getRegistrations } from '../../api/client';
import type { AiVirtualAssistantRegistration, RegistrationQuery } from '../../api/types';

interface RegistrationsState {
  items: AiVirtualAssistantRegistration[];
  notificationItems: AiVirtualAssistantRegistration[];
  notificationStatus: 'idle' | 'loading' | 'failed';
  notificationError: string | null;
  notificationRequestId: string | null;
  totalCount: number;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
  requestId: string | null;
  selectedRegistration: AiVirtualAssistantRegistration | null;
}

const initialState: RegistrationsState = {
  items: [],
  notificationItems: [],
  notificationStatus: 'idle',
  notificationError: null,
  notificationRequestId: null,
  totalCount: 0,
  status: 'idle',
  error: null,
  requestId: null,
  selectedRegistration: null,
};

export const fetchRegistrations = createAsyncThunk(
  'registrations/fetch',
  async (query: RegistrationQuery = {}) => {
    return await getRegistrations(query);
  },
);

export const fetchRegistrationNotifications = createAsyncThunk(
  'registrations/fetchNotifications',
  async () => {
    return await getRegistrations({ validationStatus: 'Failed', pageIndex: 0, pageSize: 0 });
  },
);

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    selectRegistration(state, action: PayloadAction<AiVirtualAssistantRegistration | null>) {
      state.selectedRegistration = action.payload;
    },
    registrationUpdated(state, action: PayloadAction<AiVirtualAssistantRegistration>) {
      const itemIndex = state.items.findIndex((item) => item.id === action.payload.id);
      if (itemIndex >= 0) state.items[itemIndex] = action.payload;

      const notificationIndex = state.notificationItems.findIndex((item) => item.id === action.payload.id);
      if (action.payload.validationStatus === 'Failed') {
        if (notificationIndex >= 0) state.notificationItems[notificationIndex] = action.payload;
        else state.notificationItems.push(action.payload);
      } else if (notificationIndex >= 0) {
        state.notificationItems.splice(notificationIndex, 1);
      }

      if (state.selectedRegistration?.id === action.payload.id) {
        state.selectedRegistration = action.payload;
      }
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
          state.requestId = null;
          state.items = action.payload.registrations;
          state.totalCount = action.payload.totalCount;
          state.selectedRegistration =
            state.items.find((item) => item.id === state.selectedRegistration?.id) ??
            state.selectedRegistration;
        },
      )
      .addCase(fetchRegistrations.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'failed';
        state.requestId = null;
        state.error = action.error.message ?? 'Failed to load registrations.';
      })
      .addCase(fetchRegistrationNotifications.pending, (state, action) => {
        state.notificationStatus = 'loading';
        state.notificationError = null;
        state.notificationRequestId = action.meta.requestId;
      })
      .addCase(fetchRegistrationNotifications.fulfilled, (state, action) => {
        if (state.notificationRequestId !== action.meta.requestId) return;
        state.notificationStatus = 'idle';
        state.notificationRequestId = null;
        state.notificationItems = action.payload.registrations;
        // Keep details available when the selected bot leaves the failed-only list.
        state.selectedRegistration =
          state.notificationItems.find((item) => item.id === state.selectedRegistration?.id) ??
          state.selectedRegistration;
      })
      .addCase(fetchRegistrationNotifications.rejected, (state, action) => {
        if (state.notificationRequestId !== action.meta.requestId) return;
        state.notificationStatus = 'failed';
        state.notificationRequestId = null;
        state.notificationError = action.error.message ?? 'Failed to load notifications.';
      });
  },
});

export const { registrationUpdated, selectRegistration } = registrationsSlice.actions;
export default registrationsSlice.reducer;
