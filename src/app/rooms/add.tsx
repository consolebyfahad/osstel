import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import BedCountDropdown, { type BedCount } from "@/components/BedCountDropdown";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import { useCreateHostelRoomMutation } from "../../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import { showSubscriptionBlocked } from "@/utils/subscriptionAlert";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom, keyboardHeight),
    [colors, fonts, insets.bottom, keyboardHeight],
  );

  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState<BedCount | null>(null);
  const [rent, setRent] = useState("");

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const registerFieldPosition = useCallback((key: string, y: number) => {
    fieldPositions.current[key] = y;
  }, []);

  const scrollToField = useCallback((key: string) => {
    const y = fieldPositions.current[key];
    if (y === undefined) return;

    const scroll = () => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - vs(20)),
        animated: true,
      });
    };

    requestAnimationFrame(scroll);

    if (Platform.OS === "android") {
      setTimeout(scroll, 120);
    }
  }, []);

  const isValid =
    roomNumber.trim().length > 0 &&
    capacity !== null &&
    capacity > 0 &&
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
        capacity,
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
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <View style={styles.inner}>
            <ScreenHeader title="Add Room" showBack />

            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.subtitle}>
                Enter room details to add it to your hostel.
              </Text>

              <View
                onLayout={(event) =>
                  registerFieldPosition("roomNumber", event.nativeEvent.layout.y)
                }
              >
                <CustomInput
                  label="Room Number"
                  placeholder="e.g. 101, A-2"
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                  autoCapitalize="characters"
                  onFocus={() => scrollToField("roomNumber")}
                />
              </View>

              <BedCountDropdown
                value={capacity}
                onChange={setCapacity}
              />

              <View
                onLayout={(event) =>
                  registerFieldPosition("rent", event.nativeEvent.layout.y)
                }
              >
                <CustomInput
                  label="Monthly Rent (Rs)"
                  placeholder="e.g. 15000"
                  value={rent}
                  onChangeText={(text) => setRent(text.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={7}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  onFocus={() => scrollToField("rent")}
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

              <View style={styles.buttonWrap}>
                <CustomButton
                  title="Save Room"
                  onPress={handleSave}
                  disabled={!isValid || isSaving}
                  loading={isSaving}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  bottomInset: number,
  keyboardHeight: number,
) {
  const keyboardPadding =
    keyboardHeight > 0
      ? Platform.OS === "ios"
        ? vs(16)
        : Math.max(keyboardHeight - bottomInset + vs(16), vs(16))
      : 0;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    keyboardView: {
      flex: 1,
    },
    inner: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: vs(20),
      paddingTop: vs(8),
      paddingBottom: Math.max(bottomInset, vs(24)) + keyboardPadding,
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
