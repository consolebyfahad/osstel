import { ENV } from "../config/env";
import { parseAuthTokens } from "@/types/auth";
import { unwrapApiResponse } from "@/utils/api";
import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout, updateUser } from "./reducers/authSlice";
import type { RootState } from "./store";

const AUTH_PATHS_WITHOUT_REFRESH = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
]);

console.log("ENV.API_BASE_URL", ENV.API_BASE_URL);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: ENV.API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.user?.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    return headers;
  },
  timeout: parseInt(ENV.API_TIMEOUT, 10),
});

function getRequestPath(args: string | FetchArgs): string {
  if (typeof args === "string") return args;
  return args.url;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.user?.refreshToken;

    if (!refreshToken) {
      return false;
    }

    const refreshResult = normalizeSuccessData(
      await rawBaseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions,
      ),
    );

    if (refreshResult.error || !refreshResult.data) {
      return false;
    }

    const tokens = parseAuthTokens(refreshResult.data);
    if (!tokens.accessToken) {
      return false;
    }

    api.dispatch(
      updateUser({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? refreshToken,
      }),
    );

    return true;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function normalizeSuccessData<T extends { data?: unknown; error?: unknown }>(
  result: T,
): T {
  if (
    !result.error &&
    result.data !== undefined &&
    result.data !== null
  ) {
    return { ...result, data: unwrapApiResponse(result.data) };
  }
  return result;
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = normalizeSuccessData(await rawBaseQuery(args, api, extraOptions));

  if (result.error?.status === 403) {
    const state = api.getState() as RootState;
    if (state.auth.isAuthenticated) {
      api.dispatch(logout());
    }
    return result;
  }

  if (result.error?.status !== 401) {
    return result;
  }

  const path = getRequestPath(args);
  if (AUTH_PATHS_WITHOUT_REFRESH.has(path)) {
    return result;
  }

  const state = api.getState() as RootState;
  if (!state.auth.isAuthenticated) {
    return result;
  }

  const refreshed = await refreshAccessToken(api, extraOptions);
  if (!refreshed) {
    api.dispatch(logout());
    return result;
  }

  result = normalizeSuccessData(await rawBaseQuery(args, api, extraOptions));

  if (result.error?.status === 401) {
    api.dispatch(logout());
  }

  return result;
};
