import {
  api,
  useGetDashboardQuery,
  useGetHostelsQuery,
  useGetMeQuery,
  useLogoutMutation,
} from "../../../store/api";
import { aggregateDashboard } from "@/types/dashboard";
import { formatDateOfBirth, meToAuthProfile } from "@/types/auth";
import { formatCnic } from "@/utils/cnic";
import ProfileAvatar from "@/components/ProfileAvatar";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import { USER_ROLES, type UserRole } from "@/types/role";
import {
  getPlanDisplayName,
  type SubscriptionPlanId,
} from "@/types/subscription";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_FEATURES } from "@/constants/plans";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import Fontisto from "@expo/vector-icons/Fontisto";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "../../../store/reducers/authSlice";
import type { AppDispatch, RootState } from "../../../store/store";
import { persistor } from "../../../store/store";

type ProfileStyles = ReturnType<typeof createStyles>;

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  styles: ProfileStyles;
  colors: AppColors;
};

function MenuRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  styles,
  colors,
}: MenuRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        pressed && styles.menuRowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.menuIconWrap,
          destructive && styles.menuIconWrapDestructive,
        ]}
      >
        <Ionicons
          name={icon}
          size={vs(18)}
          color={destructive ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text
          style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}
        >
          {label}
        </Text>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={vs(18)} color={colors.gray300} />
      ) : null}
    </Pressable>
  );
}

