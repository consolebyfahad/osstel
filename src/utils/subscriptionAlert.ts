import { Alert } from "react-native";
import { router } from "expo-router";

export function showSubscriptionBlocked(message?: string) {
  Alert.alert(
    "Upgrade required",
    message ??
      "This feature is available in a higher plan. Upgrade to continue.",
    [
      { text: "Not now", style: "cancel" },
      {
        text: "View plans",
        onPress: () => router.push("/subscription"),
      },
    ],
  );
}

export function guardSubscription(
  check: { allowed: boolean; message?: string },
  onAllowed: () => void,
) {
  if (!check.allowed) {
    showSubscriptionBlocked(check.message);
    return false;
  }

  onAllowed();
  return true;
}
