import { COLORS } from "@constants/colors";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { RegisterPushTokenBody } from "@/types/notification";

const NOTIFICATION_ROUTE_BY_TYPE: Record<string, string> = {
  rent_bill_finalized: "/(tabs)/rent",
  rent_approved: "/(tabs)/rent",
  rent_rejected: "/(tabs)/rent",
  rent_submitted: "/(tabs)/rent",
  rent_reminder: "/(tabs)/rent",
  rent_alert: "/(tabs)/rent",
  resident_linked_by_manager: "/(tabs)/home",
  join_request_approved: "/(tabs)/home",
  join_request_rejected: "/join-hostel",
  leave_request_approved: "/(tabs)/home",
  leave_request_rejected: "/(tabs)/home",
  plan_request_approved: "/subscription",
  plan_request_rejected: "/subscription",
  subscription_expiring: "/subscription",
  subscription_expired: "/subscription",
  trial_started: "/subscription",
  trial_ending: "/subscription",
  trial_expired: "/subscription",
  account_blocked: "/support",
  support_reply: "/support",
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: COLORS.light.primary,
  });
}

export async function requestNotificationPermissions() {
  if (!Device.isDevice) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getPushRegistrationPayload(): Promise<RegisterPushTokenBody | null> {
  if (!Device.isDevice) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  await ensureAndroidNotificationChannel();

  const platform =
    Platform.OS === "ios"
      ? "ios"
      : Platform.OS === "android"
        ? "android"
        : "web";

  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    if (!deviceToken.data) return null;

    return {
      token: String(deviceToken.data),
      provider: "fcm",
      platform,
    };
  } catch {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn(
        "[push] Native device token unavailable and no EAS projectId configured.",
      );
      return null;
    }

    const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
    return {
      token: expoToken.data,
      provider: "expo",
      platform,
    };
  }
}

export function getNotificationDeepLink(
  data: Record<string, string> | undefined,
) {
  const url = data?.url;
  if (typeof url === "string" && url.startsWith("/")) {
    return url;
  }

  const type = data?.type;
  if (type && NOTIFICATION_ROUTE_BY_TYPE[type]) {
    return NOTIFICATION_ROUTE_BY_TYPE[type];
  }

  if (data?.paymentId) {
    return "/(tabs)/rent";
  }

  if (data?.tenancyId) {
    return "/residents";
  }

  return null;
}
