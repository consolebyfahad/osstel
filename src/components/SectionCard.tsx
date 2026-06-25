import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

export function getCardShadow(colors: AppColors, isDark: boolean) {
  return {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: isDark ? 4 : 3 },
    shadowOpacity: isDark ? 0.2 : 0.08,
    shadowRadius: isDark ? 12 : 10,
    elevation: isDark ? 4 : 3,
  };
}

type SectionCardProps = {
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function SectionCard({
  title,
  children,
  style,
  contentStyle,
}: SectionCardProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    card: {
      ...getCardShadow(colors, isDark),
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      marginBottom: vs(24),
      overflow: "hidden",
    },
    title: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      paddingHorizontal: vs(14),
      paddingTop: vs(14),
      paddingBottom: vs(8),
    },
    content: {},
  });
}
