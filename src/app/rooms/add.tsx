import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import ScreenHeader from "@/components/ScreenHeader";
import { useCreateHostelRoomMutation } from "../../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import { showSubscriptionBlocked } from "@/utils/subscriptionAlert";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { router, useLocalSearchParams } from "expo-router";
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

export default function AddRoom() {
  const { hostelId } = useLocalSearchParams<{ hostelId: string }>();
  const [createRoom, { isLoading: isSaving }] = useCreateHostelRoomMutation();
  const { checkAddRoom } = useSubscription();
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

    const limitCheck = checkAddRoom();
    if (!limitCheck.allowed) {
      showSubscriptionBlocked(limitCheck.message);
      return;
    }

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
          <ScreenHeader title="Add Room" showBack />
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
      <View style={styles.inner}>
        <ScreenHeader title="Add Room" showBack />

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
            Enter room details to add it to your hostel.
          </Text>

          <CustomInput
            label="Room Number"
            placeholder="e.g. 101, A-2"
            value={roomNumber}
            onChangeText={setRoomNumber}
            autoCapitalize="characters"
          />

          <CustomInput
            label="Capacity (Beds)"
            placeholder="e.g. 2"
            value={capacity}
            onChangeText={(text) => setCapacity(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={2}
          />

          <CustomInput
            label="Monthly Rent (Rs)"
            placeholder="e.g. 15000"
            value={rent}
            onChangeText={(text) => setRent(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={7}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          {rent ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Monthly rent</Text>
              <Text style={styles.summaryValue}>
                Rs {Number(rent).toLocaleString()}
              </Text>
            </View>
          ) : null}

          <View style={styles.buttonWrap}>
            <CustomButton
              title={isSaving ? <CustomLoading size="sm" /> : "Save Room"}
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
    summaryCard: {
      backgroundColor: colors.primary100,
      borderRadius: vs(14),
      padding: vs(16),
      marginBottom: vs(8),
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
    buttonWrap: {
      marginTop: vs(8),
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
