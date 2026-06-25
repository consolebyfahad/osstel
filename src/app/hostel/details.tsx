import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import { useCreateHostelMutation } from "../../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import { showSubscriptionBlocked } from "@/utils/subscriptionAlert";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { router } from "expo-router";
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

export default function HostelDetailsScreen() {
  const [createHostel, { isLoading: isSaving }] = useCreateHostelMutation();
  const { checkAddHostel } = useSubscription();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom, keyboardHeight),
    [colors, fonts, insets.bottom, keyboardHeight],
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [contactPhone, setContactPhone] = useState("");

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
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={styles.inner}>
          <ScreenHeader title="Add Hostel" showBack />

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.subtitle}>
              Create a new hostel. This information appears on receipts and
              resident communications.
            </Text>

            <View
              onLayout={(event) =>
                registerFieldPosition("name", event.nativeEvent.layout.y)
              }
            >
              <CustomInput
                label="Hostel Name"
                placeholder="e.g. Sunrise Hostel"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                onFocus={() => scrollToField("name")}
              />
            </View>

            <View
              onLayout={(event) =>
                registerFieldPosition("address", event.nativeEvent.layout.y)
              }
            >
              <CustomInput
                label="Address"
                placeholder="Street address"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
                onFocus={() => scrollToField("address")}
              />
            </View>

            <View
              onLayout={(event) =>
                registerFieldPosition("city", event.nativeEvent.layout.y)
              }
            >
              <CustomInput
                label="City"
                placeholder="e.g. Lahore"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
                onFocus={() => scrollToField("city")}
              />
            </View>

            <View
              onLayout={(event) =>
                registerFieldPosition("contactPhone", event.nativeEvent.layout.y)
              }
            >
              <CustomInput
                label="Contact Phone"
                placeholder="e.g. +92421234567"
                maxLength={13}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                onFocus={() => scrollToField("contactPhone")}
              />
            </View>

            <View style={styles.buttonWrap}>
              <CustomButton
                title={isSaving ? <CustomLoading size="sm" /> : "Create Hostel"}
                onPress={handleSave}
                disabled={!isValid || isSaving}
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
    buttonWrap: {
      marginTop: vs(8),
    },
  });
}
