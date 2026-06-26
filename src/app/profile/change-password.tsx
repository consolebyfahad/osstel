import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import { useChangePasswordMutation } from "../../../store/api";
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
import Toast from "react-native-toast-message";

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

export default function ChangePasswordScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom, keyboardHeight),
    [colors, fonts, insets.bottom, keyboardHeight],
  );

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
        y: Math.max(0, y - vs(24)),
        animated: true,
      });
    };

    requestAnimationFrame(scroll);

    if (Platform.OS === "android") {
      setTimeout(scroll, 120);
    }
  }, []);

  const isValid =
    currentPassword.trim().length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword.length >= 6 &&
    newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;
    Keyboard.dismiss();

    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please re-enter your new password.");
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert(
        "Same password",
        "New password must be different from your current password.",
      );
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      }).unwrap();

      Toast.show({
        type: "success",
        text1: "Password updated",
        text2: "Your password has been changed.",
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Could not change password",
        getErrorMessage(error, "Please try again."),
      );
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <View style={styles.inner}>
            <ScreenHeader title="Change Password" showBack />

            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.description}>
                Enter your current password, then choose a new one. Use at least
                6 characters.
              </Text>

              <View
                onLayout={(event) =>
                  registerFieldPosition("current", event.nativeEvent.layout.y)
                }
              >
                <CustomInput
                  label="Current Password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  returnKeyType="next"
                  onFocus={() => scrollToField("current")}
                />
              </View>

              <View
                onLayout={(event) =>
                  registerFieldPosition("new", event.nativeEvent.layout.y)
                }
              >
                <CustomInput
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  hint="At least 6 characters"
                  returnKeyType="next"
                  onFocus={() => scrollToField("new")}
                />
              </View>

              <View
                onLayout={(event) =>
                  registerFieldPosition("confirm", event.nativeEvent.layout.y)
                }
              >
                <CustomInput
                  label="Confirm New Password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  onFocus={() => scrollToField("confirm")}
                />
              </View>

              <CustomButton
                title="Update Password"
                onPress={handleSubmit}
                disabled={!isValid}
                loading={isLoading}
              />
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
      paddingHorizontal: vs(20),
      paddingBottom: Math.max(bottomInset, vs(24)) + keyboardPadding,
    },
    description: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(20),
      lineHeight: vs(22),
    },
  });
}
