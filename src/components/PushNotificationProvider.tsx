import type { ReactNode } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

export default function PushNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const accessToken = useSelector(
    (state: RootState) => state.auth.user?.accessToken,
  );

  usePushNotifications(Boolean(accessToken));

  return children;
}
