import CustomTabBar from "@/components/CustomTabBar";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { BackHandler } from "react-native";

export default function TabLayout() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        BackHandler.exitApp();
        return true;
      },
    );
    return () => subscription.remove();
  }, []);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="rooms" options={{ title: "Rooms" }} />
      <Tabs.Screen name="rent" options={{ title: "Rent" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
