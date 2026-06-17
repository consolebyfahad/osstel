import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import PhoneInput from "@/components/PhoneInput";
import ScreenHeader from "@/components/ScreenHeader";
import ImageUploadField, {
  type UploadedImageValue,
} from "@/components/ImageUploadField";
import ResidentCredentialsModal from "@/components/ResidentCredentialsModal";
import RoomDropdown from "@/components/RoomDropdown";
import type { Resident, ResidentLoginCredentials } from "@/types/resident";
import type { Room, RoomsResponse } from "@/types/room";
import type { Hostel } from "@/types/hostel";
import { buildVacancyMap, filterVacantRooms, getRoomTotalWithNewRent } from "@/utils/room";
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

export default function AddResident() {
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
  const [agreedRent, setAgreedRent] = useState("");

  const { data: hostelsData, isLoading: isLoadingHostels } =
    useGetHostelsQuery(undefined);
  const [fetchHostelRooms] = useLazyGetHostelRoomsQuery();
  const [fetchResidents] = useLazyGetResidentsQuery();
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [hasLoadedRooms, setHasLoadedRooms] = useState(false);

  useEffect(() => {
    if (isLoadingHostels) return;

    let cancelled = false;
    const hostels = (hostelsData?.hostels as Hostel[] | undefined) ?? [];
    const targetHostels = presetHostelId
      ? hostels.filter((hostel) => hostel._id === presetHostelId)
      : hostels;

    if (targetHostels.length === 0) {
      setAllRooms([]);
      setResidents([]);
      setHasLoadedRooms(true);
      return;
    }

    setIsLoadingRooms(true);

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
    )
      .then((groups) => {
        if (cancelled) return;

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
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRooms(false);
          setHasLoadedRooms(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    hostelsData?.hostels,
    fetchHostelRooms,
    fetchResidents,
    presetHostelId,
    roomId,
    isLoadingHostels,
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

  useEffect(() => {
    if (selectedRoom) {
      setAgreedRent(String(selectedRoom.rent));
    } else {
      setAgreedRent("");
    }
  }, [selectedRoomId, selectedRoom?.rent]);

  const parsedAgreedRent = Number(agreedRent);
  const hasValidRent = parsedAgreedRent > 0;

  const projectedRoomTotal = useMemo(() => {
    if (!selectedRoom || !hasValidRent) return null;
    return getRoomTotalWithNewRent(selectedRoom, residents, parsedAgreedRent);
  }, [selectedRoom, residents, parsedAgreedRent, hasValidRent]);

  const hostelNames = useMemo(() => {
    const hostels = (hostelsData?.hostels as Hostel[] | undefined) ?? [];
    return Object.fromEntries(
      hostels.map((hostel) => [hostel._id, hostel.name]),
    );
  }, [hostelsData?.hostels]);

  const isPageLoading = isLoadingHostels || isLoadingRooms || !hasLoadedRooms;

  const isValid =
    name.trim().length > 0 &&
    phoneDigits.length >= 10 &&
    selectedRoom !== null &&
    hasValidRent &&
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
        monthlyRent: parsedAgreedRent,
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

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.inner}>
          <ScreenHeader title="Add Resident" showBack />

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
              Register a new resident and assign them to a room.
            </Text>

            {isPageLoading ? (
              <View style={styles.loadingWrap}>
                <CustomLoading size="md" />
                <Text style={styles.loadingText}>Loading rooms...</Text>
              </View>
            ) : allRooms.length === 0 ? (
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
                  hint="Optional"
                  value={profileImage}
                  onChange={setProfileImage}
                  preset="avatar"
                  aspect={[1, 1]}
                  variant="avatar"
                  style={styles.photoField}
                />

                <CustomInput
                  label="Full Name"
                  placeholder="e.g. Sara Khan"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <PhoneInput
                  label="Mobile Number"
                  value={phoneDigits}
                  onChangeText={setPhoneDigits}
                  placeholder="3001234567"
                />

                <View style={styles.dropdownField}>
                  <Text style={styles.dropdownLabel}>Assign Room</Text>
                  <RoomDropdown
                    rooms={vacantRooms}
                    hostelNames={hostelNames}
                    vacancyByRoomId={vacancyByRoomId}
                    value={selectedRoomId}
                    onChange={setSelectedRoomId}
                    placeholder="Select room with vacant bed"
                  />
                </View>

                {selectedRoom ? (
                  <>
                    <CustomInput
                      label="Monthly Rent (Rs)"
                      placeholder={String(selectedRoom.rent)}
                      value={agreedRent}
                      onChangeText={(text) =>
                        setAgreedRent(text.replace(/[^0-9]/g, "").slice(0, 7))
                      }
                      keyboardType="number-pad"
                      hint={`Room default is Rs ${selectedRoom.rent.toLocaleString()}/mo. Change this if the resident pays a different amount.`}
                    />

                    {projectedRoomTotal != null ? (
                      <View style={styles.rentSummaryCard}>
                        <Text style={styles.rentSummaryLabel}>
                          Room rent after adding resident
                        </Text>
                        <Text style={styles.rentSummaryValue}>
                          Rs {projectedRoomTotal.toLocaleString()} / month total
                        </Text>
                        {parsedAgreedRent !== selectedRoom.rent ? (
                          <Text style={styles.rentSummaryHint}>
                            Custom rate: Rs {parsedAgreedRent.toLocaleString()}{" "}
                            (default Rs {selectedRoom.rent.toLocaleString()})
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : null}

                <CustomInput
                  label="CNIC (optional)"
                  placeholder="35201-1234567-1"
                  value={cnic}
                  onChangeText={handleCnicChange}
                  keyboardType="number-pad"
                  maxLength={CNIC_FORMATTED_LENGTH}
                  hint="Format: 35201-1234567-1"
                />

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
                <PhoneInput
                  label="Emergency Number"
                  value={emergencyDigits}
                  onChangeText={setEmergencyDigits}
                  placeholder="3009876543"
                />

                <Text style={styles.sectionTitle}>Father / Guardian</Text>
                <CustomInput
                  label="Father Name"
                  placeholder="e.g. Ahmed Khan"
                  value={fatherName}
                  onChangeText={setFatherName}
                  autoCapitalize="words"
                />
                <PhoneInput
                  label="Father Number"
                  value={fatherDigits}
                  onChangeText={setFatherDigits}
                  placeholder="3001112233"
                />

                {selectedRoom ? (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>This resident pays</Text>
                    <Text style={styles.summaryValue}>
                      Rs{" "}
                      {(hasValidRent ? parsedAgreedRent : selectedRoom.rent).toLocaleString()}{" "}
                      / month
                    </Text>
                  </View>
                ) : null}

                <View style={styles.buttonWrap}>
                  <CustomButton
                    title={
                      isSaving ? <CustomLoading size="sm" /> : "Save Resident"
                    }
                    onPress={handleSave}
                    disabled={!isValid || isSaving}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>

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
    </GradientBackground>
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
    },
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    inner: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: Math.max(bottomInset, vs(24)),
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(16),
    },
    photoField: {
      marginBottom: vs(4),
    },
    dropdownField: {
      marginBottom: vs(16),
    },
    dropdownLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
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
      marginBottom: vs(8),
    },
    idPhotoField: {
      flex: 1,
      marginBottom: 0,
    },
    summaryCard: {
      backgroundColor: colors.secondary100,
      borderRadius: vs(14),
      padding: vs(16),
      marginBottom: vs(8),
    },
    rentSummaryCard: {
      backgroundColor: colors.primary100,
      borderRadius: vs(14),
      padding: vs(16),
      marginBottom: vs(8),
      marginTop: vs(-8),
    },
    rentSummaryLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(4),
    },
    rentSummaryValue: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    rentSummaryHint: {
      marginTop: vs(6),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
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
    buttonWrap: {
      marginTop: vs(8),
    },
    emptyRooms: {
      alignItems: "center",
      paddingVertical: vs(40),
      paddingHorizontal: vs(20),
    },
    loadingWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: vs(48),
      gap: vs(12),
    },
    loadingText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
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
  });
}
