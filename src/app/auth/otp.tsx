import CustomButton from "@/components/CustomButton";
import { isUserRole, USER_ROLES } from "@/types/role";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Images } from "@constants/images";
import { verifyLoginOtp } from "../../../store/reducers/authSlice";
import type { AppDispatch } from "../../../store/store";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from "react";
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import OTPTextInput from "react-native-otp-textinput";
import { useDispatch } from "react-redux";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

export default function Otp() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors, fonts, isDark } = useTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pinSize = useMemo(() => {
    const horizontalPadding = vs(28) * 2;
    const pinGap = vs(12);
    const availableWidth = width - horizontalPadding - vs(40);
    return Math.min(vs(56), Math.floor((availableWidth - pinGap * 3) / 4));
  }, [width]);
  const pinGap = vs(12);
  const otpRowWidth = pinSize * OTP_LENGTH + pinGap * (OTP_LENGTH - 1);

  const styles = useMemo(
    () =>
      createStyles(
        colors,
        fonts,
        height,
        insets.bottom,
        pinSize,
        pinGap,
        otpRowWidth,
      ),
    [colors, fonts, height, insets.bottom, pinSize, pinGap, otpRowWidth],
  );

  const { phone, role: roleParam } = useLocalSearchParams<{
    phone?: string;
    role?: string;
  }>();
  const otpRef = useRef<ElementRef<typeof OTPTextInput>>(null);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);

  const isComplete = otp.length === OTP_LENGTH;
  const displayPhone = phone ?? "+92";
  const role = isUserRole(roleParam) ? roleParam : null;
  const roleLabel = role ? USER_ROLES[role].label : "";

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = useCallback(async () => {
    if (!isComplete || !role) return;
    Keyboard.dismiss();

    try {
      await dispatch(
        verifyLoginOtp({ phone: displayPhone, role, otp }),
      ).unwrap();
    } catch {
      alert("Invalid OTP. Please try again.");
      return;
    }

    if (router.canDismiss()) router.dismissAll();

    if (role === "tenant") {
      router.replace("/(tabs)/home");
      return;
    }

    router.replace({
      pathname: "/onboarding/onboarding",
      params: { phone: displayPhone, role },
    });
  }, [dispatch, isComplete, otp, displayPhone, role]);

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(RESEND_SECONDS);
    otpRef.current?.clear();
    setOtp("");
    console.log("Resending OTP:", { phone: displayPhone, role });
  };

  return (
    <ImageBackground
      source={Images.background}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {isDark ? <View style={styles.darkOverlay} /> : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.containerInner}>
              <View style={styles.logoSection}>
                <Text style={styles.brandLogo}>VAAS</Text>
              </View>

              <View style={styles.cardSheet}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.cardContent}
                >
                  <View style={styles.headerGroup}>
                    <Text style={styles.welcomeText}>Verification</Text>
                    <Text style={styles.titleText}>Enter OTP</Text>
                  </View>

                  <Text style={styles.subtitle}>
                    We sent a {OTP_LENGTH}-digit code to{" "}
                    <Text style={styles.phoneHighlight}>{displayPhone}</Text>
                    {roleLabel ? (
                      <>
                        {" "}
                        as{" "}
                        <Text style={styles.phoneHighlight}>{roleLabel}</Text>
                      </>
                    ) : null}
                  </Text>

                  <View style={styles.otpWrapper}>
                    <OTPTextInput
                      ref={otpRef}
                      inputCount={OTP_LENGTH}
                      keyboardType="number-pad"
                      autoFocus
                      tintColor={colors.primary}
                      offTintColor={colors.secondary}
                      handleTextChange={setOtp}
                      containerStyle={styles.otpContainer}
                      textInputStyle={styles.otpInput}
                      textContentType="oneTimeCode"
                      autoComplete={
                        Platform.OS === "android" ? "sms-otp" : "one-time-code"
                      }
                    />
                  </View>

                  <View style={styles.actionWrapper}>
                    <CustomButton
                      title="Verify"
                      onPress={handleVerify}
                      disabled={!isComplete}
                    />

                    <Text style={styles.resendText}>
                      Didn&apos;t receive the code?{" "}
                      {resendTimer > 0 ? (
                        <Text style={styles.resendTimer}>
                          Resend in {resendTimer}s
                        </Text>
                      ) : (
                        <Text style={styles.resendLink} onPress={handleResend}>
                          Resend
                        </Text>
                      )}
                    </Text>

                    <TouchableOpacity
                      style={styles.backLinkWrapper}
                      onPress={() => router.back()}
                    >
                      <Text style={styles.backLink}>Change phone number</Text>
                    </TouchableOpacity>
                    {role ? (
                      <TouchableOpacity
                        style={styles.backLinkWrapper}
                        onPress={() => router.replace("/auth/role")}
                      >
                        <Text style={styles.backLink}>Change role</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <Text style={styles.footerTerms}>
                    Use the application according to privacy rules. Any kind of
                    violation will be subject to sanction.
                  </Text>
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  screenHeight: number,
  bottomInset: number,
  pinSize: number,
  pinGap: number,
  otpRowWidth: number,
) {
  const logoHeight = Math.max(screenHeight * 0.24, vs(100));

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
    keyboardView: {
      flex: 1,
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
      minHeight: vs(90),
      maxHeight: screenHeight * 0.3,
      alignItems: "center",
      justifyContent: "center",
    },
    brandLogo: {
      fontSize: FONT_SIZES.brand,
      fontFamily: FONTS.title,
      color: colors.black,
    },
    cardSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: vs(32),
      borderTopRightRadius: vs(32),
      maxHeight: screenHeight * 0.74,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.08,
      shadowRadius: 15,
      elevation: 20,
    },
    cardContent: {
      paddingHorizontal: vs(12),
      paddingTop: vs(32),
      paddingBottom: Math.max(bottomInset, vs(28)),
    },
    headerGroup: {
      marginBottom: vs(8),
    },
    welcomeText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: vs(4),
    },
    titleText: {
      fontSize: FONT_SIZES.display,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(20),
      marginBottom: vs(28),
    },
    phoneHighlight: {
      color: colors.text,
      fontFamily: FONTS.semiBold,
    },
    otpWrapper: {
      width: "100%",
      alignItems: "center",
      marginBottom: vs(28),
    },
    otpContainer: {
      width: otpRowWidth,
      justifyContent: "space-between",
      gap: pinGap,
    },
    otpInput: {
      width: pinSize,
      height: pinSize,
      margin: 0,
      borderWidth: 1.5,
      borderBottomWidth: 1.5,
      borderRadius: vs(12),
      backgroundColor: colors.background,
      fontSize: FONT_SIZES.xxl,
      fontFamily: FONTS.bold,
      color: colors.text,
      textAlign: "center",
    },
    actionWrapper: {
      alignItems: "center",
      marginBottom: vs(24),
    },
    resendText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: vs(12),
      marginTop: vs(6),
      textAlign: "center",
    },
    resendTimer: {
      color: colors.text,
      fontFamily: FONTS.semiBold,
    },
    resendLink: {
      color: colors.primary,
      fontFamily: FONTS.bold,
    },
    backLinkWrapper: {
      paddingVertical: vs(4),
    },
    backLink: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.semiBold,
      color: colors.primary,
    },
    footerTerms: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
      textAlign: "center",
      lineHeight: vs(18),
      paddingHorizontal: vs(12),
    },
  });
}
