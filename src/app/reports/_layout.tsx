import ManagerGuard from "@/components/auth/ManagerGuard";
import SubscriptionFeatureGuard, {
  PLAN_FEATURES,
} from "@/components/SubscriptionFeatureGuard";
import { Stack } from "expo-router";

export default function ReportsLayout() {
  return (
    <ManagerGuard>
      <SubscriptionFeatureGuard feature={PLAN_FEATURES.reports}>
        <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionFeatureGuard>
    </ManagerGuard>
  );
}
