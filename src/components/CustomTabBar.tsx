import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { Octicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs/types";
import { useEffect, useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TAB_BAR_HEIGHT = 64;
const NOTCH_DEPTH = 26;
const BAR_TOP = 20;
const CIRCLE_SIZE = 60;
const SPRING_CONFIG = { damping: 20, stiffness: 190, mass: 0.8 };

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TABS = [
  {
    name: "home",
    icon: "home" as const,
    activeIcon: "home" as const,
  },
  {
    name: "rooms",
    icon: "organization" as const,
    activeIcon: "organization" as const,
  },
  {
    name: "rent",
    icon: "credit-card" as const,
    activeIcon: "credit-card" as const,
  },
  {
    name: "profile",
    icon: "person" as const,
    activeIcon: "person" as const,
  },
];

function createTabBarPath(
  width: number,
  height: number,
  centerX: number,
): string {
  "worklet";
  const radius = 38;
  const top = BAR_TOP;

  return `M 0 ${top} H ${centerX - radius} Q ${centerX} ${top - NOTCH_DEPTH} ${centerX + radius} ${top} H ${width} V ${height} H 0 Z`;
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const tabWidth = SCREEN_WIDTH / state.routes.length;
  const centerX = useSharedValue(state.index * tabWidth + tabWidth / 2);
  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

  useEffect(() => {
    centerX.value = withSpring(
      state.index * tabWidth + tabWidth / 2,
      SPRING_CONFIG,
    );
  }, [state.index, tabWidth, centerX]);

  const animatedPathProps = useAnimatedProps(() => ({
    d: createTabBarPath(SCREEN_WIDTH, totalHeight, centerX.value),
  }));

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: centerX.value - CIRCLE_SIZE / 2 },
      { translateY: -(CIRCLE_SIZE / 2) + 6 },
    ],
  }));

  const activeRouteName = state.routes[state.index]?.name ?? "home";
  const activeTab =
    TABS.find((item) => item.name === activeRouteName) ?? TABS[0];

  return (
    <View style={[styles.wrapper, { height: totalHeight + NOTCH_DEPTH }]}>
      <Svg
        width={SCREEN_WIDTH}
        height={totalHeight + NOTCH_DEPTH}
        style={styles.svg}
      >
        <AnimatedPath
          animatedProps={animatedPathProps}
          fill={colors.primary100}
        />
      </Svg>

      <Animated.View style={[styles.bubble, animatedBubbleStyle]}>
        <View style={styles.bubbleInner}>
          <Octicons
            name={activeTab.activeIcon}
            size={28}
            color={colors.white}
          />
        </View>
      </Animated.View>

      <View
        style={[
          styles.tabRow,
          { paddingBottom: insets.bottom, height: totalHeight },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS.find((item) => item.name === route.name) ?? TABS[0];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={
                descriptors[route.key].options.tabBarAccessibilityLabel
              }
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              {!isFocused ? (
                <Octicons name={tab.icon} size={28} color={colors.black100} />
              ) : (
                <View style={styles.activePlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: -30,
    },
    svg: {
      position: "absolute",
      bottom: 0,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 12,
    },
    tabRow: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 18,
    },
    activePlaceholder: {
      width: 28,
      height: 28,
    },
    bubble: {
      position: "absolute",
      top: 20,
      left: 0,
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      zIndex: 10,
    },
    bubbleInner: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white100,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
  });
}
