import CustomButton from "@/components/CustomButton";
import ProfileAvatar from "@/components/ProfileAvatar";
import QuickActionCard from "@/components/QuickActionCard";
import SectionCard from "@/components/SectionCard";
import ResidentRentBanner from "@/components/resident/ResidentRentBanner";
import type { QuickAction } from "@/types/dashboard";
import { isRentDueWindow } from "@/utils/rent";
import { PLAN_FEATURES } from "@/constants/plans";
import { useSubscription } from "@/hooks/useSubscription";
import { useUnreadNotificationCount } from "@/hooks/usePushNotifications";
import { useHostelConnection } from "@/hooks/useHostelConnection";
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

export default function ResidentHomeDashboard() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const { checkFeature, guardFeature } = useSubscription();
  const paymentProofAllowed = checkFeature(PLAN_FEATURES.payment_proof).allowed;
  const notificationsAllowed = checkFeature(PLAN_FEATURES.notifications).allowed;
  const { data: unreadData } = useUnreadNotificationCount(
    !user?.accessToken || !notificationsAllowed,
  );
  const unreadCount = unreadData?.unreadCount ?? 0;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { isConnected, isPending, pendingJoinRequest } = useHostelConnection();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const {
    data: rentData,
    isLoading: rentLoading,
    isFetching: rentFetching,
    refetch: refetchRent,
  } = useGetMyRentQuery(
    { month, year },
    { skip: !isConnected },
  );

  useFocusEffect(
    useCallback(() => {
      refetchMe();
      if (isConnected) {
        refetchRent();
      }
    }, [isConnected, refetchMe, refetchRent]),
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

  const quickActions: QuickAction[] = useMemo(() => {
    const actions: QuickAction[] = [];

    if (paymentProofAllowed) {
      actions.push({
        id: "pay-rent",
        label: "Pay Rent",
        iconName: "cash-outline",
        iconColor: colors.successText,
        iconBackgroundColor: colors.successBg,
      });
    }

    if (checkFeature(PLAN_FEATURES.complaints).allowed) {
      actions.push({
        id: "complaints",
        label: "Complaints",
        iconName: "chatbox-ellipses-outline",
        iconColor: colors.warningText,
        iconBackgroundColor: colors.warningBg,
      });
    }

    if (checkFeature(PLAN_FEATURES.support).allowed) {
      actions.push({
        id: "support",
        label: "Support",
        iconName: "help-circle-outline",
        iconColor: colors.purpleText,
        iconBackgroundColor: colors.purpleBg,
      });
    }

    return actions;
  }, [
    checkFeature,
    colors.purpleBg,
    colors.purpleText,
    colors.successBg,
    colors.successText,
    colors.warningBg,
    colors.warningText,
    paymentProofAllowed,
  ]);

  const handleQuickAction = (actionId: string) => {
    if (actionId === "pay-rent") {
      guardFeature(PLAN_FEATURES.payment_proof, () => router.push("/(tabs)/rent"));
      return;
    }
    if (actionId === "complaints") {
      guardFeature(PLAN_FEATURES.complaints, () => router.push("/complaints"));
      return;
    }
    if (actionId === "support") {
      guardFeature(PLAN_FEATURES.support, () => router.push("/support"));
    }
  };

  const handleRefresh = () => {
    refetchMe();
    if (isConnected) {
      refetchRent();
    }
  };

  if (!isConnected) {
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
            <Text style={styles.greeting}>Welcome,</Text>
            <Text style={styles.userName}>{profile?.name?.trim() || "Resident"}</Text>
          </View>
        </View>

        <SectionCard title="Get Started" contentStyle={styles.cardContent}>
          {isPending && pendingJoinRequest ? (
            <>
              <Text style={styles.hostelMeta}>
                Your request to join {pendingJoinRequest.hostel.name} is pending
                manager approval.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.hostelMeta}>
                You are not connected to a hostel yet. Ask your manager for the
                hostel code, then submit a join request.
              </Text>
              <CustomButton
                title="Join Existing Hostel"
                onPress={() => router.push("/join-hostel")}
                style={styles.joinBtn}
              />
            </>
          )}
        </SectionCard>
      </ScrollView>
    );
  }

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

      <SectionCard title="My Hostel" contentStyle={styles.cardContent}>
        {hostel ? (
          <>
            <Text style={styles.hostelName}>{hostel.name}</Text>
            <Text style={styles.hostelMeta}>{hostel.address}</Text>
            <Text style={styles.hostelMeta}>
              {hostel.city} · {hostel.contactPhone}
            </Text>
            {room ? (
              <View style={styles.stayRow}>
                <View style={styles.stayStat}>
                  <Text style={styles.stayStatLabel}>Room</Text>
                  <Text style={styles.stayStatValue}>Room {room.roomNumber}</Text>
                </View>
                <View style={styles.stayStat}>
                  <Text style={styles.stayStatLabel}>Monthly Rent</Text>
                  <Text style={styles.stayStatValue}>
                    Rs {room.rent.toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.hostelMeta}>No hostel assigned yet.</Text>
        )}
      </SectionCard>

      {rentLoading ? (
        <CustomLoading size="md" style={styles.rentLoader} />
      ) : (
        <>
          <ResidentRentBanner
            label={`${MONTH_NAMES[month - 1]?.toUpperCase() ?? "MONTHLY"} ${year} RENT`}
            amount={rentRecord?.amount ?? room?.rent ?? 0}
            status={rentStatus}
          />
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
          {(rentStatus === "pending" ||
            rentStatus === "rejected" ||
            rentRecord?.rejectionReason) &&
          room &&
          paymentProofAllowed ? (
            <CustomButton
              title={
                rentStatus === "rejected" || rentRecord?.rejectionReason
                  ? "Edit Payment Proof"
                  : "Submit Payment"
              }
              onPress={() => router.push("/(tabs)/rent")}
              style={styles.rentActionBtn}
            />
          ) : null}
        </>
      )}

      {quickActions.length > 0 ? (
        <SectionCard title="Quick Actions" contentStyle={styles.actionsContent}>
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
        </SectionCard>
      ) : null}
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
      marginBottom: vs(24),
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
    dueBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(10),
      backgroundColor: colors.warningBg,
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
    cardContent: {
      paddingHorizontal: vs(14),
      paddingBottom: vs(14),
    },
    stayRow: {
      flexDirection: "row",
      gap: vs(10),
      marginTop: vs(16),
    },
    stayStat: {
      flex: 1,
      backgroundColor: colors.white100,
      borderRadius: vs(14),
      paddingVertical: vs(12),
      paddingHorizontal: vs(10),
      alignItems: "center",
    },
    stayStatLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(4),
    },
    stayStatValue: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
    },
    rentLoader: {
      marginVertical: vs(24),
    },
    rentActionBtn: {
      marginBottom: vs(24),
    },
    rejectionText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.error,
      marginTop: vs(-8),
      marginBottom: vs(12),
      paddingHorizontal: vs(4),
    },
    reviewText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.primary,
      marginTop: vs(-8),
      marginBottom: vs(12),
      paddingHorizontal: vs(4),
    },
    actionsContent: {
      paddingHorizontal: vs(10),
      paddingBottom: vs(14),
    },
    actionsRow: {
      flexDirection: "row",
      marginHorizontal: -4,
    },
    actionItem: {
      flex: 1,
      paddingHorizontal: 4,
    },
    joinBtn: {
      marginTop: vs(16),
    },
  });
}
