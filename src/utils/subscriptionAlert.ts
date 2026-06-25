import { showAppModal } from "@/context/AppModalProvider";
import { router } from "expo-router";

export function showSubscriptionBlocked(message?: string) {
  showAppModal({
    title: "Upgrade required",
    message:
      message ??
      "This feature is available in a higher plan. Upgrade to continue.",
    icon: "diamond-outline",
    buttons: [
      { text: "Not now", style: "cancel" },
      {
        text: "View plans",
        style: "primary",
        onPress: () => router.push("/subscription"),
      },
    ],
  });
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
