import type { ReactNode } from "react";
import { PLAN_FEATURES } from "@/constants/plans";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSubscription } from "@/hooks/useSubscription";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

export default function PushNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const { checkFeature } = useSubscription();
  const accessToken = user?.accessToken;
  const pushEnabled =
    Boolean(accessToken) &&
    checkFeature(PLAN_FEATURES.notifications).allowed;

  usePushNotifications(pushEnabled);

  return children;
}
