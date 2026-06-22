import ProfileAvatar from "@/components/ProfileAvatar";
import QuickActionCard from "@/components/QuickActionCard";
import type { QuickAction } from "@/types/dashboard";
import type { RentStatus } from "@/types/rent";
import { isRentDueWindow } from "@/utils/rent";
import { useUnreadNotificationCount } from "@/hooks/usePushNotifications";
import { useGetMeQuery, useGetMyRentQuery } from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

function statusLabel(status: RentStatus | undefined) {
  if (status === "paid") return "Paid";
  if (status === "review") return "Under Review";
  if (status === "rejected") return "Rejected";
  if (status === "pending") return "Pending";
  return "Not available";
}

function statusColor(status: RentStatus | undefined, colors: AppColors) {
  if (status === "paid") return colors.success;
  if (status === "review") return colors.primary;
  if (status === "rejected") return colors.error;
  if (status === "pending") return colors.warning;
  return colors.gray200;
}

export default function ResidentHomeDashboard() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: unreadData } = useUnreadNotificationCount(!user?.accessToken);
  const unreadCount = unreadData?.unreadCount ?? 0;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: meData, refetch: refetchMe } = useGetMeQuery();
  const {
    data: rentData,
    isLoading: rentLoading,
    isFetching: rentFetching,
    refetch: refetchRent,
  } = useGetMyRentQuery({ month, year });

  useFocusEffect(
    useCallback(() => {
      refetchMe();
      refetchRent();
    }, [refetchMe, refetchRent]),
  );

  const profile = meData?.user ?? user;
  const hostel = profile?.hostel ?? user?.hostel;
  const room = profile?.room ?? user?.room;
  const rentRecord = rentData?.record;
  const rentStatus = rentRecord?.status;
  const showDueBanner =
    isRentDueWindow() &&
    (rentStatus === "pending" || rentStatus === undefined) &&
    Boolean(room);

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: "pay-rent",
        label: "Pay Rent",
        iconName: "cash-outline",
        iconColor: "#15803D",
        iconBackgroundColor: "#DCFCE7",
      },
      {
        id: "complaints",
        label: "Complaints",
        iconName: "chatbox-ellipses-outline",
        iconColor: "#B45309",
        iconBackgroundColor: "#FEF3C7",
      },
      {
        id: "support",
        label: "Support",
        iconName: "help-circle-outline",
        iconColor: "#6D28D9",
        iconBackgroundColor: "#EDE9FE",
      },
    ],
    [],
  );

  const handleQuickAction = (actionId: string) => {
    if (actionId === "pay-rent") {
      router.push("/(tabs)/rent");
      return;
    }
    if (actionId === "complaints") {
      router.push("/complaints");
      return;
    }
    if (actionId === "support") {
      router.push("/support");
    }
  };

  const handleRefresh = () => {
    refetchMe();
    refetchRent();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={rentFetching && !rentLoading}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <ProfileAvatar
          name={profile?.name ?? "Resident"}
          phone={profile?.phone ?? ""}
          imageUri={profile?.profileImage}
          size={vs(56)}
        />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{profile?.name?.trim() || "Resident"}</Text>
        </View>
        <Pressable
          style={styles.notificationBtn}
          onPress={() => router.push("/notifications")}
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

      {showDueBanner ? (
        <Pressable style={styles.dueBanner} onPress={() => router.push("/(tabs)/rent")}>
          <Ionicons name="alert-circle" size={vs(22)} color={colors.warning} />
          <View style={styles.dueBannerText}>
            <Text style={styles.dueBannerTitle}>Rent due by the 5th</Text>
            <Text style={styles.dueBannerSub}>
              Submit your payment screenshot before{" "}
              {MONTH_NAMES[month - 1]} 5, {year}.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={vs(18)} color={colors.warning} />
        </Pressable>
      ) : null}

      <View style={styles.hostelCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="business-outline" size={vs(20)} color={colors.primary} />
          <Text style={styles.cardTitle}>My Hostel</Text>
        </View>
        {hostel ? (
          <>
            <Text style={styles.hostelName}>{hostel.name}</Text>
            <Text style={styles.hostelMeta}>{hostel.address}</Text>
            <Text style={styles.hostelMeta}>
              {hostel.city} · {hostel.contactPhone}
            </Text>
          </>
        ) : (
          <Text style={styles.hostelMeta}>No hostel assigned yet.</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={[styles.infoCard, styles.infoCardHalf]}>
          <Ionicons name="bed-outline" size={vs(20)} color={colors.primary} />
          <Text style={styles.infoLabel}>Room</Text>
          <Text style={styles.infoValue}>
            {room ? `Room ${room.roomNumber}` : "—"}
          </Text>
        </View>
        <View style={[styles.infoCard, styles.infoCardHalf]}>
          <Ionicons name="cash-outline" size={vs(20)} color={colors.success} />
          <Text style={styles.infoLabel}>Monthly Rent</Text>
          <Text style={styles.infoValue}>
            {room ? `Rs ${room.rent.toLocaleString()}` : "—"}
          </Text>
        </View>
      </View>

      <View style={styles.rentCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={vs(20)} color={colors.primary} />
          <Text style={styles.cardTitle}>
            {MONTH_NAMES[month - 1]} {year} Rent
          </Text>
        </View>
        {rentLoading ? (
          <CustomLoading size="md" style={styles.rentLoader} />
        ) : (
          <>
            <View style={styles.rentStatusRow}>
              <Text style={styles.rentAmount}>
                Rs {(rentRecord?.amount ?? room?.rent ?? 0).toLocaleString()}
              </Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: `${statusColor(rentStatus, colors)}22` },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: statusColor(rentStatus, colors) },
                  ]}
                >
                  {statusLabel(rentStatus)}
                </Text>
              </View>
            </View>
            {rentRecord?.rejectionReason ? (
              <Text style={styles.rejectionText}>
                Rejected: {rentRecord.rejectionReason}
              </Text>
            ) : null}
            {rentStatus === "review" ? (
              <Text style={styles.reviewText}>
                Payment sent to owner for approval.
              </Text>
            ) : null}
            {(rentStatus === "pending" || !rentRecord) && room ? (
              <Pressable
                style={styles.payButton}
                onPress={() => router.push("/(tabs)/rent")}
              >
                <Text style={styles.payButtonText}>Submit Payment</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

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
    </ScrollView>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 110,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(14),
      marginBottom: vs(20),
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
      color: "#FFFFFF",
    },
    greeting: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    userName: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    dueBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(10),
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.15)" : "#FFFBEB",
      borderWidth: 1,
      borderColor: colors.warning,
      borderRadius: vs(14),
      padding: vs(14),
      marginBottom: vs(16),
    },
    dueBannerText: {
      flex: 1,
    },
    dueBannerTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(2),
    },
    dueBannerSub: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(18),
    },
    hostelCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(16),
      marginBottom: vs(12),
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      marginBottom: vs(10),
    },
    cardTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    hostelName: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(6),
    },
    hostelMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
    },
    row: {
      flexDirection: "row",
      gap: vs(10),
      marginBottom: vs(12),
    },
    infoCard: {
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
    },
    infoCardHalf: {
      flex: 1,
    },
    infoLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginTop: vs(8),
      marginBottom: vs(4),
    },
    infoValue: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    rentCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(16),
      marginBottom: vs(20),
    },
    rentLoader: {
      marginVertical: vs(12),
    },
    rentStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: vs(10),
    },
    rentAmount: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    statusPill: {
      paddingHorizontal: vs(10),
      paddingVertical: vs(6),
      borderRadius: vs(20),
    },
    statusPillText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
    },
    rejectionText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.error,
      marginTop: vs(10),
    },
    reviewText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.primary,
      marginTop: vs(10),
    },
    payButton: {
      marginTop: vs(14),
      backgroundColor: colors.primary,
      borderRadius: vs(12),
      paddingVertical: vs(12),
      alignItems: "center",
    },
    payButtonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.white,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(14),
    },
    actionsRow: {
      flexDirection: "row",
      marginHorizontal: -6,
    },
    actionItem: {
      flex: 1,
      paddingHorizontal: 6,
    },
  });
}
