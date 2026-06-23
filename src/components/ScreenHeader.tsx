import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: ReactNode;
  titleNumberOfLines?: number;
};

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightSlot,
  titleNumberOfLines,
}: ScreenHeaderProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  if (!showBack && !rightSlot) {
    return (
      <View style={styles.staticHeader}>
        <Text style={styles.pageTitle} numberOfLines={titleNumberOfLines}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <View style={ styles.rowHeader}>
      <View style={styles.sideSlot}>
        {showBack ? (
          <Pressable
            style={styles.sideButton}
            onPress={onBack ?? (() => router.back())}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={vs(24)} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.pageTitle} numberOfLines={titleNumberOfLines}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={rightSlot ? styles.sideSlotRight : styles.sideSlot}>
        {rightSlot ?? null}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    staticHeader: {
      paddingTop: vs(16),
      paddingBottom: vs(8),
      paddingHorizontal: vs(14),
    },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: vs(16),
      paddingBottom: vs(8),
      paddingRight: vs(14),
      gap: vs(8),
    },

    sideSlot: {
      width: vs(40),
      minHeight: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    sideSlotRight: {
      minWidth: vs(40),
      minHeight: vs(40),
      alignItems: "flex-end",
      justifyContent: "center",
    },
    sideButton: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    titleWrap: {
      flex: 1,
    },
    pageTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginTop: vs(4),
    },
  });
}
