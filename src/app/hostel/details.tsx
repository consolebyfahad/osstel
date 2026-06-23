import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import ScreenHeader from "@/components/ScreenHeader";
import { useCreateHostelMutation } from "../../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import { showSubscriptionBlocked } from "@/utils/subscriptionAlert";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function HostelDetailsScreen() {
  const [createHostel, { isLoading: isSaving }] = useCreateHostelMutation();
  const { checkAddHostel } = useSubscription();
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

  const isValid =
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    city.trim().length > 0;

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    const limitCheck = checkAddHostel();
    if (!limitCheck.allowed) {
      showSubscriptionBlocked(limitCheck.message);
      return;
    }

    Keyboard.dismiss();

    try {
      await createHostel({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        contactPhone: contactPhone.trim(),
      }).unwrap();

      router.back();
    } catch (error) {
      const err = error as {
        data?: { message?: string; errors?: { msg: string }[] } | string;
      };

      let message = "Could not create hostel. Please try again.";

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.inner}>
        <ScreenHeader title="Add Hostel" showBack />

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.subtitle}>
            Create a new hostel. This information appears on receipts and
            resident communications.
          </Text>

          <CustomInput
            label="Hostel Name"
            placeholder="e.g. Sunrise Hostel"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <CustomInput
            label="Address"
            placeholder="Street address"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="words"
          />

          <CustomInput
            label="City"
            placeholder="e.g. Lahore"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
          />

          <CustomInput
            label="Contact Phone"
            placeholder="e.g. +92421234567"
            maxLength={13}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <View style={styles.buttonWrap}>
            <CustomButton
              title={isSaving ? <CustomLoading size="sm" /> : "Create Hostel"}
              onPress={handleSave}
              disabled={!isValid || isSaving}
            />
          </View>
        </ScrollView>
      </View>
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
    inner: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingTop: vs(8),
      paddingBottom: Math.max(bottomInset, vs(24)),
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(22),
      marginBottom: vs(24),
    },
    buttonWrap: {
      marginTop: vs(8),
    },
  });
}
