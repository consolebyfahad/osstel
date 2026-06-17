import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import GradientBackground from "@/components/GradientBackground";
import { meToAuthProfile, toAuthUser } from "@/types/auth";
import { type UserRole, USER_ROLES } from "@/types/role";
import {
  useLazyGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
} from "../../../store/api";
import { setUser, updateUser } from "../../../store/reducers/authSlice";
import type { AppDispatch } from "../../../store/store";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Images } from "@constants/images";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Keyboard,
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
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [fetchMe] = useLazyGetMeQuery();
  const { colors, fonts, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const styles = useMemo(
    () =>
      createStyles(colors, fonts, height, insets.bottom, isDark, keyboardOpen),
    [colors, fonts, height, insets.bottom, isDark, keyboardOpen],
  );

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("resident");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSubmitting = isLoginLoading || isRegisterLoading;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardOpen(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardOpen(false),
    );

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
        dispatch(setUser(toAuthUser(result)));
      } else {
        const result = await login(
          isResidentRole
            ? { userId: userId.trim(), password }
            : { phone, password, role: selectedRole },
        ).unwrap();
        dispatch(setUser(toAuthUser(result)));
      }

      try {
        const me = await fetchMe(undefined).unwrap();
        dispatch(updateUser(meToAuthProfile(me.user)));
      } catch {
        // Profile sync is optional immediately after auth
      }

      if (router.canDismiss()) router.dismissAll();
      router.replace("/(tabs)/home");
    } catch (error) {
      console.log(error);
      const err = error as {
        data?:
          | {
              message?: string;
              errors?: { msg: string }[];
            }
          | string;
      };

      let message = isSignUp ? "Registration failed." : "Login failed.";

      if (typeof err.data === "string") {
        message = err.data;
      } else if (err.data?.errors?.length) {
        message = err.data.errors.map((e) => e.msg).join("\n");
      } else if (err.data?.message) {
        message = err.data.message;
      }

      alert(message);
    }
  };

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
        {isDark ? <View style={styles.darkOverlay} /> : null}
      </ImageBackground>

      <View
        pointerEvents="none"
        style={[styles.bottomFill, { backgroundColor: colors.gradientBg[1] }]}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.containerInner}>
          {!keyboardOpen ? (
            <View style={styles.logoSection}>
              <Image
                source={Images.osstellogo}
                style={styles.brandLogoImage}
                resizeMode="contain"
                accessibilityLabel="OSSTEL logo"
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
                  ? "Register to manage your hostel with OSSTEL."
                  : selectedRole === "resident"
                    ? "Sign in with your user ID and password."
                    : "Sign in with your phone number and password."}
              </Text>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              contentInsetAdjustmentBehavior="automatic"
            >
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
                        color={isSelected ? "#FFFFFF" : colors.primary}
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
                />
              ) : (
                <CustomInput
                  label="Mobile Number"
                  placeholder="300 1234567"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={10}
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
            </ScrollView>
          </GradientBackground>
        </View>
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
    darkOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
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
    containerInner: {
      flex: 1,
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
      flex: 1,
      borderTopLeftRadius: vs(32),
      borderTopRightRadius: vs(32),
      overflow: "hidden",
    },
    cardHeader: {
      paddingHorizontal: vs(16),
      paddingTop: keyboardOpen ? vs(16) : vs(28),
      paddingBottom: vs(12),
    },
    formScroll: {
      flex: 1,
    },
    formContent: {
      paddingHorizontal: vs(16),
      paddingBottom: Math.max(bottomInset, vs(16)) + vs(8),
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
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : colors.background,
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : colors.background,
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
      color: "#FFFFFF",
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
