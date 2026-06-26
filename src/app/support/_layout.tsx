import SubscriptionFeatureGuard from "@/components/SubscriptionFeatureGuard";
import { PLAN_FEATURES } from "@/constants/plans";
import { Stack } from "expo-router";

export default function SupportLayout() {
  return (
    <SubscriptionFeatureGuard feature={PLAN_FEATURES.support}>
      <Stack screenOptions={{ headerShown: false }} />
    </SubscriptionFeatureGuard>
  );
}
