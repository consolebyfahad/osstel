import ResidentGuard from "@/components/auth/ResidentGuard";
import { Stack } from "expo-router";

export default function LeaveHostelLayout() {
  return (
    <ResidentGuard requireConnection>
      <Stack screenOptions={{ headerShown: false }} />
    </ResidentGuard>
  );
}
