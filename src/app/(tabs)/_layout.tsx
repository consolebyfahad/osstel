import CustomTabBar from "@/components/CustomTabBar";
import { Tabs } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

export default function TabLayout() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const isManager = user?.role === "manager";
  const isGuest = !isAuthenticated;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", href: isGuest ? null : "/home" }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          href: isManager ? null : "/discover",
        }}
      />
      <Tabs.Screen
        name="hostels"
        options={{ title: "Hostels", href: isManager ? "/hostels" : null }}
      />
      <Tabs.Screen name="rent" options={{ title: "Rent", href: isGuest ? null : undefined }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", href: isGuest ? null : undefined }} />
    </Tabs>
  );
}
