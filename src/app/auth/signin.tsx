import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import GradientBackground from "@/components/GradientBackground";
import { meToAuthProfile, toAuthUser } from "@/types/auth";
import { LIMITS, isPasswordLengthValid, passwordLengthHint } from "@/constants/limits";
import { type UserRole, USER_ROLES } from "@/types/role";
import {
  useGoogleAuthMutation,
  useLazyGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
} from "../../../store/api";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { setUser, updateUser } from "../../../store/reducers/authSlice";
import type { AppDispatch } from "../../../store/store";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Images } from "@constants/images";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const ROLE_OPTIONS: UserRole[] = ["resident", "manager"];

export default function SignIn() {
  const dispatch = useDispatch<AppDispatch>();
  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const nameFieldRef = useRef<View>(null);
  const phoneFieldRef = useRef<View>(null);
  const passwordFieldRef = useRef<View>(null);
  const confirmFieldRef = useRef<View>(null);
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [fetchMe] = useLazyGetMeQuery();
  const { signIn: signInWithGoogle, isReady: isGoogleReady } = useGoogleSignIn();
  const { colors, fonts, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const styles = useMemo(
    () =>
      createStyles(
        colors,
        fonts,
        height,
        insets.bottom,
        isDark,
        keyboardOpen,
      ),
    [colors, fonts, height, insets.bottom, isDark, keyboardOpen],
  );

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("resident");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSubmitting = isLoginLoading || isRegisterLoading || isGoogleLoading;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardOpen(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  const resetForm = () => {
    setName("");
    setPhoneNumber("");
    setPassword("");
    setConfirmPassword("");
  };

  const toggleMode = () => {
    Keyboard.dismiss();
    resetForm();
    setIsSignUp((prev) => !prev);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const isManagerRole = selectedRole === "manager";
  const isResidentRole = selectedRole === "resident";
  const canSignUp = true;

  const completeAuth = async (result: unknown) => {
    dispatch(setUser(toAuthUser(result)));

    try {
      const me = await fetchMe(undefined).unwrap();
      dispatch(updateUser(meToAuthProfile(me.user)));
    } catch {
      // Profile sync is optional immediately after auth
    }

    if (router.canDismiss()) router.dismissAll();
    router.replace("/(tabs)/home");
  };

  const handleAuthError = (error: unknown, fallback: string) => {
    const err = error as {
      data?:
        | {
            message?: string;
            errors?: { msg: string }[];
          }
        | string;
    };

    let message = fallback;

    if (typeof err.data === "string") {
      message = err.data;
    } else if (err.data?.errors?.length) {
      message = err.data.errors.map((e) => e.msg).join("\n");
    } else if (err.data?.message) {
      message = err.data.message;
    }

    alert(message);
  };

  const handleGoogleSignIn = async () => {
    if (!isGoogleReady || isSubmitting) return;

    Keyboard.dismiss();

    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return;

      const result = await googleAuth({ idToken }).unwrap();
      await completeAuth(result);
    } catch (error) {
      const err = error as {
        data?: { message?: string } | string;
      };
      const message =
        typeof err.data === "string"
          ? err.data
          : err.data?.message?.toLowerCase().includes("phone")
            ? "Google sign-in could not complete. If you registered with a phone number, sign in with phone and password instead. To link Google to that account, add the same email in Edit Profile first."
            : undefined;

      handleAuthError(error, message ?? "Google Sign-In failed.");
    }
  };

  const handleSubmit = async () => {
    if (phoneNumber.length < 9) {
      alert("Please enter a valid mobile number");
      return;
    }

    if (!password.trim()) {
      alert("Please enter your password");
      return;
    }

    if (!isPasswordLengthValid(password)) {
      alert(`Password must be ${passwordLengthHint()}`);
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        alert("Please enter your name");
        return;
      }
      if (name.trim().length > LIMITS.NAME_MAX) {
        alert(`Name must be under ${LIMITS.NAME_MAX} characters`);
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }
    }

    const phone = `+92${phoneNumber}`;
    Keyboard.dismiss();

    try {
      if (isSignUp) {
        const result = await register({
          name: name.trim(),
          phone,
          password,
          confirmPassword,
          role: selectedRole,
        }).unwrap();
        const authUser = toAuthUser(result);
        if (selectedRole === "resident" && authUser.userId) {
          alert(
            `Account created! Your User ID is ${authUser.userId}. Share it with your hostel manager so they can add you faster.`,
          );
        }
        await completeAuth(result);
      } else {
        const result = await login({ phone, password }).unwrap();
        await completeAuth(result);
      }
    } catch (error) {
      handleAuthError(
        error,
        isSignUp ? "Registration failed." : "Login failed.",
      );
    }
  };

  const scrollFieldIntoView = useCallback((fieldRef: RefObject<View | null>) => {
    const field = fieldRef.current;
    const content = scrollContentRef.current;
    if (!field || !content) return;

    const scrollToField = () => {
      field.measureLayout(
        content,
        (_x, y) => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - vs(16)),
            animated: true,
          });
        },
        () => {},
      );
    };

    requestAnimationFrame(scrollToField);
    if (Platform.OS === "android") {
      setTimeout(scrollToField, 100);
    }
  }, []);

  const isSubmitDisabled =
    isSubmitting ||
    !password.trim() ||
    phoneNumber.length < 9 ||
    (isSignUp &&
      (!name.trim() ||
        !confirmPassword.trim() ||
        password !== confirmPassword));

  return (
    <View style={styles.root}>
      <ImageBackground
        source={Images.background}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.backgroundOverlay} />
      </ImageBackground>

      <View
        pointerEvents="none"
        style={[styles.bottomFill, { backgroundColor: colors.gradientBg[1] }]}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            bounces={false}
          >
            <View ref={scrollContentRef} style={styles.scrollInner}>
            <View
              style={[
                styles.logoSection,
                keyboardOpen && styles.logoSectionCompact,
              ]}
            >
              <Image
                source={Images.osstel}
                style={[
                  styles.brandLogoImage,
                  keyboardOpen && styles.brandLogoImageCompact,
                ]}
                resizeMode="contain"
                accessibilityLabel="Osstel logo"
              />
            </View>

            <GradientBackground style={styles.cardSheet}>
              <View style={styles.cardHeader}>
                <View style={styles.headerGroup}>
                  <Text style={styles.welcomeText}>
                    {isSignUp ? "Get started" : "Welcome back"}
                  </Text>
                  <Text style={styles.titleText}>
                    {isSignUp && canSignUp ? "Create account" : "Sign in"}
                  </Text>
                </View>
                  <Text style={styles.subtitle}>
                    {isSignUp
                      ? isResidentRole
                        ? "Create your resident account with Osstel."
                        : "Register to manage your hostel with Osstel."
                      : isResidentRole
                        ? "Sign in with your phone number and password."
                        : "Sign in with your phone number and password."}
                  </Text>
              </View>

              <View style={styles.formBody}>
                <Text style={styles.sectionLabel}>I am a</Text>
              <View style={styles.roleRow}>
                {ROLE_OPTIONS.map((role) => {
                  const isSelected = selectedRole === role;
                  const { label } = USER_ROLES[role];

                  return (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleChip,
                        isSelected && styles.roleChipSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedRole(role);
                      }}
                    >
                      <Ionicons
                        name={
                          role === "resident"
                            ? "person-outline"
                            : "business-outline"
                        }
                        size={vs(16)}
                        color={isSelected ? colors.onPrimary : colors.primary}
                      />
                      <Text
                        style={[
                          styles.roleChipText,
                          isSelected && styles.roleChipTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isSignUp ? (
                <View ref={nameFieldRef}>
                  <CustomInput
                    label="Full Name"
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    maxLength={LIMITS.NAME_MAX}
                    onFocus={() => scrollFieldIntoView(nameFieldRef)}
                  />
                </View>
              ) : null}

              <View ref={phoneFieldRef}>
                <CustomInput
                  label="Mobile Number"
                  placeholder="300 1234567"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => scrollFieldIntoView(phoneFieldRef)}
                  leftAdornment={
                    <>
                      <Text style={styles.flag}>🇵🇰</Text>
                      <Text style={styles.countryCode}>+92</Text>
                      <View style={styles.divider} />
                    </>
                  }
                />
              </View>

              <View ref={passwordFieldRef}>
                <CustomInput
                  label="Password"
                  placeholder={
                    isResidentRole ? "Enter your password" : "Enter password"
                  }
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  maxLength={LIMITS.PASSWORD_MAX}
                  onFocus={() => scrollFieldIntoView(passwordFieldRef)}
                  onSubmitEditing={
                    isSignUp && canSignUp ? undefined : handleSubmit
                  }
                />
              </View>

              {isSignUp && canSignUp ? (
                <View ref={confirmFieldRef}>
                  <CustomInput
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    maxLength={LIMITS.PASSWORD_MAX}
                    onFocus={() => scrollFieldIntoView(confirmFieldRef)}
                    onSubmitEditing={handleSubmit}
                  />
                </View>
              ) : null}

              <View style={styles.actionWrapper}>
                <CustomButton
                  title={isSignUp && canSignUp ? "Sign Up" : "Sign In"}
                  onPress={handleSubmit}
                  disabled={isSubmitDisabled}
                  loading={isLoginLoading || isRegisterLoading}
                />

                {isManagerRole && isGoogleReady ? (
                  <>
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <CustomButton
                      variant="outline"
                      title="Continue with Google"
                      onPress={handleGoogleSignIn}
                      disabled={isSubmitting}
                      loading={isGoogleLoading}
                      icon={
                        <Ionicons
                          name="logo-google"
                          size={vs(18)}
                          color={colors.text}
                        />
                      }
                    />
                  </>
                ) : null}

                {canSignUp ? (
                  <Text style={styles.switchText}>
                    {isSignUp
                      ? "Already have an account? "
                      : "Don't have an account? "}
                    <Text style={styles.switchLink} onPress={toggleMode}>
                      {isSignUp ? "Sign in here" : "Register here"}
                    </Text>
                  </Text>
                ) : null}
              </View>
              </View>
            </GradientBackground>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  screenHeight: number,
  bottomInset: number,
  isDark: boolean,
  keyboardOpen: boolean,
) {
  const logoHeight = Math.max(screenHeight * 0.16, vs(72));

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.gradientBg[1],
    },
    backgroundImage: {
      ...StyleSheet.absoluteFill,
    },
    backgroundOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.authBackgroundOverlay,
    },
    bottomFill: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "62%",
    },
    safeArea: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Math.max(bottomInset, vs(16)),
    },
    scrollInner: {
      flexGrow: 1,
    },
    logoSection: {
      height: logoHeight,
      minHeight: vs(72),
      maxHeight: screenHeight * 0.22,
      alignItems: "center",
      justifyContent: "center",
    },
    logoSectionCompact: {
      height: vs(52),
      minHeight: vs(52),
      maxHeight: vs(52),
    },
    brandLogoImage: {
      width: vs(220),
      height: vs(88),
      maxWidth: "70%",
    },
    brandLogoImageCompact: {
      width: vs(140),
      height: vs(56),
    },
    cardSheet: {
      flexGrow: 1,
      borderTopLeftRadius: vs(32),
      borderTopRightRadius: vs(32),
      overflow: "hidden",
      minHeight: keyboardOpen ? undefined : screenHeight * 0.62,
    },
    cardHeader: {
      paddingHorizontal: vs(16),
      paddingTop: keyboardOpen ? vs(16) : vs(28),
      paddingBottom: vs(12),
    },
    formBody: {
      paddingHorizontal: vs(16),
    },
    headerGroup: {
      marginBottom: vs(8),
    },
    welcomeText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    titleText: {
      fontSize: FONT_SIZES.display,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray100,
    },
    sectionLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    roleRow: {
      flexDirection: "row",
      gap: vs(10),
      marginBottom: vs(10),
    },
    roleChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: vs(6),
      borderRadius: vs(14),
      backgroundColor: isDark ? colors.surfaceMuted : colors.background,
      borderWidth: 1.5,
      borderColor: isDark ? colors.chipBorder : colors.background,
      paddingVertical: vs(12),
      paddingHorizontal: vs(10),
    },
    roleChipSelected: {
      backgroundColor: isDark ? colors.primary400 : colors.primary,
      borderColor: colors.primary,
    },
    roleChipText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    roleChipTextSelected: {
      color: colors.onPrimary,
    },
    flag: {
      fontSize: vs(18),
      marginRight: vs(4),
    },
    countryCode: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    divider: {
      width: 1,
      height: vs(22),
      backgroundColor: colors.gray,
      marginHorizontal: vs(12),
    },
    actionWrapper: {
      alignItems: "center",
      marginTop: vs(8),
      width: "100%",
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(12),
      marginTop: vs(18),
      marginBottom: vs(18),
      width: "100%",
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? colors.chipBorder : colors.gray,
    },
    dividerText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      textTransform: "lowercase",
    },
    switchText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
      marginTop: vs(16),
      marginBottom: vs(4),
      textAlign: "center",
    },
    switchLink: {
      color: colors.primary,
      fontFamily: fonts.semiBold,
    },
  });
}
