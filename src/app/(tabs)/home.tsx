import CollectionBanner from "@/components/CollectionBanner";
import GradientBackground from "@/components/GradientBackground";
import HostelDropdown from "@/components/HostelDropdown";
import RecentActivities from "@/components/RecentActivities";
import ResidentHomeDashboard from "@/components/resident/ResidentHomeDashboard";
import StatCard from "@/components/StatCard";
import {
  aggregateDashboard,
  mapDashboardActivities,
  type CollectionBannerData,
  type DashboardStat,
  type HostelDashboardItem,
} from "@/types/dashboard";
import { getTimeGreeting } from "@/utils/greeting";
import { useUnreadNotificationCount } from "@/hooks/usePushNotifications";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_FEATURES } from "@/constants/plans";
import {
  useGetDashboardActivitiesQuery,
  useGetDashboardQuery,
} from "../../../store/api";
import { router, useFocusEffect } from "expo-router";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Home() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";
  const { guardFeature, checkFeature } = useSubscription();
  const notificationsAllowed = checkFeature(PLAN_FEATURES.notifications).allowed;
  const reportsAllowed = checkFeature(PLAN_FEATURES.reports).allowed;
  const { data: unreadData } = useUnreadNotificationCount(
    !user?.accessToken || (isManager && !notificationsAllowed),
  );
  const unreadCount = unreadData?.unreadCount ?? 0;

  const { data, isLoading, isFetching, refetch } = useGetDashboardQuery(
    undefined,
    { skip: !isManager },
  );

  const greeting = getTimeGreeting();
  const userName = user?.name?.trim() || "Guest User";
  const hostelItems: HostelDashboardItem[] = data?.hostels ?? [];
  const [selectedHostelId, setSelectedHostelId] = useState("all");

  useEffect(() => {
    if (hostelItems.length === 0) return;

    if (hostelItems.length === 1) {
      setSelectedHostelId(hostelItems[0].hostel.id);
      return;
    }

    const stillExists = hostelItems.some(
      (item) => item.hostel.id === selectedHostelId,
    );
    if (selectedHostelId !== "all" && !stillExists) {
      setSelectedHostelId("all");
    }
  }, [hostelItems, selectedHostelId]);

  const activitiesHostelId =
    selectedHostelId !== "all"
      ? selectedHostelId
      : hostelItems.length === 1
        ? hostelItems[0].hostel.id
        : "";

  const {
    data: activitiesData,
    isLoading: isActivitiesLoading,
    isFetching: isActivitiesFetching,
    refetch: refetchActivities,
  } = useGetDashboardActivitiesQuery(
    { hostelId: activitiesHostelId, limit: 5 },
    { skip: !isManager || !activitiesHostelId || !reportsAllowed },
  );

  const recentActivities = useMemo(
    () => mapDashboardActivities(activitiesData?.activities ?? []),
    [activitiesData?.activities],
  );

  const activitiesEmptyMessage =
    selectedHostelId === "all" && hostelItems.length > 1
      ? "Select a hostel to view recent activities."
      : "No recent activities yet.";

  const handleRefresh = useCallback(() => {
    refetch();
    if (activitiesHostelId) {
      refetchActivities();
    }
  }, [activitiesHostelId, refetch, refetchActivities]);

  useFocusEffect(
    useCallback(() => {
      if (isManager) {
        refetch();
        if (activitiesHostelId) {
          refetchActivities();
        }
      }
    }, [activitiesHostelId, isManager, refetch, refetchActivities]),
  );

  const filteredItems = useMemo(() => {
    if (selectedHostelId === "all") return hostelItems;
    const selected = hostelItems.find(
      (item) => item.hostel.id === selectedHostelId,
    );
    return selected ? [selected] : [];
  }, [hostelItems, selectedHostelId]);

  const summary = useMemo(
    () => aggregateDashboard(filteredItems),
    [filteredItems],
  );

  const hostelOptions = useMemo(
    () => hostelItems.map((item) => item.hostel),
    [hostelItems],
  );

  const dashboardStats: DashboardStat[] = useMemo(
    () => [
      {
        id: "total-rooms",
        title: "Total Rooms",
        value: summary.totalRooms,
        iconName: "home-outline",
        iconColor: colors.warning,
        iconBackgroundColor: colors.warningBg,
      },
      {
        id: "total-beds",
        title: "Total Beds",
        value: summary.totalBedrooms,
        iconName: "bed-outline",
        iconColor: colors.secondary,
        iconBackgroundColor: colors.purpleBg,
      },
      {
        id: "occupied",
        title: "Occupied",
        value: summary.occupiedBeds,
        iconName: "trending-up-outline",
        iconColor: colors.success,
        iconBackgroundColor: colors.successBg,
      },
      {
        id: "vacant",
        title: "Vacant",
        value: summary.vacantBeds,
        iconName: "bed-outline",
        iconColor: colors.warning,
        iconBackgroundColor: colors.warningBg,
      },
    ],
    [colors.success, colors.warning, colors.warningBg, colors.warningText, colors.successBg, colors.successText, colors.purpleBg, colors.purpleText, colors.secondary, summary],
  );

  const collectionData: CollectionBannerData = useMemo(() => {
    const { month, year } = summary;
    const label =
      month && year
        ? `${MONTH_NAMES[month - 1]?.toUpperCase() ?? "MONTHLY"} ${year} COLLECTION`
        : "MONTHLY COLLECTION";

    return {
      label,
      totalAmount: summary.collected,
      pendingAmount: summary.pending,
      complaintsOpen: summary.complaintsOpen,
      currency: "Rs",
    };
  }, [summary]);

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {!isManager ? (
          <ResidentHomeDashboard />
        ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            isManager ? (
              <RefreshControl
                refreshing={
                  (isFetching && !isLoading) ||
                  (isActivitiesFetching && !isActivitiesLoading)
                }
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <Pressable
              style={styles.notificationBtn}
              onPress={() =>
                guardFeature(PLAN_FEATURES.notifications, () =>
                  router.push("/notifications"),
                )
              }
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Ionicons
                name="notifications-outline"
                size={vs(24)}
                color={colors.text}
              />
              {unreadCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          {isManager && !isLoading && hostelOptions.length > 0 ? (
            <HostelDropdown
              hostels={hostelOptions}
              value={selectedHostelId}
              onChange={setSelectedHostelId}
            />
          ) : null}

          {isManager && isLoading ? (
            <View style={styles.loadingWrap}>
              <CustomLoading size="lg" />
            </View>
          ) : (
            <>
              <View style={styles.grid}>
                {dashboardStats.map((stat) => (
                  <View key={stat.id} style={styles.gridItem}>
                    <StatCard
                      title={stat.title}
                      value={stat.value}
                      iconName={stat.iconName}
                      iconColor={stat.iconColor}
                      iconBackgroundColor={stat.iconBackgroundColor}
                    />
                  </View>
                ))}
              </View>

              {isManager ? (
                <CollectionBanner
                  {...collectionData}
                  onComplaintsPress={() =>
                    guardFeature(PLAN_FEATURES.complaints, () =>
                      router.push({
                        pathname: "/complaints",
                        params: {
                          hostelId:
                            selectedHostelId !== "all" ? selectedHostelId : "",
                        },
                      }),
                    )
                  }
                />
              ) : null}
            </>
          )}

          {isManager && reportsAllowed ? (
            <RecentActivities
              activities={recentActivities}
              isLoading={isActivitiesLoading}
              emptyMessage={activitiesEmptyMessage}
              onSeeAllPress={
                activitiesHostelId
                  ? () =>
                      guardFeature(PLAN_FEATURES.reports, () =>
                        router.push({
                          pathname: "/activities",
                          params: { hostelId: activitiesHostelId },
                        }),
                      )
                  : undefined
              }
            />
          ) : null}
        </ScrollView>
        )}
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
      backgroundColor: "transparent",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 110,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
    },
    headerText: {
      flex: 1,
    },
    notificationBtn: {
      width: vs(44),
      height: vs(44),
      borderRadius: vs(22),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? colors.white200 : colors.primary100,
    },
    notificationBadge: {
      position: "absolute",
      top: vs(4),
      right: vs(4),
      minWidth: vs(18),
      height: vs(18),
      borderRadius: vs(9),
      paddingHorizontal: vs(4),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.error,
    },
    notificationBadgeText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.bold,
      color: colors.onPrimary,
    },
    greeting: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    userName: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    loadingWrap: {
      minHeight: 200,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -6,
      marginBottom: 4,
    },
    gridItem: {
      width: "50%",
      paddingHorizontal: 6,
      marginBottom: 12,
    },
  });
}
