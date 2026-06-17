import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import HostelDropdown from "@/components/HostelDropdown";
import ProfileAvatar from "@/components/ProfileAvatar";
import type { Hostel } from "@/types/hostel";
import type { Resident } from "@/types/resident";
import { formatCnic } from "@/utils/cnic";
import { getResidentMonthlyRent } from "@/utils/room";
import {
  useGetHostelsQuery,
  useGetResidentsQuery,
  useLazyGetResidentsQuery,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

type ResidentRow = Resident & { hostelName?: string };

type ResidentCardProps = {
  resident: ResidentRow;
  showHostel: boolean;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  onPress: () => void;
  onGenerateReport: () => void;
};

function ResidentCard({
  resident,
  showHostel,
  styles,
  colors,
  onPress,
  onGenerateReport,
}: ResidentCardProps) {
  const metaParts = [
    `Room ${resident.roomNumber}`,
    `Rs ${getResidentMonthlyRent(resident).toLocaleString()}/mo`,
    resident.phone,
    showHostel && resident.hostelName ? resident.hostelName : null,
  ].filter(Boolean);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.recordCard,
        pressed && styles.recordCardPressed,
      ]}
      onPress={onPress}
    >
      <ProfileAvatar
        name={resident.name}
        phone={resident.phone}
        imageUri={resident.profileImage}
        size={vs(44)}
      />
      <View style={styles.recordContent}>
        <Text style={styles.recordTitle}>{resident.name}</Text>
        <Text style={styles.recordMeta}>{metaParts.join(" · ")}</Text>
        {resident.cnic ? (
          <Text style={styles.recordSubMeta}>{formatCnic(resident.cnic)}</Text>
        ) : null}
      </View>
      <Pressable
        style={styles.reportBtn}
        onPress={(event) => {
          event.stopPropagation();
          onGenerateReport();
        }}
        hitSlop={8}
      >
        <Ionicons name="document-text-outline" size={vs(18)} color={colors.primary} />
      </Pressable>
    </Pressable>
  );
}

