import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import GradientBackground from "@/components/GradientBackground";
import HostelDropdown from "@/components/HostelDropdown";
import ImageUploadField, {
  type UploadedImageValue,
} from "@/components/ImageUploadField";
import ScreenHeader from "@/components/ScreenHeader";
import type { Hostel } from "@/types/hostel";
import {
  getImageTooLargeMessage,
  prepareImageForUpload,
} from "@/utils/imageUpload";
import {
  useCreateExpenseMutation,
  useGetHostelsQuery,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const EMPTY_IMAGE: UploadedImageValue = {
  localUri: null,
  uploadValue: null,
};

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    data?: { message?: string; errors?: { msg: string }[] } | string;
  };
  if (typeof err.data === "string") return err.data;
  if (err.data?.errors?.length) return err.data.errors.map((e) => e.msg).join("\n");
  if (err.data?.message) return err.data.message;
  return fallback;
}

export default function AddExpenseScreen() {
  const { hostelId: presetHostelId } = useLocalSearchParams<{
    hostelId?: string;
  }>();
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark, insets.bottom),
    [colors, fonts, isDark, insets.bottom],
  );

  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptImage, setReceiptImage] =
    useState<UploadedImageValue>(EMPTY_IMAGE);

  const { data: hostelsData } = useGetHostelsQuery(undefined);
  const [createExpense, { isLoading: isSaving }] = useCreateExpenseMutation();

  const hostelOptions = useMemo(
    () =>
      (hostelsData?.hostels ?? []).map((hostel: Hostel) => ({
        id: hostel._id,
        name: hostel.name,
      })),
    [hostelsData?.hostels],
  );

  useEffect(() => {
    if (hostelOptions.length === 0) return;

    const presetExists =
      presetHostelId &&
      hostelOptions.some((hostel) => hostel.id === presetHostelId);

    if (presetExists) {
      setSelectedHostelId(presetHostelId!);
      return;
    }

    const exists = hostelOptions.some(
      (hostel) => hostel.id === selectedHostelId,
    );
    if (!selectedHostelId || !exists) {
      setSelectedHostelId(hostelOptions[0].id);
    }
  }, [hostelOptions, presetHostelId, selectedHostelId]);

  const parsedAmount = Number(amount);
  const canSubmit =
    title.trim().length > 0 &&
    selectedHostelId.length > 0 &&
    parsedAmount > 0 &&
    !isSaving;

  const handleSave = async () => {
    if (!canSubmit) return;
    Keyboard.dismiss();

    try {
      let imageValue: string | undefined;
      if (receiptImage.localUri) {
        const prepared = await prepareImageForUpload(
          receiptImage.localUri,
          "document",
        );
        imageValue = prepared?.uploadValue;
      } else if (receiptImage.uploadValue) {
        imageValue = receiptImage.uploadValue;
      }

      await createExpense({
        hostelId: selectedHostelId,
        title: title.trim(),
        details: details.trim() || undefined,
        amount: parsedAmount,
        ...(imageValue ? { image: imageValue } : {}),
      }).unwrap();

      Toast.show({
        type: "success",
        text1: "Expense added",
        text2: "It will appear in your monthly report.",
      });
      router.replace("/expenses");
    } catch (error) {
      const err = error as { status?: number };
      let message = getErrorMessage(error, "Could not save expense.");
      if (err.status === 413) {
        message = getImageTooLargeMessage();
      }
      Alert.alert("Error", message);
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScreenHeader title="Add Expense" showBack />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoCard}>
              <Ionicons
                name="construct-outline"
                size={vs(24)}
                color={colors.primary}
              />
              <Text style={styles.infoTitle}>Record a payment</Text>
              <Text style={styles.infoText}>
                Add repairs, supplies, or other hostel costs with a receipt photo.
              </Text>
            </View>

            <View style={styles.dropdownWrap}>
              <HostelDropdown
                hostels={hostelOptions}
                value={selectedHostelId}
                onChange={setSelectedHostelId}
                showAllOption={false}
              />
            </View>

            <Text style={styles.sectionTitle}>Expense details</Text>
            <View style={styles.formCard}>
              <CustomInput
                label="Title"
                placeholder="e.g. Bath tap repair"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
              />

              <Text style={styles.label}>Details</Text>
              <TextInput
                style={styles.textArea}
                value={details}
                onChangeText={setDetails}
                placeholder="What was repaired or purchased?"
                placeholderTextColor={colors.gray200}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />

              <CustomInput
                label="Amount (Rs)"
                placeholder="e.g. 2500"
                value={amount}
                onChangeText={(text) =>
                  setAmount(text.replace(/[^0-9]/g, "").slice(0, 8))
                }
                keyboardType="number-pad"
              />

              <ImageUploadField
                label="Receipt / Photo"
                hint="Optional"
                value={receiptImage}
                onChange={setReceiptImage}
                preset="document"
                aspect={[4, 3]}
              />

              <CustomButton
                title="Save Expense"
                onPress={handleSave}
                disabled={!canSubmit}
                loading={isSaving}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
  bottomInset: number,
) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    flex: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: Math.max(bottomInset, vs(24)),
    },
    infoCard: {
      backgroundColor: colors.primary100,
      borderRadius: vs(16),
      padding: vs(18),
      alignItems: "center",
      marginBottom: vs(20),
      borderWidth: 1,
      borderColor: colors.primary200,
    },
    infoTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: vs(10),
      marginBottom: vs(6),
    },
    infoText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(20),
    },
    dropdownWrap: { marginBottom: vs(8) },
    sectionTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: vs(10),
      marginLeft: vs(4),
    },
    formCard: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(16),
    },
    label: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    textArea: {
      minHeight: vs(100),
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white100,
      backgroundColor: colors.white100,
      padding: vs(12),
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: vs(16),
    },
  });
}
