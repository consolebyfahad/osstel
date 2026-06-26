import ManagerGuard from "@/components/auth/ManagerGuard";
import SubscriptionFeatureGuard from "@/components/SubscriptionFeatureGuard";
import { PLAN_FEATURES } from "@/constants/plans";
import { Stack } from "expo-router";

export default function ActivitiesLayout() {
  return (
    <ManagerGuard>
      <SubscriptionFeatureGuard feature={PLAN_FEATURES.reports}>
        <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionFeatureGuard>
    </ManagerGuard>
  );
}
