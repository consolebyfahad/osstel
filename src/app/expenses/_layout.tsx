import ManagerGuard from "@/components/auth/ManagerGuard";
import { Stack } from "expo-router";

export default function ExpensesLayout() {
  return (
    <ManagerGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </ManagerGuard>
  );
}
