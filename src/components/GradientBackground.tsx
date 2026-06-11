import { useTheme } from "@constants/constant";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type GradientBackgroundProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function GradientBackground({
  children,
  style,
}: GradientBackgroundProps) {
  const { colors } = useTheme();
  const [start, end] = colors.gradientBg;

  return (
    <LinearGradient
      colors={[start, end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
