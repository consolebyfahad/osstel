import { useSubscription } from "@/hooks/useSubscription";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons, Octicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs/types";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useGetHostelsQuery } from "../../store/api";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const TAB_BAR_HEIGHT = 64;
const NOTCH_DEPTH = 26;
const BAR_TOP = 20;
const CIRCLE_SIZE = 60;
const ACTION_SIZE = 52;
const ARC_RADIUS = 80;
const ARC_ACTION_Y_OFFSET = 24;
const ACTION_HIT_WIDTH = 80;
const ACTION_HIT_HEIGHT = 88;
const SPRING_CONFIG = { damping: 18, stiffness: 210, mass: 0.75 };
const TAB_ICON_SIZE = 24;
const TAB_ICON_ACTIVE_SCALE = 1.22;
const TAB_ICON_POP_CONFIG = { damping: 13, stiffness: 280, mass: 0.55 };

const AnimatedPath = Animated.createAnimatedComponent(Path);

const MANAGER_LEFT_TABS = [
  { name: "home", icon: "home-fill" as const, activeIcon: "home-fill" as const },
  {
    name: "hostels",
    icon: "organization" as const,
    activeIcon: "organization" as const,
  },
];

const MANAGER_RIGHT_TABS = [
  { name: "rent", icon: "credit-card" as const, activeIcon: "credit-card" as const },
  { name: "profile", icon: "person" as const, activeIcon: "person" as const },
];

const RESIDENT_TABS = [
  { name: "home", icon: "home-fill" as const, activeIcon: "home-fill" as const },
  {
    name: "discover",
    icon: "organization" as const,
    activeIcon: "organization" as const,
  },
  { name: "rent", icon: "credit-card" as const, activeIcon: "credit-card" as const },
  { name: "profile", icon: "person" as const, activeIcon: "person" as const },
];

const QUICK_ACTIONS = [
  {
    id: "add-room",
    // label: "Add Room",
    icon: "bed-outline" as const,
    iconColorKey: "warningText" as const,
    iconBgKey: "warningBg" as const,
    arcAngle: 150,
  },
  {
    id: "add-resident",
    // label: "Add Resident",
    icon: "person-add-outline" as const,
    iconColorKey: "successText" as const,
    iconBgKey: "successBg" as const,
    arcAngle: 90,
  },
  {
    id: "add-expense",
    icon: "wallet-outline" as const,
    iconColorKey: "purpleText" as const,
    iconBgKey: "purpleBg" as const,
    arcAngle: 30,
  },
];

function createTabBarPath(
  width: number,
  height: number,
  centerX: number,
  withNotch: boolean,
): string {
  "worklet";
  const top = BAR_TOP;

  if (!withNotch) {
    return `M 0 ${top} H ${width} V ${height} H 0 Z`;
  }

  const radius = 38;
  return `M 0 ${top} H ${centerX - radius} Q ${centerX} ${top - NOTCH_DEPTH} ${centerX + radius} ${top} H ${width} V ${height} H 0 Z`;
}

type TabConfigItem = {
  name: string;
  icon: keyof typeof Octicons.glyphMap;
  activeIcon: keyof typeof Octicons.glyphMap;
};

type ArcActionProps = {
  // label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackgroundColor: string;
  arcAngle: number;
  originX: number;
  originY: number;
  menuProgress: SharedValue<number>;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
};