export default function Profile() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const { guardFeature } = useSubscription();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [logoutApi] = useLogoutMutation();

  useEffect(() => {
    if (meData?.user) {
      dispatch(updateUser(meToAuthProfile(meData.user)));
    }
  }, [meData, dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refetchMe();
      }
    }, [isAuthenticated, refetchMe]),
  );

  const displayName =
    meData?.user.name?.trim() || user?.name?.trim() || "Guest User";
  const phone = meData?.user.phone ?? user?.phone ?? "—";
  const email =
    meData?.user.email?.trim() || user?.email?.trim() || "Not added";
  const address =
    meData?.user.address?.trim() || user?.address?.trim() || "Not added";
  const dateOfBirth =
    formatDateOfBirth(meData?.user.dateOfBirth ?? user?.dateOfBirth) ||
    "Not added";
  const cnicRaw = meData?.user.cnic?.trim() || user?.cnic?.trim() || "";
  const cnic = cnicRaw ? formatCnic(cnicRaw) : "Not added";
  const userId =
    meData?.user.userId?.trim() || user?.userId?.trim() || "Not assigned";
  const profileImage = meData?.user.profileImage ?? user?.profileImage ?? null;
  const role: UserRole = user?.role ?? "resident";
  const roleLabel = USER_ROLES[role].label;
  const isManager = role === "manager";
  const activePlanId: SubscriptionPlanId = user?.subscriptionPlan ?? "free";

  const { data: hostelsData } = useGetHostelsQuery(undefined, {
    skip: !isManager,
  });
  const { data: dashboardData } = useGetDashboardQuery(undefined, {
    skip: !isManager,
  });
  const hostelCount =
    user?.hostels?.length ?? hostelsData?.hostels?.length ?? 0;
  const dashboardSummary = useMemo(
    () => aggregateDashboard(dashboardData?.hostels ?? []),
    [dashboardData?.hostels],
  );
  const roomCount = dashboardSummary.totalRooms;
  const bedCount = dashboardSummary.totalBedrooms;
  const monthlyRent = dashboardSummary.expected;

  const residentHostelLabel = user?.hostel?.name ?? "Not assigned";
  const residentRoomLabel = user?.room
    ? `Room ${user.room.roomNumber} · Rs ${user.room.rent.toLocaleString()}/mo`
    : "Not assigned";

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out of OSSTEL?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutApi(undefined).unwrap();
          } catch {
            // Clear local session even if server logout fails
          }

          dispatch(logout());
          dispatch(api.util.resetApiState());
          await persistor.purge();
          if (router.canDismiss()) router.dismissAll();
          router.replace("/auth/signin");
        },
      },
    ]);
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Profile" />

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <View style={styles.roleIconBadge}>
              {isManager ? (
                <Fontisto name="person" size={vs(18)} color={colors.primary} />
              ) : (
                <Ionicons name="person" size={24} color={colors.primary} />
              )}
            </View>

            <ProfileAvatar
              name={displayName}
              phone={phone}
              imageUri={profileImage}
              size={vs(80)}
            />

            <View style={styles.nameRow}>
              <Text style={styles.heroName}>{displayName}</Text>
              <Pressable
                style={styles.editProfileBtn}
                onPress={() => router.push("/profile/edit")}
              >
                <Ionicons
                  name="create-outline"
                  size={vs(16)}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            <Text style={styles.heroPhone}>{phone}</Text>

            {isManager ? (
              <View style={styles.badgeRow}>
                <View style={styles.planBadge}>
                  <Ionicons
                    name="diamond-outline"
                    size={vs(13)}
                    color={colors.success}
                  />
                  <Text style={styles.planBadgeText}>
                    {getPlanDisplayName(activePlanId)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    user?.isVerified
                      ? styles.statusVerified
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      user?.isVerified
                        ? styles.statusTextVerified
                        : styles.statusTextPending,
                    ]}
                  >
                    {user?.isVerified ? "Verified" : "Pending"}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {isManager ? (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{roomCount}</Text>
                <Text style={styles.statLabel}>Rooms</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{bedCount}</Text>
                <Text style={styles.statLabel}>Beds</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {monthlyRent > 0 ? `${Math.round(monthlyRent / 1000)}k` : "0"}
                </Text>
                <Text style={styles.statLabel}>Rent/mo</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <MenuRow
              icon="person-outline"
              label="Edit Profile"
              value="Name, photo, email, address"
              onPress={() => router.push("/profile/edit")}
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            {!isManager ? (
              <>
                <MenuRow
                  icon="id-card-outline"
                  label="User ID"
                  value={userId}
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.divider} />
              </>
            ) : null}
            <MenuRow
              icon="call-outline"
              label="Phone Number"
              value={phone}
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="shield-checkmark-outline"
              label="Account Role"
              value={roleLabel}
              styles={styles}
              colors={colors}
            />
            {isManager ? (
              <>
                <View style={styles.divider} />
                <MenuRow
                  icon="diamond-outline"
                  label="Subscription"
                  value={`${getPlanDisplayName(activePlanId)} plan`}
                  onPress={() => router.push("/subscription")}
                  styles={styles}
                  colors={colors}
                />
              </>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>
            {isManager ? "Hostel" : "My Stay"}
          </Text>
          <View style={styles.sectionCard}>
            {isManager ? (
              <>
                <MenuRow
                  icon="business-outline"
                  label="My Hostels"
                  value={
                    hostelCount > 0
                      ? `${hostelCount} hostel${hostelCount === 1 ? "" : "s"}`
                      : "Add your first hostel"
                  }
                  onPress={() => router.push("/(tabs)/hostels")}
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.divider} />
                <MenuRow
                  icon="people-outline"
                  label="All Residents"
                  value="View resident list"
                  onPress={() => router.push("/residents")}
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.divider} />
                <MenuRow
                  icon="document-attach-outline"
                  label="Reports"
                  value="Rent, residents & profile PDFs"
                  onPress={() =>
                    guardFeature(PLAN_FEATURES.reports, () =>
                      router.push("/reports"),
                    )
                  }
                  styles={styles}
                  colors={colors}
                />
              </>
            ) : (
              <>
                <MenuRow
                  icon="business-outline"
                  label="My Hostel"
                  value={residentHostelLabel}
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.divider} />
                <MenuRow
                  icon="bed-outline"
                  label="My Room"
                  value={residentRoomLabel}
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.divider} />
                <MenuRow
                  icon="receipt-outline"
                  label="Payment History"
                  value="View rent & download report"
                  onPress={() => router.push("/(tabs)/rent")}
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.divider} />
                <MenuRow
                  icon="chatbox-ellipses-outline"
                  label="My Complaints"
                  value="Report hostel issues"
                  onPress={() => router.push("/complaints")}
                  styles={styles}
                  colors={colors}
                />
              </>
            )}
          </View>

          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionCard}>
            <MenuRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {
                if (isManager) {
                  guardFeature(PLAN_FEATURES.notifications, () =>
                    router.push("/notifications"),
                  );
                  return;
                }
                router.push("/notifications");
              }}
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => router.push("/support")}
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() => router.push("/privacy")}
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="information-circle-outline"
              label="Terms of Service"
              onPress={() => router.push("/terms")}
              styles={styles}
              colors={colors}
            />
          </View>

          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.sectionCard}>
            <MenuRow
              icon="phone-portrait-outline"
              label="App Version"
              value="1.0.0"
              styles={styles}
              colors={colors}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutPressed,
            ]}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={vs(20)}
              color={colors.error}
            />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </ScrollView>
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(110),
    },
    heroCard: {
      backgroundColor: isDark ? colors.white100 : colors.primary100,
      borderRadius: vs(20),
      padding: vs(24),
      alignItems: "center",
      marginBottom: vs(20),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.primary200,
      position: "relative",
    },
    roleIconBadge: {
      position: "absolute",
      top: vs(14),
      left: vs(14),
      width: vs(36),
      height: vs(36),
      borderRadius: vs(18),
      backgroundColor: isDark ? colors.white200 : colors.white,
      borderWidth: 1,
      borderColor: isDark ? colors.white300 : colors.primary200,
      alignItems: "center",
      justifyContent: "center",
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      marginBottom: vs(4),
    },
    editProfileBtn: {
      width: vs(32),
      height: vs(32),
      borderRadius: vs(16),
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    heroName: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    heroPhone: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(14),
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: vs(8),
    },
    statusBadge: {
      paddingHorizontal: vs(10),
      paddingVertical: vs(6),
      borderRadius: vs(20),
    },
    statusVerified: {
      backgroundColor: isDark ? colors.secondary100 : "#F0FDF4",
    },
    statusPending: {
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.15)" : "#FFFBEB",
    },
    statusText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
    },
    statusTextVerified: {
      color: colors.success,
    },
    statusTextPending: {
      color: colors.warning,
    },
    statsRow: {
      flexDirection: "row",
      gap: vs(10),
      marginBottom: vs(24),
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: vs(14),
      paddingVertical: vs(14),
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.white100,
    },
    statValue: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(4),
    },
    statLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    planBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      backgroundColor: isDark ? colors.secondary100 : "#F0FDF4",
      paddingHorizontal: vs(10),
      paddingVertical: vs(6),
      borderRadius: vs(20),
    },
    planBadgeText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.success,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: vs(10),
      marginLeft: vs(4),
    },
    sectionCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      marginBottom: vs(24),
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: vs(14),
      paddingVertical: vs(14),
      gap: vs(12),
    },
    menuRowPressed: {
      backgroundColor: colors.white100,
    },
    menuIconWrap: {
      width: vs(36),
      height: vs(36),
      borderRadius: vs(10),
      backgroundColor: colors.primary100,
      alignItems: "center",
      justifyContent: "center",
    },
    menuIconWrapDestructive: {
      backgroundColor: isDark ? "rgba(230, 80, 71, 0.15)" : "#FEE2E2",
    },
    menuContent: {
      flex: 1,
    },
    menuLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    menuLabelDestructive: {
      color: colors.error,
    },
    menuValue: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginTop: vs(2),
    },
    divider: {
      height: 1,
      backgroundColor: colors.white100,
      marginLeft: vs(62),
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: vs(8),
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: isDark ? "rgba(230, 80, 71, 0.3)" : "#FECACA",
      paddingVertical: vs(16),
      marginTop: vs(4),
    },
    logoutPressed: {
      opacity: 0.85,
    },
    logoutText: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.error,
    },
  });
}
