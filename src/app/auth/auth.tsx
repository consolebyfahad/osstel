import CustomButton from "@/components/CustomButton";
import GradientBackground from "@/components/GradientBackground";
import { isUserRole, USER_ROLES } from "@/types/role";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Images } from "@constants/images";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Auth() {
  const { colors, fonts, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, height, insets.bottom),
    [colors, fonts, height, insets.bottom],
  );
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!isUserRole(roleParam)) {
      router.replace("/auth/role");
    }
  }, [roleParam]);

  const role = isUserRole(roleParam) ? roleParam : null;
  const roleLabel = role ? USER_ROLES[role].label : "";

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  const handleLogin = () => {
    if (!role) return;
    if (phoneNumber.length < 9) {
      alert("Please enter a valid mobile number");
      return;
    }
    router.push({
      pathname: "/auth/otp",
      params: { phone: `+92${phoneNumber}`, role },
    });
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

              <GradientBackground style={styles.cardSheet}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.cardContent}
                >
                  <View style={styles.headerGroup}>
                    <Text style={styles.welcomeText}>Almost there</Text>
                    <Text style={styles.titleText}>Enter your number</Text>
                  </View>

                  <Text style={styles.subtitle}>
                    We&apos;ll send a 4-digit code to verify your mobile number.
                  </Text>

                  {roleLabel ? (
                    <View style={styles.roleChip}>
                      <Ionicons
                        name={
                          role === "tenant"
                            ? "person-outline"
                            : "business-outline"
                        }
                        size={vs(14)}
                        color={colors.primary}
                      />
                      <Text style={styles.roleChipText}>{roleLabel}</Text>
                    </View>
                  ) : null}

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.countryCodeContainer}>
                        <Text style={styles.flag}>🇵🇰</Text>
                        <Text style={styles.countryCode}>+92</Text>
                      </View>
                      <View style={styles.divider} />
                      <TextInput
                        style={styles.input}
                        placeholder="300 1234567"
                        placeholderTextColor={colors.gray100}
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={handlePhoneChange}
                        maxLength={10}
                        autoFocus
                      />
                    </View>
                  </View>

                  <View style={styles.actionWrapper}>
                    <CustomButton
                      title="Send Code"
                      onPress={handleLogin}
                      disabled={phoneNumber.length < 9}
                    />
                  </View>
                </ScrollView>
              </GradientBackground>
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
) {
  const logoHeight = Math.max(screenHeight * 0.2, vs(80));
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
      minHeight: vs(80),
      maxHeight: screenHeight * 0.28,
      alignItems: "center",
      justifyContent: "center",
    },
    brandLogo: {
      fontSize: FONT_SIZES.brand,
      fontFamily: FONTS.title,
      color: colors.text,
      letterSpacing: 3,
    },
    cardSheet: {
      flex: 0,
      borderTopLeftRadius: vs(32),
      borderTopRightRadius: vs(32),
      overflow: "hidden",
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.08,
      shadowRadius: 15,
      elevation: 20,
    },
    cardContent: {
      paddingHorizontal: vs(16),
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
      color: colors.gray200,
      lineHeight: vs(20),
      marginBottom: vs(16),
    },
    roleChip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      backgroundColor: colors.primary100,
      borderRadius: vs(20),
      paddingHorizontal: vs(12),
      paddingVertical: vs(6),
      marginBottom: vs(20),
    },
    roleChipText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    inputWrapper: {
      marginBottom: vs(24),
    },
    inputLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    phoneInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: vs(16),
      backgroundColor: colors.white,
      height: vs(56),
      paddingHorizontal: vs(14),
    },
    countryCodeContainer: {
      flexDirection: "row",
      alignItems: "center",
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
    input: {
      flex: 1,
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
      height: "100%",
    },
    actionWrapper: {
      alignItems: "center",
    },
  });
}
