import SubscriptionPlanCard from "@/components/SubscriptionPlanCard";
import { getHostelDetails } from "@/services/hostel";
import { getRooms } from "@/services/rooms";
import {
  getSubscriptionPlan,
  setSubscriptionPlan,
} from "@/services/subscription";
import { USER_ROLES, type UserRole } from "@/types/role";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/types/subscription";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, updateAuthUser } from "../../../store/reducers/authSlice";
import type { AppDispatch, RootState } from "../../../store/store";

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
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
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

function getInitials(name: string, phone: string) {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  return phone.slice(-2);
}

export default function Profile() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);

  const [roomCount, setRoomCount] = useState(0);
  const [bedCount, setBedCount] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [hostelName, setHostelName] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name ?? "");
  const [activePlanId, setActivePlanId] =
    useState<SubscriptionPlanId>("free");

  const displayName = user?.name?.trim() || "Guest User";
  const phone = user?.phone ?? "—";
  const role: UserRole = user?.role ?? "tenant";
  const roleLabel = USER_ROLES[role].label;
  const isBusinessOwner = role === "business_owner";

  useFocusEffect(
    useCallback(() => {
      setNameDraft(user?.name ?? "");
      getHostelDetails().then((details) => {
        setHostelName(details?.name?.trim() || null);
      });
      getRooms().then((rooms) => {
        setRoomCount(rooms.length);
        const beds = rooms.reduce((sum, r) => sum + r.totalBeds, 0);
        const rent = rooms.reduce(
          (sum, r) => sum + r.totalBeds * r.monthlyRentPerBed,
          0,
        );
        setBedCount(beds);
        setMonthlyRent(rent);
      });
      if (isBusinessOwner) {
        getSubscriptionPlan().then(setActivePlanId);
      }
    }, [user?.name, isBusinessOwner]),
  );

  const activePlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === activePlanId) ??
    SUBSCRIPTION_PLANS[0];

  const handleSelectPlan = (planId: SubscriptionPlanId) => {
    if (planId === activePlanId) return;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) return;

    if (plan.price > 0) {
      Alert.alert(
        `Upgrade to ${plan.name}`,
        `Payment integration is coming soon. You can preview the ${plan.name} plan for now.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: async () => {
              await setSubscriptionPlan(planId);
              setActivePlanId(planId);
            },
          },
        ],
      );
      return;
    }

    Alert.alert(
      "Switch to Free",
      "You will lose access to paid plan features.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: async () => {
            await setSubscriptionPlan(planId);
            setActivePlanId(planId);
          },
        },
      ],
    );
  };

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    dispatch(updateAuthUser({ name: trimmed || undefined }));
    setIsEditingName(false);
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out of VAAS?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await dispatch(logoutUser());
          if (router.canDismiss()) router.dismissAll();
          router.replace("/welcome");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.staticHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(displayName, phone)}
            </Text>
          </View>

          {isEditingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Your name"
                placeholderTextColor={colors.gray100}
                autoFocus
                maxLength={40}
              />
              <Pressable style={styles.nameSaveBtn} onPress={handleSaveName}>
                <Ionicons name="checkmark" size={vs(18)} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.nameRow}
              onPress={() => setIsEditingName(true)}
            >
              <Text style={styles.heroName}>{displayName}</Text>
              <Ionicons
                name="create-outline"
                size={vs(16)}
                color={colors.primary}
              />
            </Pressable>
          )}

          <Text style={styles.heroPhone}>{phone}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Ionicons
                name={isBusinessOwner ? "business-outline" : "person-outline"}
                size={vs(13)}
                color={colors.primary}
              />
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>

            {isBusinessOwner ? (
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
            ) : null}
          </View>
        </View>

        {isBusinessOwner ? (
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
                {monthlyRent > 0
                  ? `${Math.round(monthlyRent / 1000)}k`
                  : "0"}
              </Text>
              <Text style={styles.statLabel}>Rent/mo</Text>
            </View>
          </View>
        ) : null}

        {isBusinessOwner ? (
          <>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.subscriptionHeader}>
              <View style={styles.currentPlanBadge}>
                <Ionicons
                  name="diamond-outline"
                  size={vs(14)}
                  color={colors.primary}
                />
                <Text style={styles.currentPlanText}>
                  {activePlan.name} Plan
                </Text>
              </View>
              <Text style={styles.currentPlanPrice}>
                {activePlan.price === 0
                  ? "Free forever"
                  : `${activePlan.priceLabel}/month`}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plansScroll}
              decelerationRate="fast"
              snapToInterval={vs(212)}
            >
              {SUBSCRIPTION_PLANS.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  isActive={activePlanId === plan.id}
                  onSelect={() => handleSelectPlan(plan.id)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionCard}>
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
        </View>

        <Text style={styles.sectionTitle}>
          {isBusinessOwner ? "Hostel" : "My Stay"}
        </Text>
        <View style={styles.sectionCard}>
          {isBusinessOwner ? (
            <MenuRow
              icon="business-outline"
              label="Hostel Details"
              value={hostelName ?? "Set up your hostel"}
              onPress={() => router.push("/hostel/details")}
              styles={styles}
              colors={colors}
            />
          ) : (
            <>
              <MenuRow
                icon="bed-outline"
                label="My Room"
                value="Not assigned"
                styles={styles}
                colors={colors}
              />
              <View style={styles.divider} />
              <MenuRow
                icon="receipt-outline"
                label="Payment History"
                value="No payments yet"
                styles={styles}
                colors={colors}
              />
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionCard}>
          <MenuRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => Alert.alert("Help", "Contact support@vaas.app")}
            styles={styles}
            colors={colors}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() =>
              Alert.alert("Privacy", "Privacy policy will be available soon.")
            }
            styles={styles}
            colors={colors}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="information-circle-outline"
            label="Terms of Service"
            onPress={() =>
              Alert.alert("Terms", "Terms of service will be available soon.")
            }
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
          <Ionicons name="log-out-outline" size={vs(20)} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
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
      paddingTop: vs(16),
      paddingBottom: vs(8),
    },
    pageTitle: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
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
    },
    avatar: {
      width: vs(80),
      height: vs(80),
      borderRadius: vs(40),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(14),
    },
    avatarText: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: "#FFFFFF",
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      marginBottom: vs(4),
    },
    heroName: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    nameEditRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      marginBottom: vs(4),
      width: "100%",
    },
    nameInput: {
      flex: 1,
      height: vs(44),
      borderRadius: vs(12),
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(14),
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    nameSaveBtn: {
      width: vs(44),
      height: vs(44),
      borderRadius: vs(12),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
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
      gap: vs(8),
    },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      backgroundColor: colors.white,
      paddingHorizontal: vs(12),
      paddingVertical: vs(6),
      borderRadius: vs(20),
    },
    roleBadgeText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
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
    subscriptionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: vs(12),
      paddingHorizontal: vs(4),
    },
    currentPlanBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      backgroundColor: colors.primary100,
      paddingHorizontal: vs(12),
      paddingVertical: vs(6),
      borderRadius: vs(20),
    },
    currentPlanText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    currentPlanPrice: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    plansScroll: {
      paddingBottom: vs(24),
      paddingRight: vs(8),
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
