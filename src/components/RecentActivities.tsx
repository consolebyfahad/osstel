import type { RecentActivity } from "@/types/dashboard";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type RecentActivitiesProps = {
  title?: string;
  activities: RecentActivity[];
  emptyMessage?: string;
};

export default function RecentActivities({
  title = "Recent Activities",
  activities,
  emptyMessage = "No recent activities",
}: RecentActivitiesProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const isEmpty = activities.length === 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={[styles.card, isEmpty && styles.cardEmpty]}>
        {isEmpty ? (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
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

function createStyles(colors: AppColors, fonts: typeof FONTS) {
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
      backgroundColor: colors.background,
      borderRadius: 16,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    cardEmpty: {
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
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
      borderBottomColor: colors.gray,
    },
    activityTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.black,
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
