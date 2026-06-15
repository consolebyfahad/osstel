export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT ?? "30000",
} as const;
