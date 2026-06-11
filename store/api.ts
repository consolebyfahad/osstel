import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ENV } from "../config/env";
import type { RootState } from "./store";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: ENV.API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const user = state.auth.user;
      if (user?.accessToken) {
        headers.set("authorization", `Bearer ${user.accessToken}`);
      }
      headers.set("content-type", "application/json");
      return headers;
    },
    timeout: 30000,
  }),
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => ({
        url: `/users/getUser/${id}`,
        method: "GET",
      }),
    }),

    sendOtp: builder.mutation({
      query: ({ phone, role }) => ({
        url: "/auth/send-otp",
        method: "POST",
        body: { phone, role },
      }),
    }),

    verifyOtp: builder.mutation({
      query: ({ phone, role, otp }) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: { phone, role, otp },
      }),
    }),
  }),
});

export const {
  useLazyGetUserQuery,
  useSendOtpMutation,
  useVerifyOtpMutation,
} = api;
