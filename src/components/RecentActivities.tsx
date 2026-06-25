import type { RecentActivity } from "@/types/dashboard";
import EmptyState from "@/components/EmptyState";
import RecentActivityCard from "@/components/RecentActivityCard";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RecentActivitiesProps = {
  title?: string;
  activities: RecentActivity[];
  emptyMessage?: string;
  isLoading?: boolean;
  showSectionTitle?: boolean;
  onSeeAllPress?: () => void;
};

export default function RecentActivities({
  title = "Recent Activities",
  activities,
  emptyMessage = "No recent activities",
  isLoading = false,
  showSectionTitle = true,
  onSeeAllPress,
}: RecentActivitiesProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark, showSectionTitle),
    [colors, fonts, isDark, showSectionTitle],
  );
  const isEmpty = !isLoading && activities.length === 0;

  return (
    <View style={styles.section}>
      {showSectionTitle ? (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {onSeeAllPress ? (
            <Pressable onPress={onSeeAllPress} hitSlop={8}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.listCard, (isEmpty || isLoading) && styles.listCardEmpty]}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading activities...</Text>
        ) : isEmpty ? (
          <EmptyState
            title={emptyMessage}
            size="sm"
            style={styles.emptyState}
          />
        ) : (
          activities.map((activity, index) => (
            <RecentActivityCard
              key={activity.id}
              activity={activity}
              showBorder={index < activities.length - 1}
            />
          ))
        )}
      </View>
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
  showSectionTitle: boolean,
) {
  return StyleSheet.create({
    section: {
      marginTop: showSectionTitle ? 28 : 0,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      flex: 1,
    },
    seeAllText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    listCard: {
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
    listCardEmpty: {
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
    loadingText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
    },
  });
}
