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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, { backgroundColor: iconBackgroundColor }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>

      <View style={[styles.iconWrap]}>
        <Ionicons name={iconName} size={32} color={iconColor} />
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minHeight: 108,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    content: {
      flex: 1,
      paddingRight: 8,
    },
    title: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: colors.text,
      marginBottom: 8,
    },
    value: {
      fontSize: FONT_SIZES.display,
      fontFamily: FONTS.bold,
      color: colors.text,
    },
    iconWrap: {
      position: "absolute",
      right: 20,
      bottom: 20,
    },
  });
}
