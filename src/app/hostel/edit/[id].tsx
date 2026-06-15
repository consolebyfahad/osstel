import CustomButton from "@/components/CustomButton";
import {
  useDeleteHostelMutation,
  useGetHostelQuery,
  useUpdateHostelMutation,
} from "../../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    data?: { message?: string; errors?: { msg: string }[] } | string;
  };

  if (typeof err.data === "string") return err.data;
  if (err.data?.errors?.length) {
    return err.data.errors.map((e) => e.msg).join("\n");
  }
  if (err.data?.message) return err.data.message;
  return fallback;
}

export default function EditHostelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useGetHostelQuery(id!, { skip: !id });
  const [updateHostel, { isLoading: isSaving }] = useUpdateHostelMutation();
  const [deleteHostel, { isLoading: isDeleting }] = useDeleteHostelMutation();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom),
    [colors, fonts, insets.bottom],
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (!data?.hostel) return;
    setName(data.hostel.name);
    setAddress(data.hostel.address);
    setCity(data.hostel.city);
    setContactPhone(data.hostel.contactPhone ?? "");
  }, [data?.hostel]);

  const isValid =
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    city.trim().length > 0;

  const isBusy = isSaving || isDeleting;

  const handleSave = async () => {
    if (!isValid || isBusy || !id) return;
    Keyboard.dismiss();

    try {
      await updateHostel({
        hostelId: id,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        contactPhone: contactPhone.trim(),
      }).unwrap();
      router.back();
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Could not update hostel."));
    }
  };

  const handleDelete = () => {
    if (!id || isBusy) return;

    Alert.alert(
      "Delete hostel",
      "This will permanently remove the hostel and all related data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHostel(id).unwrap();
              router.replace("/(tabs)/hostels");
            } catch (error) {
              Alert.alert(
                "Error",
                getErrorMessage(error, "Could not delete hostel."),
              );
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <CustomLoading size="lg" />
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
              <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Ionicons
                  name="chevron-back"
                  size={vs(24)}
                  color={colors.text}
                />
              </Pressable>
              <Text style={styles.headerTitle}>Edit Hostel</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.subtitle}>
                Update hostel details shown to residents and on receipts.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Hostel Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sunrise Hostel"
                  placeholderTextColor={colors.gray100}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street address"
                  placeholderTextColor={colors.gray100}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Lahore"
                  placeholderTextColor={colors.gray100}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 03001234567"
                  placeholderTextColor={colors.gray100}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <Pressable
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={isBusy}
              >
                <Text style={styles.deleteBtnText}>
                  {isDeleting ? "Deleting..." : "Delete Hostel"}
                </Text>
              </Pressable>
            </ScrollView>

            <View style={styles.footer}>
              <CustomButton
                title={isSaving ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                disabled={!isValid || isBusy}
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
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
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
    deleteBtn: {
      marginTop: vs(12),
      paddingVertical: vs(14),
      alignItems: "center",
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.error,
    },
    deleteBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.error,
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
