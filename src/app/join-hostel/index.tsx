import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import { useHostelConnection } from "@/hooks/useHostelConnection";
import { useJoinHostelMutation } from "../../../store/api";
import { getApiErrorMessage } from "@/utils/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatHostelCodeInput(value: string) {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (cleaned.startsWith("OSS")) {
    return cleaned.slice(0, 8);
  }
  if (cleaned.length <= 3) {
    return cleaned;
  }
  return `OSS-${cleaned.replace(/^OSS-?/, "").slice(0, 4)}`;
}

export default function JoinHostelScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const { isConnected, isPending, pendingJoinRequest } = useHostelConnection();
  const [hostelCode, setHostelCode] = useState("");
  const [joinHostel, { isLoading }] = useJoinHostelMutation();

  const handleSubmit = async () => {
    const code = hostelCode.trim().toUpperCase();
    if (!/^OSS-[A-Z0-9]{4}$/.test(code)) {
      Alert.alert("Invalid code", "Enter a valid hostel code like OSS-A7K9.");
      return;
    }

    try {
      const result = await joinHostel({ hostelCode: code }).unwrap();
      Alert.alert(
        "Request sent",
        `Your request to join ${result.joinRequest.hostel.name} is pending manager approval.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
      setHostelCode("");
    } catch (error) {
      Alert.alert("Could not join hostel", getApiErrorMessage(error) || "Please try again.");
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Join Hostel" showBack />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isConnected ? (
              <Text style={styles.infoText}>
                You are already connected to a hostel.
              </Text>
            ) : isPending && pendingJoinRequest ? (
              <View style={styles.pendingCard}>
                <Ionicons name="time-outline" size={vs(32)} color={colors.warning} />
                <Text style={styles.pendingTitle}>Approval pending</Text>
                <Text style={styles.pendingText}>
                  Your request to join {pendingJoinRequest.hostel.name} (
                  {pendingJoinRequest.hostel.hostelCode}) is waiting for manager
                  approval.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.intro}>
                  Ask your hostel manager for the hostel code, then enter it below.
                  Your phone number must already be registered by the manager.
                </Text>

                <CustomInput
                  label="Hostel Code"
                  placeholder="OSS-A7K9"
                  value={hostelCode}
                  onChangeText={(text) => setHostelCode(formatHostelCodeInput(text))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                />

                <CustomButton
                  title="Submit Join Request"
                  onPress={handleSubmit}
                  loading={isLoading}
                  disabled={hostelCode.length < 8}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    flex: { flex: 1 },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    intro: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
      marginBottom: vs(20),
    },
    infoText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    pendingCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(24),
      alignItems: "center",
      gap: vs(12),
    },
    pendingTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    pendingText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(20),
    },
  });
}
