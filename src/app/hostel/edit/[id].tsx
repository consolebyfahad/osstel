import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import {
  useDeleteHostelMutation,
  useGetHostelQuery,
  useUpdateHostelMutation,
} from "../../../../store/api";
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark, insets.bottom, keyboardHeight),
    [colors, fonts, isDark, insets.bottom, keyboardHeight],
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
      <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <CustomLoading size="lg" />
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
          <ScreenHeader title="Edit Hostel" showBack />

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.subtitle}>
              Update hostel details shown to residents and on receipts.
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
                placeholder="e.g. 03001234567"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                onFocus={() => scrollToField("contactPhone")}
              />
            </View>

            <View style={styles.actions}>
              <CustomButton
                title={
                  isSaving ? <CustomLoading size="sm" /> : "Save Changes"
                }
                onPress={handleSave}
                disabled={!isValid || isBusy}
              />
              <CustomButton
                title={isDeleting ? "Deleting..." : "Delete Hostel"}
                onPress={handleDelete}
                disabled={isBusy}
                style={styles.deleteBtn}
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
  isDark: boolean,
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
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
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
    actions: {
      marginTop: vs(8),
      gap: vs(12),
    },
    deleteBtn: {
      backgroundColor: colors.error,
    },
  });
}
