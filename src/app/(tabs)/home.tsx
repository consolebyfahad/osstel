import CollectionBanner from "@/components/CollectionBanner";
import GradientBackground from "@/components/GradientBackground";
import HostelDropdown from "@/components/HostelDropdown";
import QuickActionCard from "@/components/QuickActionCard";
import RecentActivities from "@/components/RecentActivities";
import ResidentHomeDashboard from "@/components/resident/ResidentHomeDashboard";
import StatCard from "@/components/StatCard";
import {
  aggregateDashboard,
  mapDashboardActivities,
  type CollectionBannerData,
  type DashboardStat,
  type HostelDashboardItem,
  type QuickAction,
} from "@/types/dashboard";
import { getTimeGreeting } from "@/utils/greeting";
import {
  useGetDashboardActivitiesQuery,
  useGetDashboardQuery,
} from "../../../store/api";
import { router, useFocusEffect } from "expo-router";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
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
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";

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
    { hostelId: activitiesHostelId, limit: 20 },
    { skip: !isManager || !activitiesHostelId },
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
        iconColor: "#F97316",
        iconBackgroundColor: "#FFEDD5",
      },
      {
        id: "total-beds",
        title: "Total Beds",
        value: summary.totalBedrooms,
        iconName: "bed-outline",
        iconColor: "#7C3AED",
        iconBackgroundColor: "#EDE9FE",
      },
      {
        id: "occupied",
        title: "Occupied",
        value: summary.occupiedBeds,
        iconName: "trending-up-outline",
        iconColor: colors.success,
        iconBackgroundColor: "#DCFCE7",
      },
      {
        id: "vacant",
        title: "Vacant",
        value: summary.vacantBeds,
        iconName: "bed-outline",
        iconColor: colors.warning,
        iconBackgroundColor: "#FEF3C7",
      },
    ],
    [colors.success, colors.warning, summary],
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
      gradientColors: [colors.primary, colors.primary200],
    };
  }, [colors.primary, colors.primary200, summary]);

  const quickActions: QuickAction[] = useMemo(
    () =>
      isManager
        ? [
            {
              id: "add-room",
              label: "Add Room",
              iconName: "add",
              iconColor: "#C2410C",
              iconBackgroundColor: "#FFEDD5",
            },
            {
              id: "add-tenant",
              label: "Add Tenant",
              iconName: "person-add-outline",
              iconColor: "#15803D",
              iconBackgroundColor: "#DCFCE7",
            },
            {
              id: "reports",
              label: "Reports",
              iconName: "download-outline",
              iconColor: "#6D28D9",
              iconBackgroundColor: "#EDE9FE",
            },
          ]
        : [],
    [isManager],
  );

  const handleQuickAction = (actionId: string) => {
    if (actionId === "add-room") {
      router.push("/(tabs)/hostels");
      return;
    }
    if (actionId === "add-tenant") {
      router.push("/tenants/add");
      return;
    }
    if (actionId === "reports") {
      router.push("/reports");
    }
  };

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
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{userName}</Text>
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
                    router.push({
                      pathname: "/complaints",
                      params: {
                        hostelId:
                          selectedHostelId !== "all" ? selectedHostelId : "",
                      },
                    })
                  }
                />
              ) : null}
            </>
          )}

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <View key={action.id} style={styles.actionItem}>
                <QuickActionCard
                  {...action}
                  onPress={() => handleQuickAction(action.id)}
                />
              </View>
            ))}
          </View>

          {isManager ? (
            <RecentActivities
              activities={recentActivities}
              isLoading={isActivitiesLoading}
              emptyMessage={activitiesEmptyMessage}
            />
          ) : null}
        </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
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
      marginBottom: 24,
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
    sectionTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: 14,
    },
    actionsRow: {
      flexDirection: "row",
      marginHorizontal: -6,
      marginBottom: 4,
    },
    actionItem: {
      flex: 1,
      paddingHorizontal: 6,
    },
  });
}
