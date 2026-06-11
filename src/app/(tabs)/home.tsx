import CollectionBanner from "@/components/CollectionBanner";
import GradientBackground from "@/components/GradientBackground";
import QuickActionCard from "@/components/QuickActionCard";
import RecentActivities from "@/components/RecentActivities";
import StatCard from "@/components/StatCard";
import type {
  CollectionBannerData,
  DashboardStat,
  QuickAction,
  RecentActivity,
} from "@/types/dashboard";
import { getTimeGreeting } from "@/utils/greeting";
import { router } from "expo-router";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

export default function Home() {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const user = useSelector((state: RootState) => state.auth.user);

  const greeting = getTimeGreeting();
  const userName = user?.name?.trim() || "Guest User";

  const dashboardStats: DashboardStat[] = useMemo(
    () => [
      {
        id: "total-rooms",
        title: "Total Rooms",
        value: 0,
        iconName: "home-outline",
        iconColor: "#F97316",
        iconBackgroundColor: "#FFEDD5",
      },
      {
        id: "total-beds",
        title: "Total Beds",
        value: 0,
        iconName: "bed-outline",
        iconColor: "#7C3AED",
        iconBackgroundColor: "#EDE9FE",
      },
      {
        id: "occupied",
        title: "Occupied",
        value: 0,
        iconName: "trending-up-outline",
        iconColor: colors.success,
        iconBackgroundColor: "#DCFCE7",
      },
      {
        id: "vacant",
        title: "Vacant",
        value: 0,
        iconName: "bed-outline",
        iconColor: colors.warning,
        iconBackgroundColor: "#FEF3C7",
      },
    ],
    [colors.success, colors.warning],
  );

  const collectionData: CollectionBannerData = useMemo(
    () => ({
      label: "MONTHLY COLLECTION",
      totalAmount: 0,
      pendingAmount: 0,
      complaintsOpen: 0,
      currency: "Rs",
      gradientColors: [colors.primary, colors.primary200],
    }),
    [],
  );

  const quickActions: QuickAction[] = useMemo(
    () => [
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
    ],
    [],
  );

  const recentActivities: RecentActivity[] = useMemo(() => [], []);

  const handleQuickAction = (actionId: string) => {
    if (actionId === "add-room") {
      router.push("/rooms/add");
      return;
    }
    if (actionId === "add-tenant") {
      router.push("/tenants/add");
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>

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

          <CollectionBanner {...collectionData} />

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

          <RecentActivities activities={recentActivities} />
        </ScrollView>
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
