import HostelDropdown from "@/components/HostelDropdown";
import type { Hostel } from "@/types/hostel";
import {
  COMPLAINT_FILTERS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUSES,
  type Complaint,
  type ComplaintFilter,
  type ComplaintStatus,
} from "@/types/complaint";
import {
  useGetComplaintsQuery,
  useGetHostelsQuery,
  useUpdateComplaintStatusMutation,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Alert,
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

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type ComplaintCardProps = {
  complaint: Complaint;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  isUpdating: boolean;
  onStatusChange: (complaintId: string, status: ComplaintStatus) => void;
};

function ComplaintCard({
  complaint,
  styles,
  colors,
  isUpdating,
  onStatusChange,
}: ComplaintCardProps) {
  const statusStyle =
    complaint.status === "resolved"
      ? styles.statusResolved
      : complaint.status === "in_progress"
        ? styles.statusInProgress
        : styles.statusOpen;

  const statusTextStyle =
    complaint.status === "resolved"
      ? styles.statusTextResolved
      : complaint.status === "in_progress"
        ? styles.statusTextInProgress
        : styles.statusTextOpen;

  const metaParts = [
    complaint.resident?.name,
    complaint.room ? `Room ${complaint.room.roomNumber}` : null,
    complaint.category,
  ].filter(Boolean);

  const otherStatuses = COMPLAINT_STATUSES.filter(
    (status) => status !== complaint.status,
  );

  const handleStatusPress = (status: ComplaintStatus) => {
    Alert.alert(
      "Update status",
      `Mark "${complaint.title}" as ${COMPLAINT_STATUS_LABELS[status]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: () => onStatusChange(complaint.id, status),
        },
      ],
    );
  };

  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordHeaderLeft}>
          <Text style={styles.recordTitle}>{complaint.title}</Text>
          {metaParts.length > 0 ? (
            <Text style={styles.recordMeta}>{metaParts.join(" · ")}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, statusTextStyle]}>
            {COMPLAINT_STATUS_LABELS[complaint.status as ComplaintStatus]}
          </Text>
        </View>
      </View>

      {complaint.description ? (
        <Text style={styles.recordDescription} numberOfLines={3}>
          {complaint.description}
        </Text>
      ) : null}

      <Text style={styles.recordDate}>{formatDate(complaint.createdAt)}</Text>

      <View style={styles.statusActions}>
        {isUpdating ? (
          <CustomLoading size="sm" />
        ) : (
          otherStatuses.map((status) => (
            <Pressable
              key={status}
              style={styles.statusActionBtn}
              onPress={() => handleStatusPress(status)}
            >
              <Text style={styles.statusActionText}>
                {COMPLAINT_STATUS_LABELS[status]}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

export default function ComplaintsScreen() {
  const { hostelId: presetHostelId } = useLocalSearchParams<{
    hostelId?: string;
  }>();
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";

  const [activeFilter, setActiveFilter] = useState<ComplaintFilter>("all");
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(
    null,
  );

  const [updateComplaintStatus] = useUpdateComplaintStatusMutation();

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

  useEffect(() => {
    if (hostelOptions.length === 0) return;

    const presetExists =
      presetHostelId &&
      presetHostelId !== "all" &&
      hostelOptions.some(
        (hostel: { id: string; name: string }) => hostel.id === presetHostelId,
      );

    if (presetExists) {
      setSelectedHostelId(presetHostelId!);
      return;
    }

    const exists = hostelOptions.some(
      (hostel: { id: string; name: string }) => hostel.id === selectedHostelId,
    );
    if (!selectedHostelId || !exists) {
      setSelectedHostelId(hostelOptions[0].id);
    }
  }, [hostelOptions, presetHostelId, selectedHostelId]);

  const {
    data: complaintsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetComplaintsQuery(
    { hostelId: selectedHostelId, status: activeFilter },
    { skip: !isManager || !selectedHostelId },
  );

  useFocusEffect(
    useCallback(() => {
      if (isManager && selectedHostelId) {
        refetch();
      }
    }, [isManager, selectedHostelId, refetch]),
  );

  const complaints = complaintsData?.complaints ?? [];
  const summary = complaintsData?.summary;
  const isEmpty = !isLoading && complaints.length === 0;

  const emptyMessage =
    activeFilter === "all"
      ? "No complaints for this hostel."
      : `No ${COMPLAINT_STATUS_LABELS[activeFilter as ComplaintStatus] ?? activeFilter} complaints found.`;

  const handleStatusChange = async (
    complaintId: string,
    status: ComplaintStatus,
  ) => {
    if (!selectedHostelId || updatingComplaintId) return;

    setUpdatingComplaintId(complaintId);
    try {
      await updateComplaintStatus({
        id: complaintId,
        status,
        hostelId: selectedHostelId,
      }).unwrap();
    } catch (error) {
      const err = error as { data?: { message?: string } | string };
      const message =
        typeof err.data === "string"
          ? err.data
          : err.data?.message ?? "Failed to update complaint status.";
      Alert.alert("Update failed", message);
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  if (!isManager) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.noAccessWrap}>
          <Text style={styles.emptyTitle}>Complaints</Text>
          <Text style={styles.emptyDescription}>
            Complaint management is available for managers only.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hostelOptions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={vs(22)} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Complaints</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.noAccessWrap}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons
              name="office-building-outline"
              size={vs(36)}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>No hostels yet</Text>
          <Text style={styles.emptyDescription}>
            Add a hostel first to view complaints.
          </Text>
          <Pressable
            style={styles.emptyAction}
            onPress={() => router.push("/(tabs)/hostels")}
          >
            <Text style={styles.emptyActionText}>Go to Hostels</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.staticHeader}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={vs(22)} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Complaints</Text>
          <View style={styles.backBtn} />
        </View>

        <HostelDropdown
          hostels={hostelOptions}
          value={selectedHostelId}
          onChange={setSelectedHostelId}
          showAllOption={false}
        />

        {summary ? (
          <View style={styles.summaryRow}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipValue}>{summary.open}</Text>
              <Text style={styles.summaryChipLabel}>Open</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipValue}>{summary.in_progress}</Text>
              <Text style={styles.summaryChipLabel}>In Progress</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipValue}>{summary.resolved}</Text>
              <Text style={styles.summaryChipLabel}>Resolved</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.filterBar}>
          {COMPLAINT_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <Pressable
                key={filter.id}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <CustomLoading size="lg" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            isEmpty && styles.scrollContentEmpty,
          ]}
        >
          {isEmpty ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons
                  name="message-alert-outline"
                  size={vs(36)}
                  color={colors.warning}
                />
              </View>
              <Text style={styles.emptyTitle}>No complaints</Text>
              <Text style={styles.emptyDescription}>{emptyMessage}</Text>
            </View>
          ) : (
            complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                styles={styles}
                colors={colors}
                isUpdating={updatingComplaintId === complaint.id}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
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
      backgroundColor: colors.background,
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
      marginBottom: vs(12),
    },
    backBtn: {
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
    summaryRow: {
      flexDirection: "row",
      gap: vs(10),
      marginBottom: vs(16),
    },
    summaryChip: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: vs(12),
      paddingVertical: vs(12),
      paddingHorizontal: vs(8),
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.white100,
    },
    summaryChipValue: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(2),
    },
    summaryChipLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    filterBar: {
      flexDirection: "row",
      backgroundColor: colors.white100,
      borderRadius: vs(14),
      padding: vs(4),
      marginBottom: vs(12),
    },
    filterTab: {
      flex: 1,
      paddingVertical: vs(10),
      alignItems: "center",
      borderRadius: vs(10),
    },
    filterTabActive: {
      backgroundColor: colors.white,
    },
    filterText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    filterTextActive: {
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: vs(48),
    },
    emptyIconWrap: {
      width: vs(80),
      height: vs(80),
      borderRadius: vs(18),
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.15)" : "#FFEDD5",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(20),
    },
    emptyTitle: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(8),
    },
    emptyDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      maxWidth: vs(260),
    },
    emptyAction: {
      marginTop: vs(20),
      backgroundColor: colors.primary100,
      paddingHorizontal: vs(16),
      paddingVertical: vs(10),
      borderRadius: vs(20),
    },
    emptyActionText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    recordCard: {
      backgroundColor: colors.white,
      borderRadius: vs(14),
      padding: vs(16),
      marginBottom: vs(10),
      borderWidth: 1,
      borderColor: colors.white100,
    },
    recordHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: vs(12),
    },
    recordHeaderLeft: {
      flex: 1,
    },
    recordTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    recordMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    recordDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      marginTop: vs(10),
      lineHeight: vs(20),
    },
    recordDate: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginTop: vs(10),
    },
    statusBadge: {
      paddingHorizontal: vs(10),
      paddingVertical: vs(4),
      borderRadius: vs(20),
    },
    statusOpen: {
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.15)" : "#FEF3C7",
    },
    statusInProgress: {
      backgroundColor: isDark ? colors.primary100 : "#DBEAFE",
    },
    statusResolved: {
      backgroundColor: isDark ? colors.secondary100 : "#DCFCE7",
    },
    statusText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
    },
    statusTextOpen: {
      color: colors.warning,
    },
    statusTextInProgress: {
      color: colors.primary,
    },
    statusTextResolved: {
      color: colors.success,
    },
    statusActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: vs(8),
      marginTop: vs(12),
      paddingTop: vs(12),
      borderTopWidth: 1,
      borderTopColor: colors.white100,
    },
    statusActionBtn: {
      paddingHorizontal: vs(12),
      paddingVertical: vs(8),
      borderRadius: vs(20),
      backgroundColor: colors.primary100,
    },
    statusActionText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
}
