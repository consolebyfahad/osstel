import ManagerGuard from "@/components/auth/ManagerGuard";
import { Stack } from "expo-router";

export default function ResidentsLayout() {
  return (
    <ManagerGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </ManagerGuard>
  );
}
