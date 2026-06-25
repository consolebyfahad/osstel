import { COLORS } from "@constants/colors";
import { Images } from "@constants/images";
import { vs } from "@constants/fonts";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

const LOGO_DELAY_MS = 500;
const LOGO_FADE_MS = 520;
const HOLD_AFTER_LOGO_MS = 1100;
const ZOOM_DURATION_MS = 650;

const LOGO_SPRING = {
  damping: 7,
  stiffness: 90,
  mass: 0.9,
};

export default function Splash() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const hasSeenWelcome = useSelector(
    (state: RootState) => state.auth.hasSeenWelcome,
  );
  const isInitialized = useSelector(
    (state: RootState) => state.auth.isInitialized,
  );
  const [logoVisible, setLogoVisible] = useState(false);
  const [zooming, setZooming] = useState(false);
  const containerScale = useSharedValue(1);
  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const logoTranslateY = useSharedValue(24);

  const navigateAfterSplash = useCallback(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      router.replace("/(tabs)/home");
      return;
    }

    if (hasSeenWelcome) {
      router.replace("/auth/signin");
      return;
    }

    router.replace("/welcome");
  }, [isAuthenticated, hasSeenWelcome, isInitialized]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoVisible(true);
      logoOpacity.value = withTiming(1, {
        duration: LOGO_FADE_MS,
        easing: Easing.out(Easing.cubic),
      });
      logoScale.value = withSpring(1, LOGO_SPRING);
      logoTranslateY.value = withSpring(0, LOGO_SPRING);
    }, LOGO_DELAY_MS);

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, logoTranslateY]);

  useEffect(() => {
    if (!logoVisible) return;

    const zoomTimer = setTimeout(() => {
      setZooming(true);
      containerScale.value = withTiming(
        14,
        {
          duration: ZOOM_DURATION_MS,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(navigateAfterSplash)();
          }
        },
      );
      containerOpacity.value = withTiming(0, {
        duration: ZOOM_DURATION_MS,
        easing: Easing.in(Easing.quad),
      });
    }, HOLD_AFTER_LOGO_MS);

    return () => clearTimeout(zoomTimer);
  }, [
    logoVisible,
    containerScale,
    containerOpacity,
    navigateAfterSplash,
  ]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { translateY: logoTranslateY.value },
    ],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Animated.View
        style={[styles.logoWrap, containerAnimatedStyle]}
        pointerEvents={zooming ? "none" : "auto"}
      >
        <Animated.View style={logoAnimatedStyle}>
          <Image
            source={Images.osstel}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="Osstel logo"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.dark.background,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: vs(240),
    height: vs(96),
  },
});
