import type { SubscriptionPlanId } from "@/types/subscription";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@vaas/subscription";

export async function getSubscriptionPlan(): Promise<SubscriptionPlanId> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === "standard" || raw === "premium") return raw;
    return "free";
  } catch {
    return "free";
  }
}

export async function setSubscriptionPlan(
  planId: SubscriptionPlanId,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, planId);
}
