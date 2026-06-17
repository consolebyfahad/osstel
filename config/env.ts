import Constants from "expo-constants";
import * as Device from "expo-device";
import { NativeModules, Platform } from "react-native";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
const API_PORT = "5001";
const API_PATH = "/api/v1/";
const DEFAULT_LOCAL_API = `http://127.0.0.1:${API_PORT}${API_PATH}`;

function hostFromUrl(url: string): string | null {
  try {
    const normalized = url.startsWith("exp:")
      ? url.replace(/^exp(?:\+[\w-]+)?:\/\//, "http://")
      : url;
    return new URL(normalized).hostname || null;
  } catch {
    const match = url.match(/(?:https?|exp(?:\+[\w-]+)?):\/\/([^/:]+)/);
    return match?.[1] ?? null;
  }
}

function hostFromEncodedDevClientUrl(uri: string): string | null {
  const urlMatch = uri.match(/[?&]url=([^&]+)/);
  if (!urlMatch?.[1]) return null;

  try {
    return hostFromUrl(decodeURIComponent(urlMatch[1]));
  } catch {
    return null;
  }
}

function getDevServerHost(): string | null {
  const scriptURL = (NativeModules as { SourceCode?: { scriptURL?: string } })
    .SourceCode?.scriptURL;
  if (scriptURL) {
    const host = hostFromUrl(scriptURL);
    if (host) return host;
  }

  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost,
    Constants.linkingUri,
    Constants.experienceUrl,
  ];

  for (const value of candidates) {
    if (!value) continue;

    const host =
      hostFromEncodedDevClientUrl(value) ??
      hostFromUrl(value.includes("://") ? value : `http://${value}`);

    if (host) return host;
  }

  return null;
}

function buildApiUrl(host: string): string {
  return `http://${host}:${API_PORT}${API_PATH}`;
}

function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";
  const manualDevHost = process.env.EXPO_PUBLIC_DEV_MACHINE_HOST?.trim() ?? "";

  if (__DEV__) {
    const devHost = getDevServerHost();
    if (devHost && !LOCAL_HOSTS.has(devHost)) {
      return buildApiUrl(devHost);
    }

    if (Platform.OS === "android" && !Device.isDevice) {
      return buildApiUrl("10.0.2.2");
    }

    if (manualDevHost) {
      return buildApiUrl(manualDevHost);
    }
  }

  return configured || DEFAULT_LOCAL_API;
}

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(),
  API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT ?? "30000",
} as const;

if (__DEV__) {
  console.log("[API] Base URL:", ENV.API_BASE_URL);
}
