import type { RecentActivity } from "@/types/dashboard";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type RecentActivityCardProps = {
  activity: RecentActivity;
  showBorder?: boolean;
};

export default function RecentActivityCard({
  activity,
  showBorder = false,
}: RecentActivityCardProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  return (
    <View style={[styles.card, showBorder && styles.cardBorder]}>
      <Text style={styles.title}>{activity.title}</Text>
      {activity.description ? (
        <Text style={styles.description}>{activity.description}</Text>
      ) : null}
      {activity.timestamp ? (
        <Text style={styles.time}>{activity.timestamp}</Text>
      ) : null}
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    card: {
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    cardBorder: {
      borderBottomWidth: 1,
      borderBottomColor:  colors.border,
    },
    title: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 2,
    },
    description: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: 4,
    },
    time: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray100,
    },
  });
}
