import ManagerGuard from "@/components/auth/ManagerGuard";
import { Stack } from "expo-router";

export default function SubscriptionLayout() {
  return (
    <ManagerGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </ManagerGuard>
  );
}
