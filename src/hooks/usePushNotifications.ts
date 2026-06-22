import {
  getNotificationDeepLink,
  getPushRegistrationPayload,
} from "@/services/pushNotifications";
import {
  api,
  useGetUnreadNotificationCountQuery,
  useRegisterPushTokenMutation,
  useRemovePushTokenMutation,
} from "../../store/api";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

let cachedPushToken: string | null = null;

export function usePushNotifications(enabled: boolean) {
  const accessToken = useSelector(
    (state: RootState) => state.auth.user?.accessToken,
  );
  const [registerPushToken] = useRegisterPushTokenMutation();
  const [removePushToken] = useRemovePushTokenMutation();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!enabled || !accessToken) return;

    let active = true;

    const syncPushToken = async () => {
      try {
        const payload = await getPushRegistrationPayload();
        if (!active || !payload) return;

        cachedPushToken = payload.token;
        await registerPushToken(payload).unwrap();
      } catch (error) {
        console.warn("[push] Token registration failed:", error);
      }
    };

    void syncPushToken();

    receivedListener.current = Notifications.addNotificationReceivedListener(
      () => {
        void api.util.invalidateTags(["Notification"]);
      },
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, string>
          | undefined;
        const url = getNotificationDeepLink(data);
        if (url) {
          router.push(url as never);
        }
        void api.util.invalidateTags(["Notification"]);
      });

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncPushToken();
        void api.util.invalidateTags(["Notification"]);
      }
    });

    return () => {
      active = false;
      receivedListener.current?.remove();
      responseListener.current?.remove();
      appStateSub.remove();
    };
  }, [enabled, accessToken, registerPushToken]);

  useEffect(() => {
    if (enabled || !cachedPushToken) return;

    const token = cachedPushToken;
    cachedPushToken = null;
    void removePushToken({ token }).catch(() => undefined);
  }, [enabled, removePushToken]);
}

export function useUnreadNotificationCount(skip = false) {
  return useGetUnreadNotificationCountQuery(undefined, {
    skip,
    pollingInterval: 60_000,
  });
}