export default function ResidentsScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";

  const [selectedHostelId, setSelectedHostelId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [allResidents, setAllResidents] = useState<ResidentRow[]>([]);
  const [allLoading, setAllLoading] = useState(false);

  const { data: hostelsData } = useGetHostelsQuery(undefined, {
    skip: !isManager,
  });

  const hostelOptions = useMemo(
    () =>
      (hostelsData?.hostels ?? []).map((hostel: Hostel) => ({
        id: hostel._id,
        name: hostel.name,
      })),
    [hostelsData?.hostels],
  );

  const hostelNameById = useMemo(
    () =>
      Object.fromEntries(
        (hostelsData?.hostels ?? []).map((hostel: Hostel) => [
          hostel._id,
          hostel.name,
        ]),
      ),
    [hostelsData?.hostels],
  );

  useEffect(() => {
    if (hostelOptions.length === 0) return;

    const exists = hostelOptions.some(
      (hostel) => hostel.id === selectedHostelId,
    );
    if (selectedHostelId !== "all" && exists) return;

    setSelectedHostelId(
      hostelOptions.length > 1 ? "all" : hostelOptions[0].id,
    );
  }, [hostelOptions, selectedHostelId]);

  const [fetchResidents] = useLazyGetResidentsQuery();

  const loadAllResidents = useCallback(async () => {
    if (!isManager || hostelOptions.length === 0) return;

    setAllLoading(true);
    try {
      const results = await Promise.all(
        hostelOptions.map((hostel) =>
          fetchResidents({ hostelId: hostel.id })
            .unwrap()
            .then((response) =>
              (response.residents ?? []).map((resident) => ({
                ...resident,
                hostelName: hostel.name,
              })),
            )
            .catch(() => [] as ResidentRow[]),
        ),
      );
      setAllResidents(results.flat());
    } finally {
      setAllLoading(false);
    }
  }, [fetchResidents, hostelOptions, isManager]);

  const {
    data: singleHostelData,
    isLoading: singleLoading,
    isFetching: singleFetching,
    refetch: refetchSingle,
  } = useGetResidentsQuery(
    { hostelId: selectedHostelId },
    {
      skip:
        !isManager ||
        !selectedHostelId ||
        selectedHostelId === "all" ||
        hostelOptions.length === 0,
    },
  );

  const refreshResidents = useCallback(async () => {
    if (selectedHostelId === "all") {
      await loadAllResidents();
      return;
    }
    await refetchSingle();
  }, [loadAllResidents, refetchSingle, selectedHostelId]);

  useFocusEffect(
    useCallback(() => {
      if (!isManager || hostelOptions.length === 0) return;
      if (selectedHostelId === "all") {
        loadAllResidents();
      } else {
        refetchSingle();
      }
    }, [
      isManager,
      hostelOptions.length,
      selectedHostelId,
      loadAllResidents,
      refetchSingle,
    ]),
  );

  const residents = useMemo(() => {
    if (selectedHostelId === "all") {
      return allResidents;
    }

    const hostelName = hostelNameById[selectedHostelId];
    return (singleHostelData?.residents ?? []).map((resident) => ({
      ...resident,
      hostelName,
    }));
  }, [
    allResidents,
    hostelNameById,
    selectedHostelId,
    singleHostelData?.residents,
  ]);

  const filteredResidents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [...residents].sort((a, b) => a.name.localeCompare(b.name));
    }

    return residents
      .filter((resident) => {
        const haystack = [
          resident.name,
          resident.phone,
          resident.roomNumber,
          resident.cnic,
          resident.hostelName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [residents, searchQuery]);

  const isLoading =
    selectedHostelId === "all" ? allLoading : singleLoading && !singleHostelData;
  const isRefreshing =
    selectedHostelId === "all" ? allLoading : singleFetching && !singleLoading;
  const isEmpty = !isLoading && filteredResidents.length === 0;
  const showHostel = selectedHostelId === "all" || hostelOptions.length > 1;

  if (!isManager) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.noAccessWrap}>
            <Text style={styles.emptyTitle}>Residents</Text>
            <Text style={styles.emptyDescription}>
              Resident lists are available for managers only.
            </Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (hostelOptions.length === 0) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScreenHeader title="Residents" showBack />
          <EmptyState
            title="No hostels yet"
            description="Add a hostel first to view residents."
            actionLabel="Go to Hostels"
            onAction={() => router.push("/(tabs)/hostels")}
          />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.staticHeader}>
        <ScreenHeader
          title="Residents"
          showBack
          rightSlot={
            <Pressable
              style={styles.addBtn}
              onPress={() => router.push("/residents/add")}
            >
              <Ionicons
                name="person-add-outline"
                size={vs(22)}
                color={colors.primary}
              />
            </Pressable>
          }
        />

        <HostelDropdown
          hostels={hostelOptions}
          value={selectedHostelId}
          onChange={setSelectedHostelId}
          showAllOption
        />

        <View style={styles.searchWrap}>
          <Ionicons
            name="search-outline"
            size={vs(18)}
            color={colors.gray200}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, room..."
            placeholderTextColor={colors.gray200}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={vs(18)} color={colors.gray200} />
            </Pressable>
          ) : null}
        </View>

        {!isLoading ? (
          <Text style={styles.countLabel}>
            {filteredResidents.length} resident
            {filteredResidents.length === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <CustomLoading size="lg" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isEmpty && styles.scrollContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshResidents}
              tintColor={colors.primary}
            />
          }
        >
          {isEmpty ? (
            <EmptyState
              title={searchQuery.trim() ? "No matches found" : "No residents yet"}
              description={
                searchQuery.trim()
                  ? "Try a different name, phone number, or room."
                  : "Add your first resident to start tracking occupancy."
              }
              actionLabel={searchQuery.trim() ? undefined : "Add Resident"}
              onAction={
                searchQuery.trim()
                  ? undefined
                  : () => router.push("/residents/add")
              }
              size="sm"
            />
          ) : (
            filteredResidents.map((resident) => (
              <ResidentCard
                key={resident.tenancyId}
                resident={resident}
                showHostel={showHostel}
                styles={styles}
                colors={colors}
                onPress={() =>
                  router.push({
                    pathname: "/reports/resident-profile",
                    params: {
                      tenancyId: resident.tenancyId,
                      hostelId: resident.hostelId,
                    },
                  })
                }
                onGenerateReport={() =>
                  router.push({
                    pathname: "/reports/resident-profile",
                    params: {
                      tenancyId: resident.tenancyId,
                      hostelId: resident.hostelId,
                    },
                  })
                }
              />
            ))
          )}
        </ScrollView>
      )}
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
    staticHeader: {
      paddingHorizontal: vs(20),
      paddingTop: vs(8),
      paddingBottom: vs(4),
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: vs(16),
    },
    backBtn: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    addBtn: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(14),
      height: vs(48),
      marginBottom: vs(12),
    },
    searchIcon: {
      marginRight: vs(8),
    },
    searchInput: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      paddingVertical: 0,
    },
    countLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(8),
      marginLeft: vs(4),
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    scrollContentEmpty: {
      flexGrow: 1,
      justifyContent: "center",
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    noAccessWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(32),
    },
    recordCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(12),
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(10),
    },
    recordCardPressed: {
      backgroundColor: colors.white100,
    },
    recordContent: {
      flex: 1,
    },
    recordTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(2),
    },
    recordMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    recordSubMeta: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray300,
      marginTop: vs(2),
    },
    reportBtn: {
      width: vs(36),
      height: vs(36),
      borderRadius: vs(10),
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyWrap: {
      alignItems: "center",
      paddingHorizontal: vs(24),
    },
    emptyIconWrap: {
      width: vs(72),
      height: vs(72),
      borderRadius: vs(36),
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(16),
    },
    emptyTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(8),
      textAlign: "center",
    },
    emptyDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(22),
      marginBottom: vs(20),
    },
    emptyAction: {
      backgroundColor: colors.primary,
      paddingHorizontal: vs(24),
      paddingVertical: vs(12),
      borderRadius: vs(12),
    },
    emptyActionText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.white,
    },
  });
}
