import { PLAN_FEATURES, type PlanFeature } from "@/constants/plans";
import { useSubscription } from "@/hooks/useSubscription";
import { showSubscriptionBlocked } from "@/utils/subscriptionAlert";
import { router } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import CustomLoading from "@/components/CustomLoading";

type SubscriptionFeatureGuardProps = {
  feature: PlanFeature;
  children: ReactNode;
};

export default function SubscriptionFeatureGuard({
  feature,
  children,
}: SubscriptionFeatureGuardProps) {
  const { checkFeature } = useSubscription();
  const check = checkFeature(feature);

  useEffect(() => {
    if (!check.allowed) {
      showSubscriptionBlocked(check.message);
      router.back();
    }
  }, [check.allowed, check.message]);

  if (!check.allowed) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <CustomLoading size="lg" />
      </View>
    );
  }

  return children;
}

export { PLAN_FEATURES };
