import CustomButton from "@/components/CustomButton";
import HostelCard from "@/components/HostelCard";
import { useGetDashboardQuery, useGetHostelsQuery } from "../../store/api";
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
  TouchableOpacity,
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

  const roomCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of dashboardData?.hostels ?? []) {
      counts[item.hostel.id] = item.rooms.totalRooms;
    }
    return counts;
  }, [dashboardData?.hostels]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchDashboard();
    }, [refetch, refetchDashboard]),
  );

  const hostels = data?.hostels ?? [];

  const handleAddHostel = () => {
    router.push("/hostel/details");
  };

  const handleOpenHostel = (hostelId: string) => {
    router.push(`/hostel/${hostelId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <CustomLoading size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  const header = (
    <View style={styles.header}>
      {showBackButton ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={vs(24)} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}
      <Text style={styles.headerTitle}>My Hostels</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (hostels.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {header}
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="office-building-outline"
              size={vs(40)}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>No hostels yet</Text>
          <Text style={styles.description}>
            Add your first hostel to start managing rooms and residents.
          </Text>
          <CustomButton title="Add Hostel" onPress={handleAddHostel} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {header}

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
            roomCount={roomCounts[item._id] ?? 0}
            onPress={() => handleOpenHostel(item._id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: vs(16),
      paddingVertical: vs(12),
    },
    backButton: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
    },
    headerSpacer: {
      width: vs(40),
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(32),
      paddingBottom: vs(40),
    },
    iconWrap: {
      width: vs(88),
      height: vs(88),
      borderRadius: vs(44),
      backgroundColor: isDark ? colors.white100 : colors.primary100,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(20),
    },
    title: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(8),
      textAlign: "center",
    },
    description: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(22),
      marginBottom: vs(28),
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
