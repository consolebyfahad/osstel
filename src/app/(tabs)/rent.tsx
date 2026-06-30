import AnimatedFilterBar from "@/components/AnimatedFilterBar";
import CustomButton from "@/components/CustomButton";
import GradientBackground from "@/components/GradientBackground";
import HostelDropdown from "@/components/HostelDropdown";
import RentBillBreakdown from "@/components/RentBillBreakdown";
import ResidentRentView from "@/components/resident/ResidentRentView";
import EmptyState from "@/components/EmptyState";
import { useHostelConnection } from "@/hooks/useHostelConnection";
import ScreenHeader from "@/components/ScreenHeader";
import type { Hostel } from "@/types/hostel";
import type { RentFilter, RentRecord, RentStatus } from "@/types/rent";
import { formatCompactCurrency } from "@/utils/currency";
import { useGetHostelsQuery, useGetRentQuery, useSendRentAlertMutation, useUpdateRentStatusMutation } from "../../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_FEATURES } from "@/constants/plans";
import { showSubscriptionBlocked } from "@/utils/subscriptionAlert";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

const FILTERS: { id: RentFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "review", label: "Review" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
];

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

const STATUS_LABELS: Record<RentStatus, string> = {
  review: "Review",
  paid: "Paid",
  pending: "Pending",
  rejected: "Rejected",
};

function formatAmount(amount: number) {
  return formatCompactCurrency(amount);
}

function formatMonthYear(month: number, year: number) {
  return `${MONTH_NAMES[month - 1] ?? "Month"} ${year}`;
}

type SummaryCardProps = {
  label: string;
  value: string;
  variant: "expected" | "collected" | "pending";
  styles: ReturnType<typeof createStyles>;
};

function SummaryCard({ label, value, variant, styles }: SummaryCardProps) {
  const variantStyle =
    variant === "collected"
      ? styles.summaryCollected
      : variant === "pending"
        ? styles.summaryPending
        : styles.summaryExpected;

  const labelStyle =
    variant === "collected"
      ? styles.summaryLabelCollected
      : variant === "pending"
        ? styles.summaryLabelPending
        : styles.summaryLabelExpected;

  const valueStyle =
    variant === "collected"
      ? styles.summaryValueCollected
      : variant === "pending"
        ? styles.summaryValuePending
        : styles.summaryValueExpected;

  return (
    <View style={[styles.summaryCard, variantStyle]}>
      <Text style={[styles.summaryValue, valueStyle]}>{value}</Text>
      <Text style={[styles.summaryLabel, labelStyle]}>{label}</Text>
    </View>
  );
}

type RentRecordCardProps = {
  record: RentRecord;
  styles: ReturnType<typeof createStyles>;
  onReview: (rentId: string, approve: boolean) => void;
  onSendAlert: (rentId: string, residentName: string) => void;
  onMarkPaid: (rentId: string, residentName: string) => void;
  isUpdating: boolean;
  isSendingAlert: boolean;
};

