import ManagerGuard from "@/components/auth/ManagerGuard";
import { Stack } from "expo-router";

export default function TenantsLayout() {
  return (
    <ManagerGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </ManagerGuard>
  );
}
