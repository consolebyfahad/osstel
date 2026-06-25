import GradientBackground from "@/components/GradientBackground";
import RecentActivities from "@/components/RecentActivities";
import ScreenHeader from "@/components/ScreenHeader";
import { mapDashboardActivities } from "@/types/dashboard";
import { useGetDashboardActivitiesQuery } from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivitiesScreen() {
  const { hostelId = "" } = useLocalSearchParams<{ hostelId?: string }>();
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetDashboardActivitiesQuery(
    { hostelId, limit: 50 },
    { skip: !hostelId },
  );

  const activities = useMemo(
    () => mapDashboardActivities(data?.activities ?? []),
    [data?.activities],
  );

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Recent Activities" showBack />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {data?.hostel?.name ? (
            <Text style={styles.hostelName}>{data.hostel.name}</Text>
          ) : null}

          <RecentActivities
            showSectionTitle={false}
            activities={activities}
            isLoading={isLoading}
            emptyMessage="No recent activities yet."
          />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(16),
      paddingBottom: vs(24),
    },
    hostelName: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(12),
    },
  });
}
