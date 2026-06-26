import ManagerGuard from "@/components/auth/ManagerGuard";
import SubscriptionFeatureGuard from "@/components/SubscriptionFeatureGuard";
import { PLAN_FEATURES } from "@/constants/plans";
import { Stack } from "expo-router";

export default function ExpensesLayout() {
  return (
    <ManagerGuard>
      <SubscriptionFeatureGuard feature={PLAN_FEATURES.expense_tracking}>
        <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionFeatureGuard>
    </ManagerGuard>
  );
}
