import CustomButton from "@/components/CustomButton";
import { useCreateHostelRoomMutation } from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function AddRoom() {
  const { hostelId } = useLocalSearchParams<{ hostelId: string }>();
  const [createRoom, { isLoading: isSaving }] = useCreateHostelRoomMutation();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom),
    [colors, fonts, insets.bottom],
  );

  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [rent, setRent] = useState("");

  const isValid =
    roomNumber.trim().length > 0 &&
    Number(capacity) > 0 &&
    Number(rent) > 0;

  const handleSave = async () => {
    if (!isValid || isSaving || !hostelId) return;
    Keyboard.dismiss();

    try {
      await createRoom({
        hostelId,
        roomNumber: roomNumber.trim(),
        capacity: Number(capacity),
        rent: Number(rent),
      }).unwrap();
      router.back();
    } catch (error) {
      const err = error as {
        data?: { message?: string; errors?: { msg: string }[] } | string;
      };

      let message = "Could not save room. Please try again.";
      if (typeof err.data === "string") {
        message = err.data;
      } else if (err.data?.errors?.length) {
        message = err.data.errors.map((e) => e.msg).join("\n");
      } else if (err.data?.message) {
        message = err.data.message;
      }

      Alert.alert("Error", message);
    }
  };

  if (!hostelId) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Ionicons
                name="chevron-back"
                size={vs(24)}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Room</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.missingHostelWrap}>
            <Text style={styles.missingHostelText}>
              Open a hostel first, then add a room from there.
            </Text>
            <CustomButton
              title="Go to Hostels"
              onPress={() => router.replace("/(tabs)/hostels")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                hitSlop={12}
              >
                <Ionicons
                  name="chevron-back"
                  size={vs(24)}
                  color={colors.text}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Room</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.subtitle}>
                Enter room details to add it to your hostel.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Room Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 101, A-2"
                  placeholderTextColor={colors.gray100}
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Capacity (Beds)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2"
                  placeholderTextColor={colors.gray100}
                  value={capacity}
                  onChangeText={(text) =>
                    setCapacity(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Monthly Rent (Rs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15000"
                  placeholderTextColor={colors.gray100}
                  value={rent}
                  onChangeText={(text) => setRent(text.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={7}
                />
              </View>

              {rent ? (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Monthly rent</Text>
                  <Text style={styles.summaryValue}>
                    Rs {Number(rent).toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              <CustomButton
                title={isSaving ? "Saving..." : "Save Room"}
                onPress={handleSave}
                disabled={!isValid || isSaving}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  bottomInset: number,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    inner: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: vs(16),
      paddingVertical: vs(12),
    },
    backButton: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
    },
    headerSpacer: {
      width: vs(40),
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingTop: vs(8),
      paddingBottom: vs(24),
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(22),
      marginBottom: vs(24),
    },
    field: {
      marginBottom: vs(20),
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    input: {
      height: vs(52),
      borderRadius: vs(14),
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(16),
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    summaryCard: {
      backgroundColor: colors.primary100,
      borderRadius: vs(14),
      padding: vs(16),
      marginTop: vs(4),
    },
    summaryLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(4),
    },
    summaryValue: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    footer: {
      paddingHorizontal: vs(20),
      paddingTop: vs(12),
      paddingBottom: Math.max(bottomInset, vs(20)),
      borderTopWidth: 1,
      borderTopColor: colors.white100,
      backgroundColor: colors.background,
    },
    missingHostelWrap: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: vs(32),
      gap: vs(20),
    },
    missingHostelText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(22),
    },
  });
}
