import CustomButton from "@/components/CustomButton";
import { addRoom } from "@/services/rooms";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom),
    [colors, fonts, insets.bottom],
  );

  const [roomNumber, setRoomNumber] = useState("");
  const [totalBeds, setTotalBeds] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isValid =
    roomNumber.trim().length > 0 &&
    Number(totalBeds) > 0 &&
    Number(monthlyRent) > 0;

  const handleSave = async () => {
    if (!isValid || isSaving) return;
    Keyboard.dismiss();
    setIsSaving(true);

    try {
      await addRoom({
        roomNumber: roomNumber.trim(),
        totalBeds: Number(totalBeds),
        monthlyRentPerBed: Number(monthlyRent),
      });
      router.back();
    } catch {
      Alert.alert("Error", "Could not save room. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
                <Text style={styles.label}>Total Beds</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 4"
                  placeholderTextColor={colors.gray100}
                  value={totalBeds}
                  onChangeText={(text) =>
                    setTotalBeds(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Monthly Rent per Bed (Rs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 8000"
                  placeholderTextColor={colors.gray100}
                  value={monthlyRent}
                  onChangeText={(text) =>
                    setMonthlyRent(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={7}
                />
              </View>

              {totalBeds && monthlyRent ? (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total monthly rent</Text>
                  <Text style={styles.summaryValue}>
                    Rs{" "}
                    {(
                      Number(totalBeds) * Number(monthlyRent)
                    ).toLocaleString()}
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
  });
}
