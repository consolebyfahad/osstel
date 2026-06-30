import ResidentGuard from "@/components/auth/ResidentGuard";
import { Stack } from "expo-router";

export default function JoinHostelLayout() {
  return (
    <ResidentGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </ResidentGuard>
  );
}
