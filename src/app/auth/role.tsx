import CustomButton from "@/components/CustomButton";
import GradientBackground from "@/components/GradientBackground";
import { type UserRole, USER_ROLES } from "@/types/role";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Images } from "@constants/images";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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

const ROLE_OPTIONS: UserRole[] = ["tenant", "business_owner"];

const ROLE_ICONS: Record<UserRole, keyof typeof Ionicons.glyphMap> = {
  tenant: "person-outline",
  business_owner: "business-outline",
};

export default function Role() {
  const { colors, fonts, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, height, insets.bottom, isDark),
    [colors, fonts, height, insets.bottom, isDark],
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>("tenant");

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push({
      pathname: "/auth/auth",
      params: { role: selectedRole },
    });
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

          <GradientBackground style={styles.cardSheet}>
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.cardContent}
            >
              <View style={styles.headerGroup}>
                <Text style={styles.welcomeText}>Get started</Text>
                <Text style={styles.titleText}>Choose your role</Text>
              </View>

              <Text style={styles.subtitle}>
                Select how you will use VAAS. You can switch later from
                settings.
              </Text>

              <View style={styles.roleList}>
                {ROLE_OPTIONS.map((role) => {
                  const isSelected = selectedRole === role;
                  const { label, description } = USER_ROLES[role];

                  return (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleCard,
                        isSelected && styles.roleCardSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedRole(role)}
                    >
                      <View
                        style={[
                          styles.iconWrap,
                          isSelected && styles.iconWrapSelected,
                        ]}
                      >
                        <Ionicons
                          name={ROLE_ICONS[role]}
                          size={vs(22)}
                          color={isSelected ? "#FFFFFF" : colors.primary}
                        />
                      </View>

                      <View style={styles.roleCardBody}>
                        <Text
                          style={[
                            styles.roleLabel,
                            isSelected && styles.roleLabelSelected,
                          ]}
                        >
                          {label}
                        </Text>
                        <Text style={styles.roleDescription}>
                          {description}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.checkWrap,
                          isSelected && styles.checkWrapSelected,
                        ]}
                      >
                        {isSelected ? (
                          <Ionicons
                            name="checkmark"
                            size={vs(16)}
                            color="#FFFFFF"
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.actionWrapper}>
                <CustomButton title="Continue" onPress={handleContinue} />
              </View>
            </ScrollView>
          </GradientBackground>
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
  isDark: boolean,
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
    },
    cardSheet: {
      flex: 1,
      borderTopLeftRadius: vs(32),
      borderTopRightRadius: vs(32),
      overflow: "hidden",
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.08,
      shadowRadius: 15,
      elevation: 20,
    },
    scroll: {
      flex: 1,
    },
    cardContent: {
      flexGrow: 1,
      paddingHorizontal: vs(16),
      paddingTop: vs(32),
      paddingBottom: Math.max(bottomInset + vs(12), vs(32)),
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
      marginBottom: vs(20),
    },
    roleList: {
      gap: vs(12),
      marginBottom: vs(24),
    },
    roleCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: vs(18),
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(255, 255, 255, 0.82)",
      borderWidth: 1.5,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(255, 255, 255, 0.9)",
      padding: vs(14),
      gap: vs(12),
    },
    roleCardSelected: {
      backgroundColor: colors.primary100,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    iconWrap: {
      width: vs(48),
      height: vs(48),
      borderRadius: vs(14),
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapSelected: {
      backgroundColor: colors.primary,
    },
    roleCardBody: {
      flex: 1,
    },
    roleLabel: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    roleLabelSelected: {
      color: colors.primary,
    },
    roleDescription: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(18),
    },
    checkWrap: {
      width: vs(24),
      height: vs(24),
      borderRadius: vs(12),
      borderWidth: 1.5,
      borderColor: colors.gray100,
      alignItems: "center",
      justifyContent: "center",
    },
    checkWrapSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionWrapper: {
      alignItems: "center",
      marginBottom: vs(24),
    },
    footerTerms: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(18),
      paddingHorizontal: vs(12),
      marginTop: vs(4),
    },
  });
}