function ArcActionButton({
  icon,
  iconColor,
  iconBackgroundColor,
  arcAngle,
  originX,
  originY,
  menuProgress,
  onPress,
  styles,
}: ArcActionProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const angleRad = (arcAngle * Math.PI) / 180;
    const radius = ARC_RADIUS * menuProgress.value;
    const centerX = originX + radius * Math.cos(angleRad);
    const centerY =
      originY - radius * Math.sin(angleRad) + ARC_ACTION_Y_OFFSET;
    const scale = 0.35 + menuProgress.value * 0.65;

    return {
      opacity: menuProgress.value,
      left: centerX - ACTION_HIT_WIDTH / 2,
      top: centerY - ACTION_HIT_HEIGHT / 2,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[styles.modalActionHit, animatedStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          pressed && styles.actionButtonPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View style={[styles.actionIconWrap, { backgroundColor: iconBackgroundColor }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TabButton({
  tab,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
  styles,
  colors,
}: {
  tab: TabConfigItem;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
}) {
  const iconScale = useSharedValue(isFocused ? TAB_ICON_ACTIVE_SCALE : 1);

  useEffect(() => {
    if (isFocused) {
      iconScale.value = withSequence(
        withTiming(0.82, { duration: 60 }),
        withSpring(TAB_ICON_ACTIVE_SCALE, TAB_ICON_POP_CONFIG),
      );
      return;
    }

    iconScale.value = withSpring(1, TAB_ICON_POP_CONFIG);
  }, [iconScale, isFocused]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      <Animated.View style={iconAnimatedStyle}>
        <Octicons
          name={isFocused ? tab.activeIcon : tab.icon}
          size={TAB_ICON_SIZE}
          color={isFocused ? colors.primary : colors.gray300}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarFill = isDark ? colors.white100 : colors.white;
  const insets = useSafeAreaInsets();
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";
  const { guardAddTenant, guardAddRoom } = useSubscription();
  const { data: hostelsData } = useGetHostelsQuery(undefined, { skip: !isManager });
  const hostels = hostelsData?.hostels ?? [];
  const singleHostelId = hostels.length === 1 ? hostels[0]._id : undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuProgress = useSharedValue(0);
  const fabRef = useRef<View>(null);
  const [menuOrigin, setMenuOrigin] = useState({
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT - 80,
  });

  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;
  const centerX = SCREEN_WIDTH / 2;

  const activeRoute = state.routes[state.index];

  const animatedPathProps = useAnimatedProps(() => ({
    d: createTabBarPath(SCREEN_WIDTH, totalHeight, centerX, isManager),
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${menuProgress.value * 45}deg` }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value * 0.92,
  }));

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuProgress.value = withSpring(0, SPRING_CONFIG);
  }, [menuProgress]);

  const toggleMenu = useCallback(() => {
    if (!isManager) return;

    if (menuOpen) {
      setMenuOpen(false);
      menuProgress.value = withSpring(0, SPRING_CONFIG);
      return;
    }

    fabRef.current?.measureInWindow((x, y, width, height) => {
      setMenuOrigin({
        x: x + width / 2,
        y: y + height / 2,
      });
      setMenuOpen(true);
      menuProgress.value = withSpring(1, SPRING_CONFIG);
    });
  }, [isManager, menuOpen, menuProgress]);

  const handleAction = useCallback(
    (actionId: string) => {
      if (actionId === "add-room") {
        guardAddRoom(() => {
          closeMenu();
          if (singleHostelId) {
            router.push({
              pathname: "/rooms/add",
              params: { hostelId: singleHostelId },
            });
            return;
          }
          router.push("/(tabs)/hostels");
        });
        return;
      }

      if (actionId === "add-resident") {
        guardAddTenant(() => {
          closeMenu();
          if (singleHostelId) {
            router.push({
              pathname: "/residents/add",
              params: { hostelId: singleHostelId },
            });
            return;
          }
          router.push("/residents/add");
        });
        return;
      }

      if (actionId === "add-expense") {
        closeMenu();
        router.push("/expenses/add");
        return;
      }
    },
    [
      closeMenu,
      guardAddRoom,
      guardAddTenant,
      singleHostelId,
    ],
  );

  const navigateToTab = useCallback(
    (route: (typeof state.routes)[number], isFocused: boolean) => {
      if (menuOpen) {
        closeMenu();
        return;
      }

      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [closeMenu, menuOpen, navigation],
  );

  const renderTab = (route: (typeof state.routes)[number], tab: TabConfigItem) => {
    const isFocused = activeRoute?.key === route.key;

    return (
      <TabButton
        key={route.key}
        tab={tab}
        isFocused={isFocused}
        onPress={() => navigateToTab(route, isFocused)}
        onLongPress={() => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        }}
        accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
        styles={styles}
        colors={colors}
      />
    );
  };

  const managerRoutes = {
    left: state.routes.filter((route) =>
      MANAGER_LEFT_TABS.some((tab) => tab.name === route.name),
    ),
    right: state.routes.filter((route) =>
      MANAGER_RIGHT_TABS.some((tab) => tab.name === route.name),
    ),
  };

  return (
    <View style={[styles.wrapper, { height: totalHeight + NOTCH_DEPTH }]}>
      <Svg
        width={SCREEN_WIDTH}
        height={totalHeight + NOTCH_DEPTH}
        style={styles.svg}
      >
        <AnimatedPath animatedProps={animatedPathProps} fill={tabBarFill} />
      </Svg>

      <View
        style={[
          styles.tabRow,
          { paddingBottom: insets.bottom, height: totalHeight },
        ]}
      >
        {isManager ? (
          <>
            <View style={styles.tabSide}>
              {managerRoutes.left.map((route) => {
                const tab =
                  MANAGER_LEFT_TABS.find((item) => item.name === route.name) ??
                  MANAGER_LEFT_TABS[0];
                return renderTab(route, tab);
              })}
            </View>

            <View style={styles.fabSpacer} />

            <View style={styles.tabSide}>
              {managerRoutes.right.map((route) => {
                const tab =
                  MANAGER_RIGHT_TABS.find((item) => item.name === route.name) ??
                  MANAGER_RIGHT_TABS[0];
                return renderTab(route, tab);
              })}
            </View>
          </>
        ) : (
          state.routes
            .filter((route) => route.name !== "hostels")
            .map((route) => {
              const tab =
                RESIDENT_TABS.find((item) => item.name === route.name) ??
                RESIDENT_TABS[0];
              return renderTab(route, tab);
            })
        )}
      </View>

      {isManager ? (
        <>
          <Modal
            visible={menuOpen}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={closeMenu}
          >
            <View style={styles.modalRoot} pointerEvents="box-none">
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.backdrop,
                  backdropAnimatedStyle,
                ]}
                pointerEvents="none"
              />
              <Pressable
                style={[StyleSheet.absoluteFill, styles.modalDismiss]}
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Close quick actions"
              />
              {QUICK_ACTIONS.map((action) => (
                <ArcActionButton
                  key={action.id}
                  // label={action.label}
                  icon={action.icon}
                  iconColor={colors[action.iconColorKey]}
                  iconBackgroundColor={colors[action.iconBgKey]}
                  arcAngle={action.arcAngle}
                  originX={menuOrigin.x}
                  originY={menuOrigin.y}
                  menuProgress={menuProgress}
                  onPress={() => handleAction(action.id)}
                  styles={styles}
                />
              ))}
              <Pressable
                style={[
                  styles.modalFabTouch,
                  {
                    left: menuOrigin.x - CIRCLE_SIZE / 2,
                    top: menuOrigin.y - CIRCLE_SIZE / 2,
                  },
                ]}
                onPress={toggleMenu}
                accessibilityRole="button"
                accessibilityLabel="Close quick actions"
              />
            </View>
          </Modal>

          <View ref={fabRef} collapsable={false} style={styles.fabWrap}>
            <Pressable
              style={styles.fabPressable}
              onPress={toggleMenu}
              accessibilityRole="button"
              accessibilityLabel={menuOpen ? "Close quick actions" : "Open quick actions"}
              accessibilityState={{ expanded: menuOpen }}
            >
              <View style={styles.fabInner}>
                <Animated.View style={fabAnimatedStyle}>
                  <Octicons name="plus" size={30} color={colors.onPrimary} />
                </Animated.View>
              </View>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: -20,
    },
    modalRoot: {
      flex: 1,
    },
    modalDismiss: {
      zIndex: 1,
      elevation: 1,
    },
    modalFabTouch: {
      position: "absolute",
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      zIndex: 25,
      elevation: 25,
    },
    backdrop: {
      backgroundColor: colors.overlay,
    },
    svg: {
      position: "absolute",
      bottom: 0,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 12,
    },
    tabRow: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 6,
      flexDirection: "row",
      alignItems: "flex-end",
      zIndex: 5,
    },
    tabSide: {
      flex: 1,
      flexDirection: "row",
    },
    fabSpacer: {
      width: CIRCLE_SIZE + vs(16),
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 24,
    },
    fabWrap: {
      position: "absolute",
      top: BAR_TOP - CIRCLE_SIZE / 2 + 2,
      left: SCREEN_WIDTH / 2 - CIRCLE_SIZE / 2,
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      zIndex: 50,
      elevation: 50,
    },
    fabPressable: {
      width: "100%",
      height: "100%",
    },
    fabInner: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.background,
      shadowColor: colors.primary400,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    modalActionHit: {
      position: "absolute",
      width: ACTION_HIT_WIDTH,
      height: ACTION_HIT_HEIGHT,
      zIndex: 20,
      elevation: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    actionButton: {
      alignItems: "center",
      width: ACTION_HIT_WIDTH,
    },
    actionButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
    actionIconWrap: {
      width: ACTION_SIZE,
      height: ACTION_SIZE,
      borderRadius: ACTION_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.background,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
  });
}
