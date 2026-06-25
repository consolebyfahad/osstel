import CustomButton from "@/components/CustomButton";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import ProfileAvatar from "@/components/ProfileAvatar";
import { meToAuthProfile, toIsoDateString } from "@/types/auth";
import {
  formatCnic,
  getCnicDigits,
  isCompleteCnic,
  CNIC_FORMATTED_LENGTH,
} from "@/utils/cnic";
import {
  getImageTooLargeMessage,
  pickImageFromLibrary,
  prepareImageForUpload,
} from "@/utils/imageUpload";
import { useGetMeQuery, useUpdateMeMutation } from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../../../store/reducers/authSlice";
import type { AppDispatch, RootState } from "../../../store/store";

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    status?: number;
    data?: { message?: string; errors?: { msg: string }[] } | string;
  };

  if (err.status === 413) return getImageTooLargeMessage();
  if (typeof err.data === "string") return err.data;
  if (err.data?.errors?.length) {
    return err.data.errors.map((e) => e.msg).join("\n");
  }
  if (err.data?.message) return err.data.message;
  return fallback;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseDateOfBirth(value?: string) {
  if (!value) return new Date(1995, 0, 1);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(1995, 0, 1) : parsed;
}

export default function EditProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { colors, fonts } = useTheme();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom, keyboardHeight),
    [colors, fonts, insets.bottom, keyboardHeight],
  );
  const authUser = useSelector((state: RootState) => state.auth.user);

  const { data: meData, isLoading } = useGetMeQuery();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cnic, setCnic] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateDraft, setDateDraft] = useState(new Date(1995, 0, 1));
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fieldPositions = useRef<Record<string, number>>({});

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
    const user = meData?.user;
    if (!user) return;

    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setAddress(user.address ?? "");
    setCnic(formatCnic(user.cnic ?? ""));
    setDateOfBirth(
      user.dateOfBirth ? parseDateOfBirth(user.dateOfBirth) : null,
    );
    setProfileImage(user.profileImage ?? null);
    setLocalImageUri(null);
  }, [meData?.user]);

  const displayImage = localImageUri ?? profileImage;
  const phone = meData?.user.phone ?? authUser?.phone ?? "";

  const isValid =
    name.trim().length > 0 && (!email.trim() || isValidEmail(email.trim()));

  const handlePickImage = async () => {
    setIsProcessingImage(true);

    try {
      const picked = await pickImageFromLibrary({
        preset: "avatar",
        allowsEditing: true,
        aspect: [1, 1],
        permissionMessage:
          "Allow photo library access to update your profile picture.",
      });

      if (!picked) return;

      setLocalImageUri(picked.localUri);
      setProfileImage(picked.uploadValue);
    } catch {
      Alert.alert("Error", "Could not process the selected photo.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleOpenDatePicker = () => {
    setDateDraft(dateOfBirth ?? new Date(1995, 0, 1));
    setShowDatePicker(true);
  };

  const handleDateDraftChange = (
    _event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    if (selected) {
      setDateDraft(selected);
    }
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleDateDone = () => {
    setDateOfBirth(dateDraft);
    setShowDatePicker(false);
  };

  const handleCnicChange = (value: string) => {
    setCnic(formatCnic(value));
  };

  const handleSave = async () => {
    if (!isValid || isSaving) return;
    Keyboard.dismiss();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedAddress = address.trim();
    const trimmedCnic = cnic.trim();
    const cnicDigits = getCnicDigits(trimmedCnic);

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (cnicDigits.length > 0 && !isCompleteCnic(trimmedCnic)) {
      Alert.alert("Invalid CNIC", "CNIC must be 13 digits (XXXXX-XXXXXXX-X).");
      return;
    }

    try {
      let imagePayload: string | undefined;

      if (localImageUri) {
        const prepared = await prepareImageForUpload(localImageUri, "avatar");
        if (!prepared) {
          Alert.alert("Image too large", getImageTooLargeMessage());
          return;
        }
        imagePayload = prepared.uploadValue;
      }

      const result = await updateMe({
        name: trimmedName,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        ...(trimmedAddress ? { address: trimmedAddress } : {}),
        ...(cnicDigits.length === 13 ? { cnic: formatCnic(cnicDigits) } : {}),
        ...(dateOfBirth ? { dateOfBirth: toIsoDateString(dateOfBirth) } : {}),
        ...(imagePayload ? { profileImage: imagePayload } : {}),
      }).unwrap();

      dispatch(updateUser(meToAuthProfile(result.user)));
      Toast.show({
        type: "success",
        text1: "Profile updated",
        text2: "Your changes have been saved.",
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Update failed",
        getErrorMessage(error, "Could not update profile."),
      );
    }
  };

  if (isLoading && !meData) {
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <View style={styles.inner}>
            <ScreenHeader title="Edit Profile" showBack />

            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.scrollContent}
            >
              <ProfileAvatar
                name={name || "User"}
                phone={phone}
                imageUri={displayImage}
                editable={!isProcessingImage}
                onPress={handlePickImage}
              />

              {isProcessingImage ? (
                <CustomLoading size="sm" style={styles.imageLoader} />
              ) : null}

              <Text style={styles.avatarHint}>Tap to change profile photo</Text>

              <View
                style={styles.field}
                onLayout={(event) =>
                  registerFieldPosition("name", event.nativeEvent.layout.y)
                }
              >
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.gray100}
                  value={name}
                  onChangeText={setName}
                  maxLength={60}
                  onFocus={() => scrollToField("name")}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{phone || "—"}</Text>
                  <Ionicons
                    name="lock-closed-outline"
                    size={vs(16)}
                    color={colors.gray200}
                  />
                </View>
                <Text style={styles.hint}>
                  Phone number cannot be changed here.
                </Text>
              </View>

              <View
                style={styles.field}
                onLayout={(event) =>
                  registerFieldPosition("email", event.nativeEvent.layout.y)
                }
              >
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.gray100}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => scrollToField("email")}
                />
              </View>

              <View
                style={styles.field}
                onLayout={(event) =>
                  registerFieldPosition("address", event.nativeEvent.layout.y)
                }
              >
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Street, area, city"
                  placeholderTextColor={colors.gray100}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  onFocus={() => scrollToField("address")}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Date of Birth</Text>
                <Pressable
                  style={styles.dateInput}
                  onPress={handleOpenDatePicker}
                >
                  <Text
                    style={[
                      styles.dateText,
                      !dateOfBirth && styles.placeholderText,
                    ]}
                  >
                    {dateOfBirth
                      ? dateOfBirth.toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Select date of birth"}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={vs(20)}
                    color={colors.primary}
                  />
                </Pressable>
                {dateOfBirth ? (
                  <Pressable onPress={() => setDateOfBirth(null)}>
                    <Text style={styles.clearDateText}>Clear date</Text>
                  </Pressable>
                ) : null}
              </View>

              <View
                style={styles.field}
                onLayout={(event) =>
                  registerFieldPosition("cnic", event.nativeEvent.layout.y)
                }
              >
                <Text style={styles.label}>CNIC</Text>
                <TextInput
                  style={styles.input}
                  placeholder="35201-1234567-1"
                  placeholderTextColor={colors.gray100}
                  value={cnic}
                  onChangeText={handleCnicChange}
                  keyboardType="number-pad"
                  maxLength={CNIC_FORMATTED_LENGTH}
                  onFocus={() => scrollToField("cnic")}
                />
                <Text style={styles.hint}>Format: 35201-1234567-1</Text>
              </View>

              <View style={styles.footer}>
                <CustomButton
                  title={isSaving ? "Saving..." : "Save Changes"}
                  onPress={handleSave}
                  disabled={!isValid || isSaving || isProcessingImage}
                />
              </View>
            </ScrollView>

            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={handleDateCancel}
            >
              <Pressable
                style={styles.dateModalOverlay}
                onPress={handleDateCancel}
              >
                <Pressable style={styles.dateModalSheet} onPress={() => {}}>
                  <View style={styles.dateModalHeader}>
                    <Pressable
                      style={styles.dateModalAction}
                      onPress={handleDateCancel}
                    >
                      <Text style={styles.dateModalCancel}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.dateModalTitle}>Date of Birth</Text>
                    <Pressable
                      style={styles.dateModalAction}
                      onPress={handleDateDone}
                    >
                      <Text style={styles.dateModalDone}>Done</Text>
                    </Pressable>
                  </View>

                  <View style={styles.datePickerWrap}>
                    <DateTimePicker
                      value={dateDraft}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      onChange={handleDateDraftChange}
                      textColor={colors.text}
                      style={styles.datePicker}
                    />
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: vs(20),
      paddingTop: vs(8),
      paddingBottom: Math.max(bottomInset, vs(20)) + keyboardPadding,
    },
    avatarHint: {
      textAlign: "center",
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginTop: vs(-8),
      marginBottom: vs(24),
    },
    imageLoader: {
      marginTop: vs(-12),
      marginBottom: vs(8),
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
      minHeight: vs(52),
      borderRadius: vs(14),
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(16),
      paddingVertical: vs(14),
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    multilineInput: {
      minHeight: vs(88),
      textAlignVertical: "top",
    },
    readOnlyInput: {
      minHeight: vs(52),
      borderRadius: vs(14),
      backgroundColor: colors.white100,
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    readOnlyText: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    hint: {
      marginTop: vs(6),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    dateInput: {
      minHeight: vs(52),
      borderRadius: vs(14),
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateText: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    placeholderText: {
      color: colors.gray100,
    },
    clearDateText: {
      marginTop: vs(8),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    dateModalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    dateModalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: vs(20),
      borderTopRightRadius: vs(20),
      paddingBottom: vs(24),
    },
    dateModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: vs(16),
      paddingTop: vs(16),
      paddingBottom: vs(8),
      borderBottomWidth: 1,
      borderBottomColor: colors.white100,
    },
    dateModalAction: {
      minWidth: vs(72),
      paddingVertical: vs(8),
    },
    dateModalCancel: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.gray200,
      textAlign: "left",
    },
    dateModalTitle: {
      flex: 1,
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
      textAlign: "center",
    },
    dateModalDone: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      textAlign: "right",
    },
    datePickerWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: vs(12),
    },
    datePicker: {
      width: "100%",
      height: Platform.OS === "ios" ? vs(216) : vs(180),
    },
    footer: {
      marginTop: vs(8),
      paddingTop: vs(12),
    },
  });
}
