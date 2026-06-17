import type { RecentActivity } from "@/types/dashboard";
import EmptyState from "@/components/EmptyState";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type RecentActivitiesProps = {
  title?: string;
  activities: RecentActivity[];
  emptyMessage?: string;
  isLoading?: boolean;
};

export default function RecentActivities({
  title = "Recent Activities",
  activities,
  emptyMessage = "No recent activities",
  isLoading = false,
}: RecentActivitiesProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const isEmpty = !isLoading && activities.length === 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={[styles.card, (isEmpty || isLoading) && styles.cardEmpty]}>
        {isLoading ? (
          <Text style={styles.emptyText}>Loading activities...</Text>
        ) : isEmpty ? (
          <EmptyState
            title={emptyMessage}
            size="sm"
            style={styles.emptyState}
          />
        ) : (
          activities.map((activity, index) => (
            <View
              key={activity.id}
              style={[
                styles.activityRow,
                index < activities.length - 1 && styles.activityRowBorder,
              ]}
            >
              <Text style={styles.activityTitle}>{activity.title}</Text>
              {activity.description ? (
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
              ) : null}
              {activity.timestamp ? (
                <Text style={styles.activityTime}>{activity.timestamp}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    section: {
      marginTop: 28,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: 14,
    },
    card: {
      backgroundColor: isDark ? colors.white200 : colors.background,
      borderRadius: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.white300 : "transparent",
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: isDark ? 4 : 2 },
      shadowOpacity: isDark ? 0.18 : 0.05,
      shadowRadius: isDark ? 8 : 6,
      elevation: isDark ? 3 : 2,
    },
    cardEmpty: {
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      paddingHorizontal: 8,
      overflow: "hidden",
    },
    emptyState: {
      paddingVertical: vs(8),
    },
    emptyText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
    },
    activityRow: {
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    activityRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? colors.white300 : colors.gray,
    },
    activityTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 2,
    },
    activityDescription: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: 4,
    },
    activityTime: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray100,
    },
  });
}
