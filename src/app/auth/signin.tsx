import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import GradientBackground from "@/components/GradientBackground";
import { meToAuthProfile, toAuthUser } from "@/types/auth";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import CustomLoading from "@/components/CustomLoading";

const ROLE_OPTIONS: UserRole[] = ["resident", "manager"];

export default function SignIn() {
  const dispatch = useDispatch<AppDispatch>();
  const scrollRef = useRef<ScrollView>(null);
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [fetchMe] = useLazyGetMeQuery();
  const { signIn: signInWithGoogle, isReady: isGoogleReady } = useGoogleSignIn();
  const { colors, fonts, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const styles = useMemo(
    () =>
      createStyles(
        colors,
        fonts,
        height,
        insets.bottom,
        isDark,
        keyboardOpen,
        keyboardHeight,
      ),
    [colors, fonts, height, insets.bottom, isDark, keyboardOpen, keyboardHeight],
  );

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("resident");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSubmitting = isLoginLoading || isRegisterLoading || isGoogleLoading;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOpen(true);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
      setKeyboardHeight(0);
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
    setUserId("");
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
  const canSignUp = isManagerRole;

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
      handleAuthError(error, "Google Sign-In failed.");
    }
  };

  const handleSubmit = async () => {
    if (isResidentRole) {
      if (!userId.trim()) {
        alert("Please enter your User ID");
        return;
      }
    } else if (phoneNumber.length < 9) {
      alert("Please enter a valid mobile number");
      return;
    }

    if (!password.trim()) {
      alert("Please enter your password");
      return;
    }

    if (isSignUp && canSignUp) {
      if (!name.trim()) {
        alert("Please enter your name");
        return;
      }
      if (password.length < 6) {
        alert("Password must be at least 6 characters");
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
      if (isSignUp && canSignUp) {
        const result = await register({
          name: name.trim(),
          phone,
          password,
          confirmPassword,
          role: selectedRole,
        }).unwrap();
        await completeAuth(result);
      } else {
        const result = await login(
          isResidentRole
            ? { userId: userId.trim(), password }
            : { phone, password, role: selectedRole },
        ).unwrap();
        await completeAuth(result);
      }
    } catch (error) {
      handleAuthError(
        error,
        isSignUp ? "Registration failed." : "Login failed.",
      );
    }
  };

  const scrollFocusedFieldIntoView = useCallback(() => {
    const scrollToEnd = () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    };

    requestAnimationFrame(scrollToEnd);

    if (Platform.OS === "android") {
      setTimeout(scrollToEnd, 120);
    }
  }, []);

  const isSubmitDisabled =
    isSubmitting ||
    !password.trim() ||
    (isResidentRole ? !userId.trim() : phoneNumber.length < 9) ||
    (isSignUp &&
      canSignUp &&
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
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}
          >
            {!keyboardOpen ? (
              <View style={styles.logoSection}>
                <Image
                  source={Images.osstel}
                  style={styles.brandLogoImage}
                  resizeMode="contain"
                  accessibilityLabel="Osstel logo"
                />
              </View>
            ) : null}

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
                  {isSignUp && canSignUp
                    ? "Register to manage your hostel with Osstel."
                    : selectedRole === "resident"
                      ? "Sign in with your user ID and password."
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
                        if (role === "resident") {
                          setIsSignUp(false);
                          setName("");
                          setConfirmPassword("");
                          setPhoneNumber("");
                        } else {
                          setUserId("");
                        }
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

              {isSignUp && canSignUp ? (
                <CustomInput
                  label="Full Name"
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  onFocus={scrollFocusedFieldIntoView}
                />
              ) : null}

              {isResidentRole ? (
                <CustomInput
                  label="User ID"
                  placeholder="482913"
                  value={userId}
                  onChangeText={setUserId}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  onFocus={scrollFocusedFieldIntoView}
                />
              ) : (
                <CustomInput
                  label="Mobile Number"
                  placeholder="300 1234567"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={scrollFocusedFieldIntoView}
                  leftAdornment={
                    <>
                      <Text style={styles.flag}>🇵🇰</Text>
                      <Text style={styles.countryCode}>+92</Text>
                      <View style={styles.divider} />
                    </>
                  }
                />
              )}

              <CustomInput
                label="Password"
                placeholder={
                  isResidentRole ? "Enter your password" : "Enter password"
                }
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={scrollFocusedFieldIntoView}
                onSubmitEditing={
                  isSignUp && canSignUp ? undefined : handleSubmit
                }
              />

              {isSignUp && canSignUp ? (
                <CustomInput
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  onFocus={scrollFocusedFieldIntoView}
                  onSubmitEditing={handleSubmit}
                />
              ) : null}

              <View style={styles.actionWrapper}>
                <CustomButton
                  title={
                    isSubmitting ? (
                      <CustomLoading size="md" />
                    ) : isSignUp && canSignUp ? (
                      "Sign Up"
                    ) : (
                      "Sign In"
                    )
                  }
                  onPress={handleSubmit}
                  disabled={isSubmitDisabled}
                />

                {isManagerRole && isGoogleReady ? (
                  <>
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={styles.googleButton}
                      activeOpacity={0.85}
                      onPress={handleGoogleSignIn}
                      disabled={isSubmitting}
                    >
                      {isGoogleLoading ? (
                        <CustomLoading size="sm" />
                      ) : (
                        <>
                          <Ionicons
                            name="logo-google"
                            size={vs(18)}
                            color={colors.text}
                          />
                          <Text style={styles.googleButtonText}>
                            Continue with Google
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
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
  keyboardHeight: number,
) {
  const logoHeight = Math.max(screenHeight * 0.16, vs(72));
  const keyboardPadding =
    keyboardHeight > 0
      ? Platform.OS === "ios"
        ? vs(16)
        : Math.max(keyboardHeight - bottomInset + vs(16), vs(16))
      : 0;

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
      paddingBottom: Math.max(bottomInset, vs(16)) + keyboardPadding,
    },
    logoSection: {
      height: logoHeight,
      minHeight: vs(72),
      maxHeight: screenHeight * 0.22,
      alignItems: "center",
      justifyContent: "center",
    },
    brandLogoImage: {
      width: vs(220),
      height: vs(88),
      maxWidth: "70%",
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
    googleButton: {
      width: "100%",
      minHeight: vs(52),
      borderRadius: vs(14),
      borderWidth: 1.5,
      borderColor: isDark ? colors.chipBorder : colors.gray,
      backgroundColor: isDark ? colors.surfaceMuted : colors.white,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: vs(10),
      paddingHorizontal: vs(16),
    },
    googleButtonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
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
