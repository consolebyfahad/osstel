import AuthProvider from "@/context/AuthProvider";
import PushNotificationProvider from "@/components/PushNotificationProvider";
import { ThemeProvider, useTheme } from "@constants/constant";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import CustomLoading from "@/components/CustomLoading";
import { useAndroidBackHandler } from "@/hooks/useAndroidBackHandler";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "../../store/store";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark } = useTheme();
  useAndroidBackHandler();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            gestureEnabled: false,
            animation: "fade",
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Regular: require("../../assets/fonts/OpenSans-Regular.ttf"),
    Medium: require("../../assets/fonts/OpenSans-Medium.ttf"),
    SemiBold: require("../../assets/fonts/OpenSans-SemiBold.ttf"),
    Bold: require("../../assets/fonts/OpenSans-Bold.ttf"),
    Montserrat: require("../../assets/fonts/Monoton-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <CustomLoading size="lg" />
          </View>
        }
        persistor={persistor}
      >
        <AuthProvider>
          <PushNotificationProvider>
            <ThemeProvider>
              <AppContent />
              <Toast />
            </ThemeProvider>
          </PushNotificationProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}
