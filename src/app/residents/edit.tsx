import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import PhoneInput from "@/components/PhoneInput";
import ScreenHeader from "@/components/ScreenHeader";
import ImageUploadField, {
  type UploadedImageValue,
} from "@/components/ImageUploadField";
import RoomDropdown from "@/components/RoomDropdown";
import type { Resident } from "@/types/resident";
import type { Room, RoomsResponse } from "@/types/room";
import {
  buildVacancyMap,
  filterRoomsForResidentEdit,
  getResidentMonthlyRent,
  getRoomTotalWithNewRent,
} from "@/utils/room";
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
  useDeleteResidentMutation,
  useGetHostelRoomsQuery,
  useGetResidentsQuery,
  useUpdateResidentMutation,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
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

function phoneToDigits(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

function toImageValue(value?: string | null): UploadedImageValue {
  if (!value) return { localUri: null, uploadValue: null };
  return { localUri: value, uploadValue: value };
}

async function resolveImageUpload(
  image: UploadedImageValue,
  preset: ImageUploadPreset,
) {
  if (!image.localUri && !image.uploadValue) return undefined;

  if (image.localUri && !image.localUri.startsWith("http")) {
    const prepared = await prepareImageForUpload(image.localUri, preset);
    return prepared?.uploadValue;
  }

  return image.uploadValue ?? undefined;
}

async function resolveImageField(
  current: UploadedImageValue,
  initial: string | null | undefined,
  preset: ImageUploadPreset,
): Promise<string | undefined> {
  const hadInitial = Boolean(initial);
  const isCleared = !current.localUri && !current.uploadValue;

  if (isCleared && hadInitial) return "";
  if (current.localUri && !current.localUri.startsWith("http")) {
    const uploaded = await resolveImageUpload(current, preset);
    return uploaded ?? undefined;
  }
  if (current.uploadValue && current.uploadValue !== initial) {
    return current.uploadValue;
  }
  return undefined;
}

function isValidOptionalPhone(digits: string) {
  return digits.length === 0 || digits.length >= 10;
}

export default function EditResident() {
  const { tenancyId, hostelId } = useLocalSearchParams<{
    tenancyId?: string;
    hostelId?: string;
  }>();

  const [updateResident, { isLoading: isSaving }] = useUpdateResidentMutation();
  const [deleteResident, { isLoading: isRemoving }] =
    useDeleteResidentMutation();

  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom),
    [colors, fonts, insets.bottom],
  );

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [cnic, setCnic] = useState("");
  const [profileImage, setProfileImage] =
    useState<UploadedImageValue>({ localUri: null, uploadValue: null });
  const [cnicFront, setCnicFront] = useState<UploadedImageValue>({
    localUri: null,
    uploadValue: null,
  });
  const [cnicBack, setCnicBack] = useState<UploadedImageValue>({
    localUri: null,
    uploadValue: null,
  });
  const [initialImages, setInitialImages] = useState({
    profileImage: null as string | null,
    cnicFront: null as string | null,
    cnicBack: null as string | null,
  });
  const [emergencyDigits, setEmergencyDigits] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherDigits, setFatherDigits] = useState("");
  const [agreedRent, setAgreedRent] = useState("");
  const [residentUserId, setResidentUserId] = useState<string | null>(null);

  const {
    data: residentsData,
    isLoading: isLoadingResidents,
    isError: residentsError,
  } = useGetResidentsQuery(
    { hostelId: hostelId ?? "" },
    { skip: !hostelId },
  );

  const { data: roomsData, isLoading: isLoadingRooms } = useGetHostelRoomsQuery(
    hostelId ?? "",
    { skip: !hostelId },
  );

  const resident = useMemo(
    () =>
      (residentsData?.residents ?? []).find(
        (item: Resident) => item.tenancyId === tenancyId,
      ) ?? null,
    [residentsData?.residents, tenancyId],
  );

  const allRooms = (roomsData as RoomsResponse | undefined)?.rooms ?? [];
  const allResidents = residentsData?.residents ?? [];

  const editableRooms = useMemo(() => {
    if (!resident) return [];
    return filterRoomsForResidentEdit(
      allRooms,
      allResidents,
      resident.roomId,
      resident.tenancyId,
    );
  }, [allRooms, allResidents, resident]);

  const vacancyByRoomId = useMemo(
    () => buildVacancyMap(editableRooms, allResidents),
    [editableRooms, allResidents],
  );

  const selectedRoom =
    editableRooms.find((room: Room) => room._id === selectedRoomId) ?? null;

  useEffect(() => {
    if (!resident || initialized) return;

    setName(resident.name);
    setPhoneDigits(phoneToDigits(resident.phone));
    setSelectedRoomId(resident.roomId);
    setCnic(resident.cnic ? formatCnic(resident.cnic) : "");
    setProfileImage(toImageValue(resident.profileImage));
    setCnicFront(toImageValue(resident.cnicFront));
    setCnicBack(toImageValue(resident.cnicBack));
    setInitialImages({
      profileImage: resident.profileImage ?? null,
      cnicFront: resident.cnicFront ?? null,
      cnicBack: resident.cnicBack ?? null,
    });
    setEmergencyDigits(
      resident.emergencyNumber
        ? phoneToDigits(resident.emergencyNumber)
        : "",
    );
    setFatherName(resident.fatherName ?? "");
    setFatherDigits(
      resident.fatherPhone ? phoneToDigits(resident.fatherPhone) : "",
    );
    setAgreedRent(String(getResidentMonthlyRent(resident)));
    setResidentUserId(resident.userId ?? null);
    setInitialized(true);
  }, [resident, initialized]);

  const parsedAgreedRent = Number(agreedRent);
  const hasValidRent = parsedAgreedRent > 0;

  const projectedRoomTotal = useMemo(() => {
    if (!selectedRoom || !hasValidRent || !resident) return null;
    const others = allResidents.filter(
      (item) => item.tenancyId !== resident.tenancyId,
    );
    return getRoomTotalWithNewRent(selectedRoom, others, parsedAgreedRent);
  }, [selectedRoom, allResidents, parsedAgreedRent, hasValidRent, resident]);

  const isPageLoading =
    !tenancyId ||
    !hostelId ||
    isLoadingResidents ||
    isLoadingRooms ||
    (!initialized && !residentsError);

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
    if (!isValid || !selectedRoom || !tenancyId || isSaving || isRemoving) return;
    Keyboard.dismiss();

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
          resolveImageField(profileImage, initialImages.profileImage, "avatar"),
          resolveImageField(cnicFront, initialImages.cnicFront, "idDocument"),
          resolveImageField(cnicBack, initialImages.cnicBack, "idDocument"),
        ]);

      await updateResident({
        tenancyId,
        name: name.trim(),
        phone: formatPhoneForApi(phoneDigits),
        roomNumber: selectedRoom.roomNumber,
        monthlyRent: parsedAgreedRent,
        ...(cnicDigits.length === 13 ? { cnic: formatCnic(cnicDigits) } : {}),
        ...(profileImageValue !== undefined
          ? { profileImage: profileImageValue }
          : {}),
        ...(cnicFrontValue !== undefined ? { cnicFront: cnicFrontValue } : {}),
        ...(cnicBackValue !== undefined ? { cnicBack: cnicBackValue } : {}),
        ...(emergencyDigits
          ? { emergencyNumber: formatPhoneForApi(emergencyDigits) }
          : { emergencyNumber: "" }),
        ...(fatherName.trim() ? { fatherName: fatherName.trim() } : { fatherName: "" }),
        ...(fatherDigits
          ? { fatherPhone: formatPhoneForApi(fatherDigits) }
          : { fatherPhone: "" }),
      }).unwrap();

      Alert.alert("Resident updated", "Changes saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const err = error as {
        status?: number;
        data?: { message?: string; errors?: { msg: string }[] } | string;
      };

      let message = "Could not update resident. Please try again.";
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

  const handleRemove = () => {
    if (!tenancyId || !resident || isSaving || isRemoving) return;

    Alert.alert(
      "Remove resident",
      `Mark ${resident.name} as moved out? They will lose access to this hostel.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteResident(tenancyId).unwrap();
              Alert.alert("Resident removed", "The resident has been moved out.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              const message =
                (error as { data?: { message?: string } })?.data?.message ??
                "Could not remove resident.";
              Alert.alert("Error", message);
            }
          },
        },
      ],
    );
  };

  if (!tenancyId || !hostelId) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScreenHeader title="Edit Resident" showBack />
          <View style={styles.centerWrap}>
            <Text style={styles.errorText}>Missing resident details.</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!isPageLoading && (residentsError || !resident)) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScreenHeader title="Edit Resident" showBack />
          <View style={styles.centerWrap}>
            <Text style={styles.errorText}>
              Resident not found or no longer active.
            </Text>
            <Pressable style={styles.backLink} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.inner}>
          <ScreenHeader title="Edit Resident" showBack />

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
              Update resident details, reassign room, or remove when they move out.
            </Text>

            {isPageLoading ? (
              <View style={styles.loadingWrap}>
                <CustomLoading size="md" />
                <Text style={styles.loadingText}>Loading resident...</Text>
              </View>
            ) : (
              <>
                {residentUserId ? (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Login User ID</Text>
                    <Text style={styles.infoValue}>{residentUserId}</Text>
                  </View>
                ) : null}

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
                  <Text style={styles.dropdownLabel}>Room</Text>
                  <RoomDropdown
                    rooms={editableRooms}
                    vacancyByRoomId={vacancyByRoomId}
                    value={selectedRoomId}
                    onChange={setSelectedRoomId}
                    placeholder="Select room"
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
                      hint={`Room default is Rs ${selectedRoom.rent.toLocaleString()}/mo.`}
                    />

                    {projectedRoomTotal != null ? (
                      <View style={styles.rentSummaryCard}>
                        <Text style={styles.rentSummaryLabel}>
                          Room rent total after save
                        </Text>
                        <Text style={styles.rentSummaryValue}>
                          Rs {projectedRoomTotal.toLocaleString()} / month
                        </Text>
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

                <View style={styles.buttonWrap}>
                  <CustomButton
                    title={
                      isSaving ? <CustomLoading size="sm" /> : "Save Changes"
                    }
                    onPress={handleSave}
                    disabled={!isValid || isSaving || isRemoving}
                  />
                </View>

                <CustomButton
                  title={isRemoving ? "Removing..." : "Remove Resident"}
                  onPress={handleRemove}
                  disabled={isSaving || isRemoving}
                  style={styles.deleteBtn}
                />
              </>
            )}
          </ScrollView>
        </View>
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
    centerWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(32),
    },
    errorText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
      textAlign: "center",
      marginBottom: vs(16),
    },
    backLink: {
      paddingHorizontal: vs(20),
      paddingVertical: vs(10),
      borderRadius: vs(20),
      backgroundColor: colors.primary,
    },
    backLinkText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.onPrimary,
    },
    infoCard: {
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(16),
    },
    infoLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: vs(4),
    },
    infoValue: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
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
    buttonWrap: {
      marginTop: vs(8),
    },
    deleteBtn: {
      backgroundColor: colors.error,
      marginTop: vs(16),
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
  });
}
