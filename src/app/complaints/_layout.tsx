import SubscriptionFeatureGuard from "@/components/SubscriptionFeatureGuard";
import { PLAN_FEATURES } from "@/constants/plans";
import { Stack } from "expo-router";

export default function ComplaintsLayout() {
  return (
    <SubscriptionFeatureGuard feature={PLAN_FEATURES.complaints}>
      <Stack screenOptions={{ headerShown: false }} />
    </SubscriptionFeatureGuard>
  );
}
