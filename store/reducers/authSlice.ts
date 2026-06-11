import type { AuthState, AuthUser } from "@/types/auth";
import type { UserRole } from "@/types/role";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

export const sendLoginOtp = createAsyncThunk(
  "auth/sendLoginOtp",
  async (
    { phone, role }: { phone: string; role: UserRole },
    { rejectWithValue },
  ) => {
    try {
      // TODO: wire API when endpoint is ready
      // await dispatch(api.endpoints.sendOtp.initiate({ phone, role })).unwrap();
      return { phone, role };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send OTP";
      return rejectWithValue(message);
    }
  },
);

export const verifyLoginOtp = createAsyncThunk(
  "auth/verifyLoginOtp",
  async (
    {
      phone,
      role,
      otp: _otp,
    }: { phone: string; role: UserRole; otp: string },
    { rejectWithValue },
  ) => {
    try {
      // TODO: wire API when endpoint is ready
      // const response = await dispatch(
      //   api.endpoints.verifyOtp.initiate({ phone, role, otp }),
      // ).unwrap();

      const user: AuthUser = {
        phone,
        role,
        accessToken: null,
        isVerified: role === "tenant",
      };

      return user;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Invalid OTP";
      return rejectWithValue(message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      dispatch({ type: "persist/PURGE" });
    } catch (error) {
      console.warn("Failed to purge persisted auth state:", error);
    }

    return null;
  },
);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    setAuthUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;
    },
    updateAuthUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendLoginOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendLoginOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendLoginOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyLoginOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState, { isInitialized: true });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(REHYDRATE, (state, action) => {
        const persistedAuth = (
          action as { payload?: { auth?: AuthState } }
        ).payload?.auth;

        if (persistedAuth) {
          state.user = persistedAuth.user;
          state.isAuthenticated = persistedAuth.isAuthenticated;
        }

        state.isInitialized = true;
      });
  },
});

export const {
  clearError,
  setInitialized,
  setAuthUser,
  updateAuthUser,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;
