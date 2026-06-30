import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, type ReactNode } from "react";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

type ResidentGuardProps = {
  children: ReactNode;
  requireConnection?: boolean;
};

export default function ResidentGuard({
  children,
  requireConnection = false,
}: ResidentGuardProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const isResident = user?.role === "resident";
  const isConnected = user?.hostelConnectionStatus === "active";

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/signin");
      return;
    }

    if (!isResident) {
      router.replace("/(tabs)/home");
      return;
    }

    if (requireConnection && !isConnected) {
      router.replace("/join-hostel");
    }
  }, [isAuthenticated, isResident, requireConnection, isConnected]);

  if (!isAuthenticated || !isResident) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.center}>
            <CustomLoading size="lg" />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (requireConnection && !isConnected) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.center}>
            <Ionicons name="home-outline" size={vs(36)} color={colors.primary} />
            <Text style={styles.title}>No active hostel</Text>
            <Text style={styles.description}>
              Join a hostel before using this feature.
            </Text>
            <Pressable
              style={styles.button}
              onPress={() => router.replace("/join-hostel")}
            >
              <Text style={styles.buttonText}>Join Hostel</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return <>{children}</>;
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(32),
      gap: vs(12),
    },
    title: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
    },
    description: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(22),
    },
    button: {
      marginTop: vs(8),
      backgroundColor: colors.primary,
      paddingHorizontal: vs(20),
      paddingVertical: vs(12),
      borderRadius: vs(12),
    },
    buttonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.onPrimary,
    },
  });
}
