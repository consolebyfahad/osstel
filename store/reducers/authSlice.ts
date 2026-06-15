import type { AuthState, AuthUser } from "@/types/auth";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
  hasSeenWelcome: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    setHasSeenWelcome: (state) => {
      state.hasSeenWelcome = true;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      const hasSeenWelcome = state.hasSeenWelcome;
      Object.assign(state, initialState, {
        isInitialized: true,
        hasSeenWelcome,
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action) => {
      const persistedAuth = (
        action as { payload?: { auth?: AuthState } }
      ).payload?.auth;

      if (persistedAuth) {
        state.user = persistedAuth.user;
        state.isAuthenticated = persistedAuth.isAuthenticated;
        state.hasSeenWelcome = persistedAuth.hasSeenWelcome ?? false;
      }

      state.isInitialized = true;
    });
  },
});

export const {
  clearError,
  setUser,
  setInitialized,
  setHasSeenWelcome,
  updateUser,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
