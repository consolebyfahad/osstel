import Constants from "expo-constants";
import * as Device from "expo-device";
import { NativeModules, Platform } from "react-native";

function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";
  return configured;
}

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(),
  API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT ?? "30000",
} as const;
