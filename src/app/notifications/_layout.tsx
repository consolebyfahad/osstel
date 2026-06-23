import SubscriptionFeatureGuard, {
  PLAN_FEATURES,
} from "@/components/SubscriptionFeatureGuard";
import { Stack } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

function NotificationsStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function NotificationsLayout() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";

  if (isManager) {
    return (
      <SubscriptionFeatureGuard feature={PLAN_FEATURES.notifications}>
        <NotificationsStack />
      </SubscriptionFeatureGuard>
    );
  }

  return <NotificationsStack />;
}
