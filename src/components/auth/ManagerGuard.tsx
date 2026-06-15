import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, type ReactNode } from "react";
import CustomLoading from "@/components/CustomLoading";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

type ManagerGuardProps = {
  children: ReactNode;
};

export default function ManagerGuard({ children }: ManagerGuardProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const isManager = user?.role === "manager";

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/signin");
      return;
    }

    if (!isManager) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, isManager]);

  if (!isAuthenticated || !isManager) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.center}>
          <CustomLoading size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

export function ManagerAccessDenied({
  title = "Managers only",
  description = "This section is available for hostel managers only.",
}: {
  title?: string;
  description?: string;
}) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={vs(36)} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Pressable style={styles.button} onPress={() => router.replace("/(tabs)/home")}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.white,
    },
  });
}
