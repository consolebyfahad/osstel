import { COLORS } from "@constants/colors";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
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

const LETTERS = ["V", "A", "A", "S"] as const;
const FIRST_LETTER_DELAY_MS = 500;
const LETTER_INTERVAL_MS = 580;
const LETTER_FADE_MS = 420;
const HOLD_AFTER_COMPLETE_MS = 1100;
const ZOOM_DURATION_MS = 650;

const LETTER_SPRING = {
  damping: 7,
  stiffness: 90,
  mass: 0.9,
};

const { primary, secondary } = COLORS.light;

function AnimatedLetter({ letter }: { letter: string }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateY = useSharedValue(36);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: LETTER_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withSpring(1, LETTER_SPRING);
    translateY.value = withSpring(0, LETTER_SPRING);
  }, [opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.letter, animatedStyle]}>
      {letter}
    </Animated.Text>
  );
}

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
  const [visibleCount, setVisibleCount] = useState(0);
  const [zooming, setZooming] = useState(false);
  const containerScale = useSharedValue(1);
  const containerOpacity = useSharedValue(1);

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
    if (visibleCount >= LETTERS.length) return;
    const timer = setTimeout(
      () => setVisibleCount((count) => count + 1),
      visibleCount === 0 ? FIRST_LETTER_DELAY_MS : LETTER_INTERVAL_MS,
    );
    return () => clearTimeout(timer);
  }, [visibleCount]);

  useEffect(() => {
    if (visibleCount < LETTERS.length) return;

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
    }, HOLD_AFTER_COMPLETE_MS);

    return () => clearTimeout(zoomTimer);
  }, [visibleCount, containerScale, containerOpacity, navigateAfterSplash]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[primary, secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[styles.logoRow, logoAnimatedStyle]}
        pointerEvents={zooming ? "none" : "auto"}
      >
        {LETTERS.slice(0, visibleCount).map((letter, index) => (
          <AnimatedLetter key={`${letter}-${index}`} letter={letter} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontSize: FONT_SIZES.brand * 1.6,
    fontFamily: FONTS.title,
    color: "#ffffff",
    letterSpacing: 4,
    includeFontPadding: false,
  },
});
