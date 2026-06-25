import type { HostelDashboardItem } from "@/types/dashboard";
import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import HostelCard from "@/components/HostelCard";
import ScreenHeader from "@/components/ScreenHeader";
import { useGetDashboardQuery, useGetHostelsQuery } from "../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import { useTheme } from "@constants/constant";
import { vs } from "@constants/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  FlatList,
  Pressable,
  StyleSheet,
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(), []);
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

  const hostelCountLabel = `${hostels.length} hostel${hostels.length === 1 ? "" : "s"}`;

  const headerRightSlot = (
    <Pressable
      style={styles.addBtn}
      onPress={handleAddHostel}
      accessibilityRole="button"
      accessibilityLabel="Add hostel"
    >
      <MaterialCommunityIcons
        name="plus"
        size={vs(24)}
        color={colors.primary}
      />
    </Pressable>
  );

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
            rightSlot={headerRightSlot}
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
        <ScreenHeader
          title="My Hostels"
          showBack={showBackButton}
          subtitle={hostelCountLabel}
          rightSlot={headerRightSlot}
        />

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

function createStyles() {
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
    addBtn: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    listContent: {
      paddingHorizontal: vs(20),
    },
  });
}