function RentRecordCard({
  record,
  styles,
  onReview,
  onSendAlert,
  onMarkPaid,
  isUpdating,
  isSendingAlert,
}: RentRecordCardProps) {
  const { colors } = useTheme();
  const statusStyle =
    record.status === "paid"
      ? styles.statusPaid
      : record.status === "review"
        ? styles.statusReview
        : styles.statusPending;

  const statusTextStyle =
    record.status === "paid"
      ? styles.statusTextPaid
      : record.status === "review"
        ? styles.statusTextReview
        : styles.statusTextPending;

  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordHeaderLeft}>
          <Text style={styles.recordName}>{record.resident.name}</Text>
          <Text style={styles.recordMeta}>
            Room {record.room.roomNumber} · {formatAmount(record.amount)}
          </Text>
        </View>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, statusTextStyle]}>
            {STATUS_LABELS[record.status]}
          </Text>
        </View>
      </View>

      {record.isOverdue ? (
        <Text style={styles.overdueText}>Overdue</Text>
      ) : null}

      {record.status === "review" && record.submittedAt ? (
        <Text style={styles.recordSubtext}>Payment submitted for review</Text>
      ) : null}

      {record.rejectionReason ? (
        <Text style={styles.rejectionText}>{record.rejectionReason}</Text>
      ) : null}

      {(record.charges?.length ?? 0) > 0 || record.baseAmount != null ? (
        <View style={styles.breakdownWrap}>
          <RentBillBreakdown
            baseAmount={record.baseAmount ?? record.amount}
            charges={record.charges}
            totalAmount={record.amount}
            compact
          />
        </View>
      ) : null}

      {record.status !== "paid" && record.status !== "review" ? (
        <CustomButton
          title={record.billFinalizedAt ? "Edit Bill" : "Finalize Bill"}
          variant="outline"
          size="sm"
          fullWidth={false}
          style={styles.editBillBtn}
          onPress={() =>
            router.push({
              pathname: "/rent/bill/[rentId]",
              params: { rentId: record.id },
            })
          }
        />
      ) : null}

      {record.status === "review" ? (
        <View style={styles.reviewActions}>
          <CustomButton
            title="Approve"
            variant="success"
            size="sm"
            fullWidth={false}
            style={styles.reviewActionBtn}
            disabled={isUpdating}
            loading={isUpdating}
            onPress={() => onReview(record.id, true)}
          />
          <CustomButton
            title="Reject"
            variant="destructive"
            size="sm"
            fullWidth={false}
            style={styles.reviewActionBtn}
            disabled={isUpdating}
            onPress={() => onReview(record.id, false)}
          />
        </View>
      ) : null}

      {record.status !== "paid" && record.status !== "review" ? (
        <View style={styles.pendingActions}>
          <CustomButton
            variant="outline"
            size="sm"
            fullWidth={false}
            style={styles.pendingActionBtn}
            disabled={isSendingAlert || isUpdating}
            icon={
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={vs(16)}
                color={colors.primary}
              />
            }
            title="Send Alert"
            onPress={() => onSendAlert(record.id, record.resident.name)}
            loading={isSendingAlert}
          />
          <CustomButton
            variant="success"
            size="sm"
            fullWidth={false}
            style={styles.pendingActionBtn}
            disabled={isSendingAlert || isUpdating}
            icon={
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={vs(16)}
                color={colors.success}
              />
            }
            title="Mark as Paid"
            onPress={() => onMarkPaid(record.id, record.resident.name)}
            loading={isUpdating}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function Rent() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";
  const { isConnected } = useHostelConnection();

  if (!isManager && !isConnected) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScreenHeader title="Rent" />
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
            <EmptyState
              title="Connect to a hostel"
              description="Join your hostel first to view rent and submit payments."
              actionLabel="Join Hostel"
              onAction={() => router.push("/join-hostel")}
              size="sm"
            />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return isManager ? <ManagerRentView /> : <ResidentRentView />;
}

function ManagerRentView() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const shiftPeriod = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };

  const isCurrentPeriod =
    month === now.getMonth() + 1 && year === now.getFullYear();

  const [activeFilter, setActiveFilter] = useState<RentFilter>("all");
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [updatingRentId, setUpdatingRentId] = useState<string | null>(null);
  const [sendingAlertRentId, setSendingAlertRentId] = useState<string | null>(
    null,
  );

  const { data: hostelsData } = useGetHostelsQuery(undefined);
  const { checkFeature } = useSubscription();
  const [updateRentStatus] = useUpdateRentStatusMutation();
  const [sendRentAlert] = useSendRentAlertMutation();

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

    const exists = hostelOptions.some(
      (hostel: { id: string; name: string }) => hostel.id === selectedHostelId,
    );
    if (!selectedHostelId || !exists) {
      setSelectedHostelId(hostelOptions[0].id);
    }
  }, [hostelOptions, selectedHostelId]);

  const {
    data: rentData,
    isLoading,
    isFetching,
    refetch,
  } = useGetRentQuery(
    {
      hostelId: selectedHostelId,
      month,
      year,
      status: activeFilter,
    },
    { skip: !selectedHostelId },
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedHostelId) {
        refetch();
      }
    }, [selectedHostelId, refetch]),
  );

  const summary = rentData?.summary;
  const records = rentData?.records ?? [];
  const monthLabel = rentData
    ? formatMonthYear(rentData.month, rentData.year)
    : formatMonthYear(month, year);

  const emptyMessage =
    activeFilter === "all"
      ? "No rent records for this month."
      : `No ${activeFilter} rent records found.`;

  const isEmpty = !isLoading && records.length === 0;

  const handleReview = (rentId: string, approve: boolean) => {
    if (!approve) {
      const proofCheck = checkFeature(PLAN_FEATURES.payment_proof);
      if (!proofCheck.allowed) {
        showSubscriptionBlocked(proofCheck.message);
        return;
      }
    }

    if (!selectedHostelId || updatingRentId) return;

    const submit = async (rejectionReason?: string) => {
      setUpdatingRentId(rentId);
      try {
        await updateRentStatus({
          rentId,
          hostelId: selectedHostelId,
          status: approve ? "paid" : "rejected",
          rejectionReason,
        }).unwrap();
        refetch();
      } catch {
        Alert.alert("Update failed", "Could not update rent status.");
      } finally {
        setUpdatingRentId(null);
      }
    };

    if (approve) {
      Alert.alert("Approve payment", "Mark this rent payment as paid?", [
        { text: "Cancel", style: "cancel" },
        { text: "Approve", onPress: () => submit() },
      ]);
      return;
    }

    Alert.alert(
      "Reject payment",
      "Reject this payment proof? The resident will need to submit again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => submit("Payment proof rejected"),
        },
      ],
    );
  };

  const handleMarkPaid = (rentId: string, residentName: string) => {
    if (!selectedHostelId || updatingRentId) return;

    Alert.alert(
      "Mark as paid",
      `Mark ${residentName}'s rent as paid manually?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Paid",
          onPress: async () => {
            setUpdatingRentId(rentId);
            try {
              await updateRentStatus({
                rentId,
                hostelId: selectedHostelId,
                status: "paid",
              }).unwrap();
              refetch();
            } catch {
              Alert.alert("Update failed", "Could not mark rent as paid.");
            } finally {
              setUpdatingRentId(null);
            }
          },
        },
      ],
    );
  };

  const handleSendAlert = (rentId: string, residentName: string) => {
    if (sendingAlertRentId) return;

    const notificationCheck = checkFeature(PLAN_FEATURES.notifications);
    if (!notificationCheck.allowed) {
      showSubscriptionBlocked(notificationCheck.message);
      return;
    }

    Alert.alert(
      "Send rent alert",
      `Send a rent payment reminder to ${residentName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Alert",
          onPress: async () => {
            setSendingAlertRentId(rentId);
            try {
              await sendRentAlert({ rentId }).unwrap();
              Alert.alert(
                "Alert sent",
                `${residentName} will receive a rent reminder notification.`,
              );
            } catch {
              Alert.alert("Alert failed", "Could not send rent alert.");
            } finally {
              setSendingAlertRentId(null);
            }
          },
        },
      ],
    );
  };

  if (hostelOptions.length === 0) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScreenHeader title="Rent Management" subtitle={monthLabel} />
          <EmptyState
            title="No hostels yet"
            description="Add a hostel first to manage rent records."
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
        <ScreenHeader title="Rent Management" subtitle={monthLabel} />

        <View style={styles.periodRow}>
          <Pressable
            style={styles.periodBtn}
            onPress={() => shiftPeriod(-1)}
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={vs(20)} color={colors.primary} />
          </Pressable>
          <Text style={styles.periodLabel}>{monthLabel}</Text>
          <Pressable
            style={[styles.periodBtn, isCurrentPeriod && styles.periodBtnDisabled]}
            onPress={() => !isCurrentPeriod && shiftPeriod(1)}
            disabled={isCurrentPeriod}
            accessibilityLabel="Next month"
          >
            <Ionicons
              name="chevron-forward"
              size={vs(20)}
              color={isCurrentPeriod ? colors.gray200 : colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.staticHeader}>
          <HostelDropdown
            hostels={hostelOptions}
            value={selectedHostelId}
            onChange={setSelectedHostelId}
            showAllOption={false}
          />

          <View style={styles.summaryRow}>
            <SummaryCard
              label="EXPECTED"
              value={formatAmount(summary?.expected ?? 0)}
              variant="expected"
              styles={styles}
            />
            <SummaryCard
              label="COLLECTED"
              value={formatAmount(summary?.collected ?? 0)}
              variant="collected"
              styles={styles}
            />
            <SummaryCard
              label="PENDING"
              value={formatAmount(summary?.pending ?? 0)}
              variant="pending"
              styles={styles}
            />
          </View>

          <AnimatedFilterBar
            filters={FILTERS}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            style={styles.filterBarSpacing}
          />
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
          <Animated.View
            key={`${activeFilter}-${selectedHostelId}`}
            entering={FadeIn.duration(280).springify().damping(20)}
            exiting={FadeOut.duration(180)}
          >
            {isEmpty ? (
              <EmptyState
                title="No records"
                description={emptyMessage}
                size="sm"
              />
            ) : (
              records.map((record: RentRecord) => (
                <RentRecordCard
                  key={record.id}
                  record={record}
                  styles={styles}
                  onReview={handleReview}
                  onSendAlert={handleSendAlert}
                  onMarkPaid={handleMarkPaid}
                  isUpdating={updatingRentId === record.id}
                  isSendingAlert={sendingAlertRentId === record.id}
                />
              ))
            )}
          </Animated.View>
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
    staticHeader: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(4),
    },
    periodRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: vs(20),
      marginBottom: vs(12),
    },
    periodBtn: {
      width: vs(40),
      height: vs(40),
      borderRadius: vs(12),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary100,
    },
    periodBtnDisabled: {
      opacity: 0.5,
    },
    periodLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(110),
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
      paddingBottom: vs(110),
    },
    header: {
      marginBottom: vs(12),
    },
    summaryRow: {
      flexDirection: "row",
      gap: vs(10),
      marginBottom: vs(20),
    },
    summaryCard: {
      flex: 1,
      gap: vs(4),
      borderRadius: vs(14),
      paddingVertical: vs(8),
      paddingHorizontal: vs(6),
      borderWidth: 1,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    summaryExpected: {
      backgroundColor: isDark ? colors.white200 : colors.white,
      borderColor: isDark ? colors.white300 : colors.white100,
    },
    summaryCollected: {
      backgroundColor: colors.successBg,
      borderColor: isDark ? colors.secondary : colors.success,
    },
    summaryPending: {
      backgroundColor: colors.warningBg,
      borderColor: colors.warning,
    },
    summaryLabel: {
      fontSize: FONT_SIZES.xxs,
      fontFamily: fonts.semiBold,
      letterSpacing: 0.8,
      marginBottom: vs(6),
    },
    summaryLabelExpected: {
      color: colors.gray200,
    },
    summaryLabelCollected: {
      color: colors.success,
    },
    summaryLabelPending: {
      color: colors.warning,
    },
    summaryValue: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
    },
    summaryValueExpected: {
      color: colors.text,
    },
    summaryValueCollected: {
      color: colors.success,
    },
    summaryValuePending: {
      color: colors.warning,
    },
    filterBarSpacing: {
      marginBottom: vs(12),
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
      backgroundColor: colors.warningBg,
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
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(18),
      padding: vs(16),
      marginBottom: vs(12),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
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
    recordName: {
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
    recordSubtext: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.primary,
      marginTop: vs(8),
    },
    overdueText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.error,
      marginTop: vs(8),
    },
    rejectionText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.error,
      marginTop: vs(6),
    },
    breakdownWrap: {
      marginTop: vs(10),
    },
    editBillBtn: {
      alignSelf: "flex-start",
      marginTop: vs(10),
    },
    statusBadge: {
      paddingHorizontal: vs(10),
      paddingVertical: vs(4),
      borderRadius: vs(20),
    },
    statusPaid: {
      backgroundColor: colors.successBg,
    },
    statusReview: {
      backgroundColor: colors.infoBg,
    },
    statusPending: {
      backgroundColor: colors.warningBg,
    },
    statusText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
    },
    statusTextPaid: {
      color: colors.success,
    },
    statusTextReview: {
      color: colors.primary,
    },
    statusTextPending: {
      color: colors.warning,
    },
    reviewActions: {
      flexDirection: "row",
      gap: vs(10),
      marginTop: vs(12),
    },
    reviewActionBtn: {
      flex: 1,
    },
    pendingActions: {
      flexDirection: "row",
      gap: vs(10),
      marginTop: vs(12),
    },
    pendingActionBtn: {
      flex: 1,
    },
  });
}
