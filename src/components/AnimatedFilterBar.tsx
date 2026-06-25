import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useEffect, useMemo } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const FILTER_SPRING = {
  damping: 26,
  stiffness: 220,
  overshootClamping: true,
};

export type FilterOption<T extends string> = {
  id: T;
  label: string;
};

type AnimatedFilterBarProps<T extends string> = {
  filters: FilterOption<T>[];
  activeFilter: T;
  onFilterChange: (filter: T) => void;
  style?: StyleProp<ViewStyle>;
};

export default function AnimatedFilterBar<T extends string>({
  filters,
  activeFilter,
  onFilterChange,
  style,
}: AnimatedFilterBarProps<T>) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const activeIndex = Math.max(
    0,
    filters.findIndex((filter) => filter.id === activeFilter),
  );
  const sliderIndex = useSharedValue(activeIndex);
  const tabWidth = useSharedValue(0);

  useEffect(() => {
    sliderIndex.value = withSpring(activeIndex, FILTER_SPRING);
  }, [activeIndex, sliderIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth.value,
    transform: [{ translateX: sliderIndex.value * tabWidth.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const barPadding = vs(8);
    tabWidth.value =
      (event.nativeEvent.layout.width - barPadding) / filters.length;
  };

  return (
    <View style={[styles.filterBar, style]} onLayout={handleLayout}>
      <Animated.View style={[styles.filterIndicator, indicatorStyle]} />
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <Pressable
            key={filter.id}
            style={styles.filterTab}
            onPress={() => onFilterChange(filter.id)}
          >
            <Text
              style={[styles.filterText, isActive && styles.filterTextActive]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    filterBar: {
      flexDirection: "row",
      backgroundColor: isDark ? colors.white200 : colors.white100,
      borderRadius: vs(14),
      padding: vs(4),
      position: "relative",
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.white300 : "transparent",
    },
    filterIndicator: {
      position: "absolute",
      top: vs(4),
      left: vs(4),
      bottom: vs(4),
      borderRadius: vs(10),
      backgroundColor: isDark ? colors.white300 : colors.white,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    filterTab: {
      flex: 1,
      paddingVertical: vs(8),
      alignItems: "center",
      borderRadius: vs(10),
      zIndex: 1,
    },
    filterText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    filterTextActive: {
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
  });
}
