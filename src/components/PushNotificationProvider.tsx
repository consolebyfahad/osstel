import type { ReactNode } from "react";
import { PLAN_FEATURES } from "@/constants/plans";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { hasFeature } from "@/utils/subscription";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

export default function PushNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = user?.accessToken;
  const isManager = user?.role === "manager";
  const pushEnabled =
    Boolean(accessToken) &&
    (!isManager || hasFeature(user?.subscriptionPlan, PLAN_FEATURES.notifications).allowed);

  usePushNotifications(pushEnabled);

  return children;
}
