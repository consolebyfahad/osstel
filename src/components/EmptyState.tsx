import { Animations } from "@constants/animations";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import LottieView from "lottie-react-native";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const ANIMATION_SIZES = {
  sm: vs(120),
  md: vs(160),
  lg: vs(200),
} as const;

type EmptyStateSize = keyof typeof ANIMATION_SIZES;

type EmptyStateProps = {
  title: string;
  description?: string;
  size?: EmptyStateSize;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function EmptyState({
  title,
  description,
  size = "md",
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors, fonts } = useTheme();
  const animationSize = ANIMATION_SIZES[size];
  const styles = useMemo(
    () => createStyles(colors, fonts, animationSize),
    [colors, fonts, animationSize],
  );

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={Animations.notFound}
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  animationSize: number,
) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(24),
      paddingVertical: vs(24),
    },
    animation: {
      width: animationSize,
      height: animationSize,
      marginBottom: vs(8),
    },
    title: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(8),
      textAlign: "center",
    },
    description: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray,
      textAlign: "center",
      lineHeight: vs(22),
    },
    action: {
      marginTop: vs(20),
      backgroundColor: colors.primary,
      paddingHorizontal: vs(24),
      paddingVertical: vs(12),
      borderRadius: vs(12),
    },
    actionText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.white,
    },
  });
}
