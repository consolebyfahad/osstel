import CustomButton from "@/components/CustomButton";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import PlanUpgradeCard from "@/components/PlanUpgradeCard";
import { meToAuthProfile } from "@/types/auth";
import {
  canRequestPlan,
  getPlanDisplayName,
  PLAN_ORDER,
  type ApiPlan,
  type SubscriptionPlanId,
} from "@/types/subscription";
import {
  getApiErrorMessage,
  isBlockedAccountMessage,
} from "@/utils/api";
import {
  api,
  useGetMeQuery,
  useGetPlanRequestQuery,
  useGetPlansQuery,
  useSubmitPlanRequestMutation,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "../../../store/reducers/authSlice";
import type { AppDispatch, RootState } from "../../../store/store";
import { persistor } from "../../../store/store";

const PAYMENT_INSTRUCTIONS = `Transfer payment to:
Bank: Meezan Bank
Account: 1234567890
Title: Osstel Services

Then submit your request. Admin will verify and activate your plan.`;

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    status?: number;
    data?: { message?: string; errors?: { msg: string }[] } | string;
  };

  const apiMessage = getApiErrorMessage(error);
  if (err.status === 403 && isBlockedAccountMessage(apiMessage)) {
    return "BLOCKED";
  }
  if (typeof err.data === "string") return err.data;
  if (err.data?.errors?.length) {
    return err.data.errors.map((e) => e.msg).join("\n");
  }
  if (err.data?.message) return err.data.message;
  if (apiMessage) return apiMessage;
  return fallback;
}

function formatSubmittedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SubscriptionScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";

  const [upgradeTarget, setUpgradeTarget] = useState<ApiPlan | null>(null);
  const [isRenewalRequest, setIsRenewalRequest] = useState(false);
  const [note, setNote] = useState("");

  const {
    data: meData,
    refetch: refetchMe,
    isLoading: isMeLoading,
  } = useGetMeQuery(undefined, { skip: !isManager });

  const {
    data: plansData,
    isLoading: isPlansLoading,
    isFetching: isPlansFetching,
    refetch: refetchPlans,
    error: plansError,
  } = useGetPlansQuery();

  const {
    data: requestData,
    isLoading: isRequestLoading,
    isFetching: isRequestFetching,
    refetch: refetchRequest,
    error: requestError,
  } = useGetPlanRequestQuery(undefined, { skip: !isManager });

  const [submitRequest, { isLoading: isSubmitting }] =
    useSubmitPlanRequestMutation();

  useEffect(() => {
    if (meData?.user) {
      dispatch(updateUser(meToAuthProfile(meData.user)));
    }
  }, [meData, dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (isManager) {
        refetchMe();
        refetchRequest();
      }
      refetchPlans();
    }, [isManager, refetchMe, refetchPlans, refetchRequest]),
  );

  const currentPlanId: SubscriptionPlanId =
    meData?.user.subscriptionPlan ??
    requestData?.currentPlan ??
    user?.subscriptionPlan ??
    "free";
  const basePlanId: SubscriptionPlanId =
    meData?.user.baseSubscriptionPlan ?? currentPlanId;
  const activeTrial = meData?.user.trial ?? user?.trial ?? null;
  const activeSubscription =
    meData?.user.subscription ??
    requestData?.subscription ??
    user?.subscription ??
    null;
  const canRenew =
    requestData?.canRenew ?? activeSubscription?.canRenew ?? false;

  const pendingRequest =
    requestData?.request?.status === "pending" ? requestData.request : null;

  const hasPending = pendingRequest !== null;

  const sortedPlans = useMemo(() => {
    const plans = plansData?.plans ?? [];
    return [...plans].sort((a, b) => PLAN_ORDER[a.id] - PLAN_ORDER[b.id]);
  }, [plansData?.plans]);

  const isLoading =
    isPlansLoading || (isManager && (isMeLoading || isRequestLoading));
  const isRefreshing = isPlansFetching || isRequestFetching;

  const handleRefresh = useCallback(() => {
    refetchPlans();
    if (isManager) {
      refetchMe();
      refetchRequest();
    }
  }, [isManager, refetchMe, refetchPlans, refetchRequest]);

  const handleBlocked = useCallback(async () => {
    Alert.alert(
      "Account blocked",
      "Your account has been blocked. Please contact support.",
      [
        {
          text: "OK",
          onPress: async () => {
            dispatch(logout());
            dispatch(api.util.resetApiState());
            await persistor.purge();
            router.replace("/auth/signin");
          },
        },
      ],
    );
  }, [dispatch]);

  useEffect(() => {
    const plansMsg = plansError ? getErrorMessage(plansError, "") : "";
    const requestMsg = requestError ? getErrorMessage(requestError, "") : "";
    if (plansMsg === "BLOCKED" || requestMsg === "BLOCKED") {
      handleBlocked();
    }
  }, [plansError, requestError, handleBlocked]);

  const closeModal = () => {
    setUpgradeTarget(null);
    setIsRenewalRequest(false);
    setNote("");
  };

  const openPlanRequest = (plan: ApiPlan, renewal = false) => {
    setUpgradeTarget(plan);
    setIsRenewalRequest(renewal);
    setNote("");
  };

  const handleSubmitUpgrade = async () => {
    if (!upgradeTarget || isSubmitting) return;

    try {
      await submitRequest({
        plan: upgradeTarget.id,
        ...(note.trim() ? { note: note.trim() } : {}),
      }).unwrap();

      closeModal();
      Toast.show({
        type: "success",
        text1: isRenewalRequest ? "Renewal request submitted" : "Request submitted",
        text2: "Admin will activate your plan after payment verification.",
      });
      refetchRequest();
      refetchMe();
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Could not submit upgrade request.",
      );
      if (message === "BLOCKED") {
        handleBlocked();
        return;
      }
      Alert.alert("Request failed", message);
    }
  };

  if (!isManager) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScreenHeader title="Subscription Plan" showBack />
          <View style={styles.centerWrap}>
            <Text style={styles.centerText}>
              Subscription plans are available for managers only.
            </Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader
        title="Subscription Plan"
        showBack
        rightSlot={
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {getPlanDisplayName(currentPlanId)}
            </Text>
          </View>
        }
      />

      {isLoading ? (
        <View style={styles.centerWrap}>
          <CustomLoading size="lg" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing && !isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {activeTrial?.active ? (
            <View style={styles.pendingBanner}>
              <Ionicons
                name="gift-outline"
                size={vs(22)}
                color={colors.primary}
              />
              <View style={styles.pendingContent}>
                <Text style={styles.pendingTitle}>
                  Pro trial active — {activeTrial.daysRemaining} day
                  {activeTrial.daysRemaining === 1 ? "" : "s"} remaining
                </Text>
                <Text style={styles.pendingSubtext}>
                  You have full Pro access during the trial. After it ends, your
                  plan returns to{" "}
                  {getPlanDisplayName(
                    meData?.user.baseSubscriptionPlan ?? "free",
                  )}
                  .
                </Text>
              </View>
            </View>
          ) : null}

          {activeSubscription?.active && !activeTrial?.active ? (
            <View style={styles.pendingBanner}>
              <Ionicons
                name="calendar-outline"
                size={vs(22)}
                color={colors.primary}
              />
              <View style={styles.pendingContent}>
                <Text style={styles.pendingTitle}>
                  {getPlanDisplayName(activeSubscription.plan)} plan active —{" "}
                  {activeSubscription.daysRemaining} day
                  {activeSubscription.daysRemaining === 1 ? "" : "s"} remaining
                </Text>
                <Text style={styles.pendingSubtext}>
                  Valid until{" "}
                  {formatSubmittedDate(activeSubscription.expiresAt)}. After 30
                  days your plan returns to Free unless you renew or admin
                  extends it.
                </Text>
                {canRenew ? (
                  <Text style={styles.renewHint}>
                    Renewal is open — submit a request below to keep access.
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {hasPending && pendingRequest ? (
            <View style={styles.pendingBanner}>
              <Ionicons
                name="time-outline"
                size={vs(22)}
                color={colors.warning}
              />
              <View style={styles.pendingContent}>
                <Text style={styles.pendingTitle}>
                  Your request for{" "}
                  {getPlanDisplayName(pendingRequest.requestedPlan)} plan is
                  pending admin approval
                </Text>
                <Text style={styles.pendingSubtext}>
                  Submitted on {formatSubmittedDate(pendingRequest.createdAt)}.
                  Admin will verify your payment and activate your plan.
                </Text>
                {pendingRequest.note ? (
                  <Text style={styles.pendingNote}>
                    Note: {pendingRequest.note}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {currentPlanId === "premium" &&
          !hasPending &&
          !activeTrial?.active &&
          !activeSubscription?.active ? (
            <View style={styles.bestPlanBanner}>
              <Ionicons
                name="diamond-outline"
                size={vs(20)}
                color={colors.warning}
              />
              <Text style={styles.bestPlanText}>
                You&apos;re on the best plan
              </Text>
            </View>
          ) : null}

          {sortedPlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isRenewalTarget =
              canRenew && plan.id === basePlanId && isCurrent;
            const canUpgrade =
              !hasPending &&
              canRequestPlan(currentPlanId, plan.id, {
                canRenew,
                basePlan: basePlanId,
              });

            return (
              <PlanUpgradeCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrent}
                showUpgrade={canUpgrade}
                upgradeDisabled={hasPending}
                actionLabel={
                  isRenewalTarget ? `Renew ${plan.name}` : undefined
                }
                onUpgrade={() => openPlanRequest(plan, isRenewalTarget)}
              />
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={upgradeTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isRenewalRequest
                ? `Renew ${upgradeTarget?.name}`
                : `Upgrade to ${upgradeTarget?.name}`}
            </Text>
            <Text style={styles.modalPrice}>
              Rs {upgradeTarget?.price.toLocaleString() ?? "0"} per month
            </Text>

            <Text style={styles.modalInstructions}>{PAYMENT_INSTRUCTIONS}</Text>
            {upgradeTarget ? (
              <Text style={styles.modalAmount}>
                Amount: Rs {upgradeTarget.price.toLocaleString()}
              </Text>
            ) : null}

            <Text style={styles.noteLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Message to admin (max 300 chars)"
              placeholderTextColor={colors.gray100}
              multiline
              maxLength={300}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <View style={styles.submitBtnWrap}>
                <CustomButton
                  title={isRenewalRequest ? "Submit Renewal" : "Submit Request"}
                  onPress={handleSubmitUpgrade}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: vs(16),
      paddingVertical: vs(12),
    },
    backBtn: {
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
    planBadge: {
      minWidth: vs(72),
      paddingHorizontal: vs(10),
      paddingVertical: vs(6),
      borderRadius: vs(20),
      backgroundColor: colors.secondary100,
      alignItems: "center",
    },
    planBadgeText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.bold,
      color: colors.success,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    centerWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(32),
    },
    centerText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
    },
    pendingBanner: {
      flexDirection: "row",
      gap: vs(12),
      backgroundColor: colors.warningBg,
      borderRadius: vs(14),
      padding: vs(16),
      marginBottom: vs(16),
      borderWidth: 1,
      borderColor: colors.warning,
    },
    pendingContent: {
      flex: 1,
    },
    pendingTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(6),
      lineHeight: vs(20),
    },
    pendingSubtext: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(18),
    },
    pendingNote: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.text,
      marginTop: vs(8),
    },
    renewHint: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.warning,
      marginTop: vs(8),
      lineHeight: vs(18),
    },
    bestPlanBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      backgroundColor: colors.warningBg,
      borderRadius: vs(12),
      padding: vs(14),
      marginBottom: vs(16),
    },
    bestPlanText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.warning,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.background,
      borderTopLeftRadius: vs(20),
      borderTopRightRadius: vs(20),
      padding: vs(24),
      maxHeight: "90%",
    },
    modalTitle: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(4),
    },
    modalPrice: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      marginBottom: vs(16),
    },
    modalInstructions: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
      marginBottom: vs(12),
    },
    modalAmount: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(16),
    },
    noteLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    noteInput: {
      minHeight: vs(88),
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white100,
      backgroundColor: colors.white,
      paddingHorizontal: vs(14),
      paddingVertical: vs(12),
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      textAlignVertical: "top",
      marginBottom: vs(20),
    },
    modalActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(12),
    },
    cancelBtn: {
      paddingHorizontal: vs(16),
      paddingVertical: vs(14),
    },
    cancelBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
    submitBtnWrap: {
      flex: 1,
    },
  });
}
