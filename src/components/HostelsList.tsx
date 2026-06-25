import type { HostelDashboardItem } from "@/types/dashboard";
import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import HostelCard from "@/components/HostelCard";
import ScreenHeader from "@/components/ScreenHeader";
import { useGetDashboardQuery, useGetHostelsQuery } from "../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HostelsListProps = {
  showBackButton?: boolean;
  listBottomPadding?: number;
};

export default function HostelsList({
  showBackButton = false,
  listBottomPadding = vs(40),
}: HostelsListProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const { data, isLoading, isFetching, refetch } = useGetHostelsQuery(undefined);
  const { data: dashboardData, refetch: refetchDashboard } =
    useGetDashboardQuery(undefined);
  const { guardAddHostel } = useSubscription();

  const dashboardByHostelId = useMemo(() => {
    const map: Record<string, HostelDashboardItem> = {};
    for (const item of dashboardData?.hostels ?? []) {
      map[item.hostel.id] = item;
    }
    return map;
  }, [dashboardData?.hostels]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchDashboard();
    }, [refetch, refetchDashboard]),
  );

  const hostels = data?.hostels ?? [];

  const handleAddHostel = () => {
    guardAddHostel(() => router.push("/hostel/details"));
  };

  const handleOpenHostel = (hostelId: string) => {
    router.push(`/hostel/${hostelId}`);
  };

  if (isLoading) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.loadingWrap}>
            <CustomLoading size="lg" />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (hostels.length === 0) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScreenHeader
            title="My Hostels"
            showBack={showBackButton}
          />
          <EmptyState
            title="No hostels yet"
            description="Add your first hostel to start managing rooms and residents."
            actionLabel="Add Hostel"
            onAction={handleAddHostel}
          />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="My Hostels" showBack={showBackButton} />

        <View style={styles.listHeader}>
        <Text style={styles.listSubtitle}>
          {hostels.length} hostel{hostels.length === 1 ? "" : "s"}
        </Text>
        <Pressable style={styles.addChip} onPress={handleAddHostel}>
          <MaterialCommunityIcons
            name="plus"
            size={vs(18)}
            color={colors.primary}
          />
          <Text style={styles.addChipText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={hostels}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: listBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching}
        onRefresh={() => {
          refetch();
          refetchDashboard();
        }}
        renderItem={({ item }) => (
          <HostelCard
            hostel={item}
            stats={dashboardByHostelId[item._id]}
            onPress={() => handleOpenHostel(item._id)}
          />
        )}
      />
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: vs(20),
      paddingBottom: vs(12),
    },
    listSubtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    addChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(4),
      backgroundColor: isDark ? colors.white100 : colors.primary100,
      paddingHorizontal: vs(12),
      paddingVertical: vs(8),
      borderRadius: vs(20),
    },
    addChipText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    listContent: {
      paddingHorizontal: vs(20),
    },
  });
}
