import CustomButton from "@/components/CustomButton";
import ImageUploadField, {
  type UploadedImageValue,
} from "@/components/ImageUploadField";
import ResidentCredentialsModal from "@/components/ResidentCredentialsModal";
import RoomDropdown from "@/components/RoomDropdown";
import type { Resident, ResidentLoginCredentials } from "@/types/resident";
import type { Room, RoomsResponse } from "@/types/room";
import type { Hostel } from "@/types/hostel";
import { buildVacancyMap, filterVacantRooms } from "@/utils/room";
import {
  getImageTooLargeMessage,
  prepareImageForUpload,
  type ImageUploadPreset,
} from "@/utils/imageUpload";
import {
  CNIC_FORMATTED_LENGTH,
  formatCnic,
  getCnicDigits,
  isEmptyOrCompleteCnic,
} from "@/utils/cnic";
import {
  useCreateResidentMutation,
  useGetHostelsQuery,
  useLazyGetHostelRoomsQuery,
  useLazyGetResidentsQuery,
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
  Pressable,
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

function formatPhoneForApi(digits: string) {
  if (digits.startsWith("0")) return digits;
  return `0${digits}`;
}

const EMPTY_IMAGE: UploadedImageValue = {
  localUri: null,
  uploadValue: null,
};

async function resolveImageUpload(
  image: UploadedImageValue,
  preset: ImageUploadPreset,
) {
  if (!image.localUri && !image.uploadValue) return undefined;

  if (image.localUri) {
    const prepared = await prepareImageForUpload(image.localUri, preset);
    return prepared?.uploadValue;
  }

  return image.uploadValue ?? undefined;
}

function isValidOptionalPhone(digits: string) {
  return digits.length === 0 || digits.length >= 10;
}

export default function AddTenant() {
  const { roomId, hostelId: presetHostelId } = useLocalSearchParams<{
    roomId?: string;
    hostelId?: string;
  }>();
  const [createResident, { isLoading: isSaving }] = useCreateResidentMutation();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom),
    [colors, fonts, insets.bottom],
  );

  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [cnic, setCnic] = useState("");
  const [profileImage, setProfileImage] =
    useState<UploadedImageValue>(EMPTY_IMAGE);
  const [cnicFront, setCnicFront] = useState<UploadedImageValue>(EMPTY_IMAGE);
  const [cnicBack, setCnicBack] = useState<UploadedImageValue>(EMPTY_IMAGE);
  const [credentialsModal, setCredentialsModal] = useState<{
    visible: boolean;
    residentName: string;
    credentials: ResidentLoginCredentials | null;
  }>({
    visible: false,
    residentName: "",
    credentials: null,
  });
  const [emergencyDigits, setEmergencyDigits] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherDigits, setFatherDigits] = useState("");

  const { data: hostelsData } = useGetHostelsQuery(undefined);
  const [fetchHostelRooms] = useLazyGetHostelRoomsQuery();
  const [fetchResidents] = useLazyGetResidentsQuery();

  useEffect(() => {
    const hostels = (hostelsData?.hostels as Hostel[] | undefined) ?? [];
    const targetHostels = presetHostelId
      ? hostels.filter((hostel) => hostel._id === presetHostelId)
      : hostels;

    if (targetHostels.length === 0) {
      setAllRooms([]);
      setResidents([]);
      return;
    }

    Promise.all(
      targetHostels.map(async (hostel) => {
        const [roomsResult, residentsResult] = await Promise.all([
          fetchHostelRooms(hostel._id)
            .unwrap()
            .then((response: RoomsResponse) => response.rooms)
            .catch(() => [] as Room[]),
          fetchResidents({ hostelId: hostel._id })
            .unwrap()
            .then((response) => response.residents ?? [])
            .catch(() => [] as Resident[]),
        ]);

        return { rooms: roomsResult, residents: residentsResult };
      }),
    ).then((groups) => {
      const roomList = groups.flatMap((group) => group.rooms);
      const residentList = groups.flatMap((group) => group.residents);

      setAllRooms(roomList);
      setResidents(residentList);

      const vacant = filterVacantRooms(roomList, residentList);
      if (roomId && vacant.some((room) => room._id === roomId)) {
        setSelectedRoomId(roomId);
      } else {
        setSelectedRoomId(null);
      }
    });
  }, [
    hostelsData?.hostels,
    fetchHostelRooms,
    fetchResidents,
    presetHostelId,
    roomId,
  ]);

  const vacantRooms = useMemo(
    () => filterVacantRooms(allRooms, residents),
    [allRooms, residents],
  );

  const vacancyByRoomId = useMemo(
    () => buildVacancyMap(vacantRooms, residents),
    [vacantRooms, residents],
  );

  const selectedRoom =
    vacantRooms.find((room) => room._id === selectedRoomId) ?? null;

  const hostelNames = useMemo(() => {
    const hostels = (hostelsData?.hostels as Hostel[] | undefined) ?? [];
    return Object.fromEntries(
      hostels.map((hostel) => [hostel._id, hostel.name]),
    );
  }, [hostelsData?.hostels]);

  const isValid =
    name.trim().length > 0 &&
    phoneDigits.length >= 10 &&
    selectedRoom !== null &&
    isEmptyOrCompleteCnic(cnic) &&
    isValidOptionalPhone(emergencyDigits) &&
    isValidOptionalPhone(fatherDigits);

  const handleCnicChange = (value: string) => {
    setCnic(formatCnic(value));
  };

  const handleSave = async () => {
    if (!isValid || !selectedRoom || isSaving) return;
    Keyboard.dismiss();

    const hostelId = selectedRoom.hostel || presetHostelId;
    if (!hostelId) {
      Alert.alert("Error", "Could not determine hostel for this room.");
      return;
    }

    if (!isEmptyOrCompleteCnic(cnic)) {
      Alert.alert("Invalid CNIC", "CNIC must be 13 digits (XXXXX-XXXXXXX-X).");
      return;
    }

    const cnicDigits = getCnicDigits(cnic);

    if (!isValidOptionalPhone(emergencyDigits)) {
      Alert.alert(
        "Invalid number",
        "Emergency number must be at least 10 digits.",
      );
      return;
    }

    if (!isValidOptionalPhone(fatherDigits)) {
      Alert.alert(
        "Invalid number",
        "Father's number must be at least 10 digits.",
      );
      return;
    }

    try {
      const [profileImageValue, cnicFrontValue, cnicBackValue] =
        await Promise.all([
          resolveImageUpload(profileImage, "avatar"),
          resolveImageUpload(cnicFront, "idDocument"),
          resolveImageUpload(cnicBack, "idDocument"),
        ]);

      const result = await createResident({
        hostelId,
        name: name.trim(),
        phone: formatPhoneForApi(phoneDigits),
        roomNumber: selectedRoom.roomNumber,
        ...(cnicDigits.length === 13 ? { cnic: formatCnic(cnicDigits) } : {}),
        ...(profileImageValue ? { profileImage: profileImageValue } : {}),
        ...(cnicFrontValue ? { cnicFront: cnicFrontValue } : {}),
        ...(cnicBackValue ? { cnicBack: cnicBackValue } : {}),
        ...(emergencyDigits
          ? { emergencyNumber: formatPhoneForApi(emergencyDigits) }
          : {}),
        ...(fatherName.trim() ? { fatherName: fatherName.trim() } : {}),
        ...(fatherDigits
          ? { fatherPhone: formatPhoneForApi(fatherDigits) }
          : {}),
      }).unwrap();

      if (result.loginCredentials) {
        setCredentialsModal({
          visible: true,
          residentName: result.resident.name,
          credentials: result.loginCredentials,
        });
      } else {
        Alert.alert(
          "Resident added",
          result.message || "Resident saved successfully.",
          [{ text: "OK", onPress: () => router.back() }],
        );
      }
    } catch (error) {
      console.log("result", hostelId);
      console.log("result", selectedRoom);
      console.log("result", cnic);
      console.log("result", emergencyDigits);
      console.log("result", fatherDigits);
      console.log("result", profileImage);
      console.log("result", cnicFront);
      console.log("result", cnicBack);
      console.log("result", name);
      console.log("result", phoneDigits);
      console.log("result", isValid);
      console.log("result", isSaving);
      console.log("result", isValidOptionalPhone(emergencyDigits));
      console.log("result", isValidOptionalPhone(fatherDigits));
      console.log("result", isValidOptionalPhone(phoneDigits));
      console.log("result", isValidOptionalPhone(cnic));
      console.log("result", isValidOptionalPhone(emergencyDigits));
      console.log(JSON.stringify(error, null, 2));
      const err = error as {
        status?: number;
        data?: { message?: string; errors?: { msg: string }[] } | string;
      };

      let message = "Could not save resident. Please try again.";
      if (err.status === 413) {
        message = getImageTooLargeMessage();
      } else if (typeof err.data === "string") {
        message = err.data;
      } else if (err.data?.errors?.length) {
        message = err.data.errors.map((e) => e.msg).join("\n");
      } else if (err.data?.message) {
        message = err.data.message;
      }

      Alert.alert("Error", message);
    }
  };

  const renderPhoneField = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    placeholder: string,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.phoneRow}>
        <View style={styles.countryCode}>
          <Text style={styles.flag}>🇵🇰</Text>
          <Text style={styles.code}>+92</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder={placeholder}
          placeholderTextColor={colors.gray100}
          value={value}
          onChangeText={(text) =>
            onChange(text.replace(/[^0-9]/g, "").slice(0, 11))
          }
          keyboardType="phone-pad"
          maxLength={11}
        />
      </View>
    </View>
  );

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
              <Text style={styles.headerTitle}>Add Resident</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.subtitle}>
                Register a new resident and assign them to a room.
              </Text>

              {allRooms.length === 0 ? (
                <View style={styles.emptyRooms}>
                  <Ionicons
                    name="home-outline"
                    size={vs(32)}
                    color={colors.warning}
                  />
                  <Text style={styles.emptyRoomsTitle}>No rooms yet</Text>
                  <Text style={styles.emptyRoomsText}>
                    Add a room inside a hostel before registering a resident.
                  </Text>
                  <Pressable
                    style={styles.addRoomLink}
                    onPress={() => router.push("/(tabs)/hostels")}
                  >
                    <Text style={styles.addRoomLinkText}>Go to Hostels</Text>
                  </Pressable>
                </View>
              ) : vacantRooms.length === 0 ? (
                <View style={styles.emptyRooms}>
                  <Ionicons
                    name="bed-outline"
                    size={vs(32)}
                    color={colors.warning}
                  />
                  <Text style={styles.emptyRoomsTitle}>No vacant beds</Text>
                  <Text style={styles.emptyRoomsText}>
                    All rooms are full. Free up a bed or add a new room first.
                  </Text>
                </View>
              ) : (
                <>
                  <ImageUploadField
                    label="Resident Photo"
                    hint="Optional profile photo"
                    value={profileImage}
                    onChange={setProfileImage}
                    preset="avatar"
                    aspect={[1, 1]}
                    variant="avatar"
                    style={styles.photoField}
                  />

                  <View style={styles.field}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Sara Khan"
                      placeholderTextColor={colors.gray100}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  {renderPhoneField(
                    "Mobile Number",
                    phoneDigits,
                    setPhoneDigits,
                    "3001234567",
                  )}

                  <View style={styles.field}>
                    <Text style={styles.label}>Assign Room</Text>
                    <RoomDropdown
                      rooms={vacantRooms}
                      hostelNames={hostelNames}
                      vacancyByRoomId={vacancyByRoomId}
                      value={selectedRoomId}
                      onChange={setSelectedRoomId}
                      placeholder="Select room with vacant bed"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>CNIC (optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="35201-1234567-1"
                      placeholderTextColor={colors.gray100}
                      value={cnic}
                      onChangeText={handleCnicChange}
                      keyboardType="number-pad"
                      maxLength={CNIC_FORMATTED_LENGTH}
                    />
                    <Text style={styles.hint}>Format: 35201-1234567-1</Text>
                  </View>

                  <Text style={styles.sectionTitle}>CNIC Photos</Text>
                  <View style={styles.idPhotoRow}>
                    <ImageUploadField
                      label="CNIC Front"
                      value={cnicFront}
                      onChange={setCnicFront}
                      preset="idDocument"
                      aspect={[4, 3]}
                      style={styles.idPhotoField}
                    />
                    <ImageUploadField
                      label="CNIC Back"
                      value={cnicBack}
                      onChange={setCnicBack}
                      preset="idDocument"
                      aspect={[4, 3]}
                      style={styles.idPhotoField}
                    />
                  </View>

                  <Text style={styles.sectionTitle}>Emergency Contact</Text>
                  {renderPhoneField(
                    "Emergency Number",
                    emergencyDigits,
                    setEmergencyDigits,
                    "3009876543",
                  )}

                  <Text style={styles.sectionTitle}>Father / Guardian</Text>
                  <View style={styles.field}>
                    <Text style={styles.label}>Father Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Ahmed Khan"
                      placeholderTextColor={colors.gray100}
                      value={fatherName}
                      onChangeText={setFatherName}
                      autoCapitalize="words"
                    />
                  </View>
                  {renderPhoneField(
                    "Father Number",
                    fatherDigits,
                    setFatherDigits,
                    "3001112233",
                  )}

                  {selectedRoom ? (
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>Monthly rent</Text>
                      <Text style={styles.summaryValue}>
                        Rs {selectedRoom.rent.toLocaleString()} / month
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>

            {vacantRooms.length > 0 ? (
              <View style={styles.footer}>
                <CustomButton
                  title={isSaving ? "Saving..." : "Save Resident"}
                  onPress={handleSave}
                  disabled={!isValid || isSaving}
                />
              </View>
            ) : null}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <ResidentCredentialsModal
        visible={credentialsModal.visible}
        residentName={credentialsModal.residentName}
        credentials={credentialsModal.credentials}
        onClose={() => {
          setCredentialsModal({
            visible: false,
            residentName: "",
            credentials: null,
          });
          router.back();
        }}
      />
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
    photoField: {
      marginBottom: vs(20),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: vs(12),
      marginTop: vs(4),
    },
    idPhotoRow: {
      flexDirection: "row",
      gap: vs(12),
      marginBottom: vs(20),
    },
    idPhotoField: {
      flex: 1,
      marginBottom: 0,
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
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      height: vs(52),
      borderRadius: vs(14),
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(14),
    },
    countryCode: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: vs(10),
    },
    flag: {
      fontSize: vs(18),
      marginRight: vs(4),
    },
    code: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    phoneInput: {
      flex: 1,
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
      height: "100%",
    },
    hint: {
      marginTop: vs(6),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    summaryCard: {
      backgroundColor: colors.secondary100,
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
      color: colors.secondary,
    },
    emptyRooms: {
      alignItems: "center",
      paddingVertical: vs(40),
      paddingHorizontal: vs(20),
    },
    emptyRoomsTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: vs(12),
      marginBottom: vs(6),
    },
    emptyRoomsText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      marginBottom: vs(16),
    },
    addRoomLink: {
      backgroundColor: colors.warning,
      paddingHorizontal: vs(24),
      paddingVertical: vs(12),
      borderRadius: vs(24),
    },
    addRoomLinkText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
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
