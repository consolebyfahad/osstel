function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";
  return configured;
}

function validateApiConfig(): void {
  if (resolveApiBaseUrl()) return;

  const message =
    "EXPO_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env and configure your API URL.";

  if (__DEV__) {
    console.error(`[Osstel] ${message}`);
    return;
  }

  throw new Error(message);
}

validateApiConfig();

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(),
  API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT ?? "30000",
  isApiConfigured: Boolean(resolveApiBaseUrl()),
} as const;
