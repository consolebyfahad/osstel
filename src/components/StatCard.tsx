import type { DashboardStat } from "@/types/dashboard";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type StatCardProps = Pick<
  DashboardStat,
  "title" | "value" | "iconName" | "iconColor" | "iconBackgroundColor"
>;

export default function StatCard({
  title,
  value,
  iconName,
  iconColor,
  iconBackgroundColor,
}: StatCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <View
      style={[
        styles.card,
        isDark
          ? { backgroundColor: colors.white, borderColor: colors.border }
          : { backgroundColor: iconBackgroundColor },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>

      <View
        style={[
          styles.iconWrap,
          isDark && { backgroundColor: iconBackgroundColor },
        ]}
      >
        <Ionicons name={iconName} size={isDark ? 26 : 32} color={iconColor} />
      </View>
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minHeight: 108,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: isDark ? 1 : 0,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: isDark ? 4 : 2 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: isDark ? 10 : 8,
      elevation: isDark ? 4 : 2,
    },
    content: {
      flex: 1,
      paddingRight: 8,
    },
    title: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: isDark ? colors.gray200 : colors.gray,
      marginBottom: 8,
    },
    value: {
      fontSize: FONT_SIZES.display,
      fontFamily: FONTS.bold,
      color: colors.text,
    },
    iconWrap: {
      position: "absolute",
      right: 16,
      bottom: 16,
      ...(isDark
        ? {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }
        : {}),
    },
  });
}
