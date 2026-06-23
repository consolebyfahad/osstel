import { router, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { BackHandler, Platform } from "react-native";

function isHomeTab(segments: string[]) {
  return (
    segments[0] === "(tabs)" &&
    (segments.length === 1 || segments[1] === "home")
  );
}

function isTabScreen(segments: string[]) {
  return segments[0] === "(tabs)";
}

export function useAndroidBackHandler() {
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        const currentSegments = segmentsRef.current;

        if (router.canGoBack()) {
          router.back();
          return true;
        }

        if (isTabScreen(currentSegments) && !isHomeTab(currentSegments)) {
          router.replace("/(tabs)/home");
          return true;
        }

        if (isHomeTab(currentSegments)) {
          BackHandler.exitApp();
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, []);
}
