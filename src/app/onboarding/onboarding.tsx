import CustomButton from "@/components/CustomButton";
import CustomLoading from "@/components/CustomLoading";
import { checkBusinessVerification } from "@/services/verification";
import { isUserRole } from "@/types/role";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Images } from "@constants/images";
import { Octicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type OnboardingStyles = ReturnType<typeof createStyles>;

type StepProps = {
  title: string;
  description: string;
  verified: boolean;
  styles: OnboardingStyles;
};

export default function Onboarding() {
  const { colors, fonts, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, height, insets.bottom),
    [colors, fonts, height, insets.bottom],
  );
  const { phone, role: roleParam } = useLocalSearchParams<{
    phone?: string;
    role?: string;
  }>();
  const [isVerified, setIsVerified] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const role = isUserRole(roleParam) ? roleParam : null;
  const displayPhone = phone ?? "";

  function VerificationStep({
    title,
    description,
    verified,
    styles,
  }: StepProps) {
    return (
      <View style={styles.stepRow}>
        <View
          style={[
            styles.stepIcon,
            verified ? styles.stepIconVerified : styles.stepIconPending,
          ]}
        >
          {verified ? (
            <Octicons name="check" size={24} color={colors.white} />
          ) : null}
        </View>
        <View style={styles.stepContent}>
          <Text
            style={[
              styles.stepTitle,
              verified ? styles.stepTitleVerified : styles.stepTitlePending,
            ]}
          >
            {title}
          </Text>
          <Text style={styles.stepDescription}>{description}</Text>
        </View>
      </View>
    );
  }

  const fetchStatus = useCallback(async () => {
    if (!displayPhone) return;
    setIsChecking(true);
    try {
      const status = await checkBusinessVerification(displayPhone);
      setIsVerified(status === "verified");
    } finally {
      setIsChecking(false);
    }
  }, [displayPhone]);

  useEffect(() => {
    if (role !== "business_owner") {
      if (router.canDismiss()) router.dismissAll();
      router.replace("/(tabs)/home");
      return;
    }
    fetchStatus();
  }, [role, fetchStatus]);

  const handleContinue = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/(tabs)/home");
  };

  return (
    <ImageBackground
      source={Images.background}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {isDark ? <View style={styles.darkOverlay} /> : null}

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.containerInner}>
          <View style={styles.logoSection}>
            <Text style={styles.brandLogo}>VAAS</Text>
          </View>

          <View style={styles.cardSheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.cardContent}
            >
              <View style={styles.headerGroup}>
                <Text style={styles.welcomeText}>Business owner</Text>
                <Text style={styles.titleText}>
                  {isVerified ? "You're verified" : "Verification pending"}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isVerified
                    ? styles.statusBadgeVerified
                    : styles.statusBadgePending,
                ]}
              >
                <View
                  style={[
                    styles.statusCircle,
                    isVerified
                      ? styles.statusCircleVerified
                      : styles.statusCirclePending,
                  ]}
                >
                  {isChecking ? (
                    <CustomLoading size="xxl" />
                  ) : isVerified ? (
                    <Octicons name="check" size={24} color={colors.white} />
                  ) : (
                    <Octicons name="x" size={24} color={colors.text} />
                  )}
                </View>
                <Text
                  style={[
                    styles.statusLabel,
                    isVerified
                      ? styles.statusLabelVerified
                      : styles.statusLabelPending,
                  ]}
                >
                  {isChecking
                    ? "Checking status..."
                    : isVerified
                      ? "Account approved"
                      : "Awaiting admin approval"}
                </Text>
              </View>

              <Text style={styles.subtitle}>
                {isVerified
                  ? "Your business owner account is approved. You can now access your VAAS dashboard."
                  : "We are reviewing your business owner request. This usually takes 24–48 hours. Tap below to check your status again."}
              </Text>

              <View style={styles.stepsCard}>
                <VerificationStep
                  title="Phone verified"
                  description="Your mobile number is confirmed."
                  verified
                  styles={styles}
                />
                <VerificationStep
                  title="Business profile"
                  description="Basic business details received."
                  verified
                  styles={styles}
                />
                <VerificationStep
                  title="Admin approval"
                  description={
                    isVerified
                      ? "Your account has been approved by VAAS."
                      : "Our team is verifying your business owner access."
                  }
                  verified={isVerified}
                  styles={styles}
                />
              </View>

              <View style={styles.actionWrapper}>
                {isVerified ? (
                  <CustomButton
                    title="Go to Dashboard"
                    onPress={handleContinue}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchStatus}
                    disabled={isChecking}
                    activeOpacity={0.85}
                  >
                    {isChecking ? (
                      <CustomLoading size="lg" />
                    ) : (
                      <Text style={styles.refreshButtonText}>Check status</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {displayPhone ? (
                <Text style={styles.phoneNote}>
                  Registered as{" "}
                  <Text style={styles.phoneHighlight}>{displayPhone}</Text>
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  screenHeight: number,
  bottomInset: number,
) {
  const logoHeight = Math.max(screenHeight * 0.16, vs(80));

  return StyleSheet.create({
    backgroundImage: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    darkOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    safeArea: {
      flex: 1,
    },
    containerInner: {
      flex: 1,
      justifyContent: "space-between",
    },
    logoSection: {
      height: logoHeight,
      minHeight: vs(72),
      maxHeight: screenHeight * 0.22,
      alignItems: "center",
      justifyContent: "center",
    },
    brandLogo: {
      fontSize: FONT_SIZES.brand,
      fontFamily: fonts.title,
      color: colors.black,
      letterSpacing: 3,
    },
    cardSheet: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: vs(32),
      borderTopRightRadius: vs(32),
      maxHeight: screenHeight * 0.78,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.08,
      shadowRadius: 15,
      elevation: 20,
    },
    cardContent: {
      paddingHorizontal: vs(12),
      paddingTop: vs(28),
      paddingBottom: Math.max(bottomInset, vs(24)),
    },
    headerGroup: {
      marginBottom: vs(16),
    },
    welcomeText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: vs(4),
    },
    titleText: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: vs(14),
      padding: vs(14),
      marginBottom: vs(16),
      borderWidth: 1,
    },
    statusBadgePending: {
      backgroundColor: colors.background,
      borderColor: colors.secondary,
    },
    statusBadgeVerified: {
      backgroundColor: colors.background,
      borderColor: colors.success,
    },
    statusCircle: {
      width: vs(44),
      height: vs(44),
      borderRadius: vs(22),
      alignItems: "center",
      justifyContent: "center",
      marginRight: vs(12),
    },
    statusCirclePending: {
      backgroundColor: colors.secondary,
    },
    statusCircleVerified: {
      backgroundColor: colors.success,
    },
    statusLabel: {
      flex: 1,
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
    },
    statusLabelPending: {
      color: colors.secondary,
    },
    statusLabelVerified: {
      color: colors.success,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(21),
      marginBottom: vs(20),
    },
    stepsCard: {
      gap: vs(14),
      marginBottom: vs(24),
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    stepIcon: {
      width: vs(28),
      height: vs(28),
      borderRadius: vs(14),
      alignItems: "center",
      justifyContent: "center",
      marginRight: vs(12),
      marginTop: vs(2),
    },
    stepIconPending: {
      backgroundColor: colors.secondary,
    },
    stepIconVerified: {
      backgroundColor: colors.success,
    },
    stepCheck: {
      color: colors.black,
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      marginBottom: vs(2),
    },
    stepTitlePending: {
      color: colors.secondary,
    },
    stepTitleVerified: {
      color: colors.text,
    },
    stepDescription: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(18),
    },
    actionWrapper: {
      alignItems: "center",
      marginBottom: vs(12),
    },
    refreshButton: {
      backgroundColor: colors.secondary,
      height: vs(52),
      borderRadius: vs(12),
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    refreshButtonText: {
      color: colors.black,
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.semiBold,
    },
    phoneNote: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
      textAlign: "center",
    },
    phoneHighlight: {
      color: colors.text,
      fontFamily: fonts.semiBold,
    },
  });
}
