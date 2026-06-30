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
import type { Resident, ResidentLookup } from "@/types/resident";
import type { Room, RoomsResponse } from "@/types/room";
import type { Hostel } from "@/types/hostel";
import { toIsoDateString } from "@/types/auth";
import { buildVacancyMap, filterVacantRooms, getRoomTotalWithNewRent } from "@/utils/room";
import {
  getImageTooLargeMessage,
  prepareImageForUpload,
  type ImageUploadPreset,
} from "@/utils/imageUpload";
import { phoneToDigits } from "@/utils/phone";
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
  useLazyLookupResidentByUserIdQuery,
} from "../../../store/api";
import { useSubscription } from "@/hooks/useSubscription";
import { showSubscriptionBlocked } from "@/utils/subscriptionAlert";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseDateOfBirth(value?: string) {
  if (!value) return new Date(1995, 0, 1);

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(1995, 0, 1) : parsed;
}

function toImageValue(value?: string | null): UploadedImageValue {
  if (!value) return EMPTY_IMAGE;
  return { localUri: value, uploadValue: value };
}

function getLookupErrorMessage(error: unknown) {
  const err = error as {
    status?: number;
    data?: { message?: string } | string;
  };

  if (typeof err.data === "string") return err.data;
  if (err.data?.message) return err.data.message;
  if (err.status === 404) return "No resident account found with this User ID.";
  return "Could not look up resident. Please try again.";
}

export default function AddResident() {
  const { roomId, hostelId: presetHostelId } = useLocalSearchParams<{
    roomId?: string;
    hostelId?: string;
  }>();
  const [createResident, { isLoading: isSaving }] = useCreateResidentMutation();
  const [lookupResident, { isFetching: isLookingUp }] =
    useLazyLookupResidentByUserIdQuery();
  const { checkAddTenant } = useSubscription();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom, keyboardHeight),
    [colors, fonts, insets.bottom, keyboardHeight],
  );

  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [lookupUserId, setLookupUserId] = useState("");
  const [linkedResidentUserId, setLinkedResidentUserId] = useState<string | null>(
    null,
  );
  const [lookupFoundName, setLookupFoundName] = useState<string | null>(null);
  const [lookupCanLink, setLookupCanLink] = useState<boolean | null>(null);
  const [lookupConnectedHostelName, setLookupConnectedHostelName] = useState<
    string | null
  >(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateDraft, setDateDraft] = useState(new Date(1995, 0, 1));
  const [phoneDigits, setPhoneDigits] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [cnic, setCnic] = useState("");
  const [profileImage, setProfileImage] =
    useState<UploadedImageValue>(EMPTY_IMAGE);
  const [cnicFront, setCnicFront] = useState<UploadedImageValue>(EMPTY_IMAGE);
  const [cnicBack, setCnicBack] = useState<UploadedImageValue>(EMPTY_IMAGE);
  const [emergencyDigits, setEmergencyDigits] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherDigits, setFatherDigits] = useState("");
  const [agreedRent, setAgreedRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");

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
  const parsedSecurityDeposit =
    securityDeposit.trim() === "" ? 0 : Number(securityDeposit);
  const hasValidSecurityDeposit =
    securityDeposit.trim() === "" ||
    (!Number.isNaN(parsedSecurityDeposit) && parsedSecurityDeposit >= 0);

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
    hasValidSecurityDeposit &&
    isEmptyOrCompleteCnic(cnic) &&
    isValidOptionalPhone(emergencyDigits) &&
    isValidOptionalPhone(fatherDigits) &&
    (!email.trim() || isValidEmail(email.trim()));

  const applyLookupProfile = useCallback((resident: ResidentLookup) => {
    setName(resident.name ?? "");
    setPhoneDigits(phoneToDigits(resident.phone ?? ""));
    setEmail(resident.email ?? "");
    setAddress(resident.address ?? "");
    setCnic(formatCnic(resident.cnic ?? ""));
    setFatherName(resident.fatherName ?? "");
    setEmergencyDigits(phoneToDigits(resident.emergencyNumber ?? ""));
    setFatherDigits(phoneToDigits(resident.fatherPhone ?? ""));
    setProfileImage(toImageValue(resident.profileImage));
    setCnicFront(toImageValue(resident.cnicFront));
    setCnicBack(toImageValue(resident.cnicBack));
    setDateOfBirth(
      resident.dateOfBirth ? parseDateOfBirth(resident.dateOfBirth) : null,
    );
    setLinkedResidentUserId(resident.userId);
    setLookupFoundName(resident.name);
    setLookupCanLink(resident.canLink);
    setLookupConnectedHostelName(resident.connectedHostelName ?? null);
  }, []);

  const handleLookup = async () => {
    const id = lookupUserId.trim();
    if (!id) {
      Alert.alert(
        "User ID required",
        "Enter the resident's User ID from their Osstel account.",
      );
      return;
    }

    Keyboard.dismiss();

    try {
      const result = await lookupResident(id).unwrap();
      applyLookupProfile(result.resident);
    } catch (error) {
      Alert.alert("Lookup failed", getLookupErrorMessage(error));
    }
  };

  const handleOpenDatePicker = () => {
    setDateDraft(dateOfBirth ?? new Date(1995, 0, 1));
    setShowDatePicker(true);
  };

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selected) setDateOfBirth(selected);
      return;
    }

    if (selected) setDateDraft(selected);
  };

  const handleDateConfirm = () => {
    setDateOfBirth(dateDraft);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleCnicChange = (value: string) => {
    setCnic(formatCnic(value));
  };

  const handleSave = () => {
    if (!isValid || !selectedRoom || isSaving) return;

    const limitCheck = checkAddTenant();
    if (!limitCheck.allowed) {
      showSubscriptionBlocked(limitCheck.message);
      return;
    }

    if (!isEmptyOrCompleteCnic(cnic)) {
      Alert.alert("Invalid CNIC", "CNIC must be 13 digits (XXXXX-XXXXXXX-X).");
      return;
    }

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

    if (linkedResidentUserId && lookupCanLink === false) {
      Alert.alert(
        "Cannot link account",
        lookupConnectedHostelName
          ? `${lookupFoundName ?? "This resident"} is already connected to ${lookupConnectedHostelName}.`
          : `${lookupFoundName ?? "This resident"} is already connected to another hostel.`,
      );
      return;
    }

    if (linkedResidentUserId && lookupCanLink) {
      Alert.alert(
        "Link resident account?",
        `${lookupFoundName ?? "This resident"} already has an Osstel account. Saving will connect their app to this hostel immediately — they will not need to enter the hostel code.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Link & Save", onPress: () => void submitResident() },
        ],
      );
      return;
    }

    void submitResident();
  };

  const submitResident = async () => {
    if (!isValid || !selectedRoom || isSaving) return;

    Keyboard.dismiss();

    const hostelId = selectedRoom.hostel || presetHostelId;
    if (!hostelId) {
      Alert.alert("Error", "Could not determine hostel for this room.");
      return;
    }

    const cnicDigits = getCnicDigits(cnic);

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
        securityDeposit: parsedSecurityDeposit,
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
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(dateOfBirth ? { dateOfBirth: toIsoDateString(dateOfBirth) } : {}),
        ...(linkedResidentUserId
          ? { residentUserId: linkedResidentUserId }
          : {}),
      }).unwrap();

      Alert.alert(
        linkedResidentUserId ? "Resident linked" : "Resident added",
        result.message ||
          (linkedResidentUserId
            ? "Resident added and linked to their Osstel account."
            : "Resident saved. They can sign up in the app and join using your hostel code."),
        [{ text: "OK", onPress: () => router.back() }],
      );
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
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <View style={styles.inner}>
            <ScreenHeader title="Add Resident" showBack />

            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.scrollContent}
            >
            <Text style={styles.subtitle}>
              Register a new resident and assign them to a room. Use their User ID
              if they already have the app — otherwise they can join later with
              your hostel code.
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
                <View style={styles.lookupCard}>
                  <Text style={styles.lookupTitle}>Get user by ID</Text>
                  <Text style={styles.lookupHint}>
                    Paste the resident&apos;s Osstel User ID to load their
                    profile details automatically.
                  </Text>
                  <View style={styles.lookupRow}>
                    <View style={styles.lookupInputWrap}>
                      <CustomInput
                        label="Resident User ID"
                        placeholder="e.g. 482913"
                        value={lookupUserId}
                        onChangeText={(text) => {
                          setLookupUserId(text.replace(/[^a-zA-Z0-9]/g, ""));
                          setLinkedResidentUserId(null);
                          setLookupFoundName(null);
                          setLookupCanLink(null);
                          setLookupConnectedHostelName(null);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <Pressable
                      style={[
                        styles.lookupButton,
                        (!lookupUserId.trim() || isLookingUp) &&
                          styles.lookupButtonDisabled,
                      ]}
                      onPress={handleLookup}
                      disabled={!lookupUserId.trim() || isLookingUp}
                    >
                      {isLookingUp ? (
                        <CustomLoading size="sm" />
                      ) : (
                        <Text style={styles.lookupButtonText}>Lookup</Text>
                      )}
                    </Pressable>
                  </View>
                  {lookupFoundName ? (
                    lookupCanLink ? (
                      <View style={styles.lookupLinkCard}>
                        <Ionicons
                          name="link-outline"
                          size={vs(18)}
                          color={colors.primary}
                        />
                        <View style={styles.lookupLinkTextWrap}>
                          <Text style={styles.lookupLinkTitle}>
                            Osstel account found
                          </Text>
                          <Text style={styles.lookupLinkText}>
                            Profile loaded for {lookupFoundName}. Saving will
                            link their app account to this hostel right away.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.lookupWarning}>
                        <Ionicons
                          name="warning-outline"
                          size={vs(18)}
                          color={colors.warning}
                        />
                        <Text style={styles.lookupWarningText}>
                          {lookupConnectedHostelName
                            ? `${lookupFoundName} is already connected to ${lookupConnectedHostelName}. You cannot link them here.`
                            : `${lookupFoundName} is already connected to another hostel.`}
                        </Text>
                      </View>
                    )
                  ) : null}
                </View>

                <ImageUploadField
                  label="Resident Photo"
                  value={profileImage}
                  onChange={setProfileImage}
                  preset="avatar"
                  aspect={[1, 1]}
                  variant="avatar"
                  style={styles.photoField}
                />

                <View
                  onLayout={(event) =>
                    registerFieldPosition("name", event.nativeEvent.layout.y)
                  }
                >
                  <CustomInput
                    label="Full Name"
                    placeholder="e.g. Sara Khan"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    onFocus={() => scrollToField("name")}
                  />
                </View>

                <View
                  onLayout={(event) =>
                    registerFieldPosition("phone", event.nativeEvent.layout.y)
                  }
                >
                  <PhoneInput
                    label="Mobile Number"
                    value={phoneDigits}
                    onChangeText={setPhoneDigits}
                    placeholder="3001234567"
                    onFocus={() => scrollToField("phone")}
                  />
                </View>

                <View
                  onLayout={(event) =>
                    registerFieldPosition("email", event.nativeEvent.layout.y)
                  }
                >
                  <CustomInput
                    label="Email Address"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => scrollToField("email")}
                  />
                </View>

                <View
                  onLayout={(event) =>
                    registerFieldPosition("address", event.nativeEvent.layout.y)
                  }
                >
                  <CustomInput
                    label="Address"
                    placeholder="Street, area, city"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    onFocus={() => scrollToField("address")}
                  />
                </View>

                <View style={styles.dateField}>
                  <Text style={styles.dropdownLabel}>Date of Birth</Text>
                  <Pressable style={styles.dateInput} onPress={handleOpenDatePicker}>
                    <Text
                      style={[
                        styles.dateText,
                        !dateOfBirth && styles.datePlaceholder,
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
                    <View
                      onLayout={(event) =>
                        registerFieldPosition(
                          "agreedRent",
                          event.nativeEvent.layout.y,
                        )
                      }
                    >
                      <CustomInput
                        label="Monthly Rent (Rs)"
                        placeholder={String(selectedRoom.rent)}
                        value={agreedRent}
                        onChangeText={(text) =>
                          setAgreedRent(text.replace(/[^0-9]/g, "").slice(0, 7))
                        }
                        keyboardType="number-pad"
                        hint={`Room default is Rs ${selectedRoom.rent.toLocaleString()}/mo. Change this if the resident pays a different amount.`}
                        onFocus={() => scrollToField("agreedRent")}
                      />
                    </View>

                    <View
                      onLayout={(event) =>
                        registerFieldPosition(
                          "securityDeposit",
                          event.nativeEvent.layout.y,
                        )
                      }
                    >
                      <CustomInput
                        label="Security Deposit (Rs)"
                        placeholder="e.g. 10000"
                        value={securityDeposit}
                        onChangeText={(text) =>
                          setSecurityDeposit(
                            text.replace(/[^0-9]/g, "").slice(0, 8),
                          )
                        }
                        keyboardType="number-pad"
                        hint="One-time deposit collected when the resident moves in. Leave blank if none."
                        onFocus={() => scrollToField("securityDeposit")}
                      />
                    </View>

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

                <View
                  onLayout={(event) =>
                    registerFieldPosition("cnic", event.nativeEvent.layout.y)
                  }
                >
                  <CustomInput
                    label="CNIC"
                    placeholder="35201-1234567-1"
                    value={cnic}
                    onChangeText={handleCnicChange}
                    keyboardType="number-pad"
                    maxLength={CNIC_FORMATTED_LENGTH}
                    hint="Format: 35201-1234567-1"
                    onFocus={() => scrollToField("cnic")}
                  />
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
                <View
                  onLayout={(event) =>
                    registerFieldPosition(
                      "emergency",
                      event.nativeEvent.layout.y,
                    )
                  }
                >
                  <PhoneInput
                    label="Emergency Number"
                    value={emergencyDigits}
                    onChangeText={setEmergencyDigits}
                    placeholder="3009876543"
                    onFocus={() => scrollToField("emergency")}
                  />
                </View>

                <Text style={styles.sectionTitle}>Father / Guardian</Text>
                <View
                  onLayout={(event) =>
                    registerFieldPosition(
                      "fatherName",
                      event.nativeEvent.layout.y,
                    )
                  }
                >
                  <CustomInput
                    label="Father Name"
                    placeholder="e.g. Ahmed Khan"
                    value={fatherName}
                    onChangeText={setFatherName}
                    autoCapitalize="words"
                    onFocus={() => scrollToField("fatherName")}
                  />
                </View>
                <View
                  onLayout={(event) =>
                    registerFieldPosition(
                      "fatherPhone",
                      event.nativeEvent.layout.y,
                    )
                  }
                >
                  <PhoneInput
                    label="Father Number"
                    value={fatherDigits}
                    onChangeText={setFatherDigits}
                    placeholder="3001112233"
                    onFocus={() => scrollToField("fatherPhone")}
                  />
                </View>

                {selectedRoom ? (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>This resident pays</Text>
                    <Text style={styles.summaryValue}>
                      Rs{" "}
                      {(hasValidRent ? parsedAgreedRent : selectedRoom.rent).toLocaleString()}{" "}
                      / month
                    </Text>
                    {parsedSecurityDeposit > 0 ? (
                      <Text style={styles.summaryHint}>
                        Security deposit: Rs{" "}
                        {parsedSecurityDeposit.toLocaleString()}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.buttonWrap}>
                  <CustomButton
                    title={
                      linkedResidentUserId && lookupCanLink
                        ? "Link & Save Resident"
                        : "Save Resident"
                    }
                    onPress={handleSave}
                    disabled={
                      !isValid ||
                      isSaving ||
                      (Boolean(linkedResidentUserId) && lookupCanLink === false)
                    }
                    loading={isSaving}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
        </KeyboardAvoidingView>

        {Platform.OS === "ios" ? (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={handleDateCancel}
          >
            <Pressable style={styles.dateModalOverlay} onPress={handleDateCancel}>
              <Pressable style={styles.dateModalSheet} onPress={() => {}}>
                <View style={styles.dateModalHeader}>
                  <Pressable onPress={handleDateCancel}>
                    <Text style={styles.dateModalAction}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.dateModalTitle}>Date of Birth</Text>
                  <Pressable onPress={handleDateConfirm}>
                    <Text style={styles.dateModalAction}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={dateDraft}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              </Pressable>
            </Pressable>
          </Modal>
        ) : showDatePicker ? (
          <DateTimePicker
            value={dateDraft}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        ) : null}
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
      paddingBottom: Math.max(bottomInset, vs(24)) + keyboardPadding,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(16),
    },
    lookupCard: {
      backgroundColor: colors.primary100,
      borderRadius: vs(12),
      padding: vs(14),
      marginBottom: vs(16),
      borderWidth: 1,
      borderColor: colors.border,
    },
    lookupTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    lookupHint: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(12),
      lineHeight: vs(18),
    },
    lookupRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: vs(10),
    },
    lookupInputWrap: {
      flex: 1,
    },
    lookupButton: {
      minWidth: vs(88),
      height: vs(48),
      borderRadius: vs(12),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(4),
    },
    lookupButtonDisabled: {
      opacity: 0.5,
    },
    lookupButtonText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.white,
    },
    lookupSuccess: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      marginTop: vs(10),
    },
    lookupSuccessText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.success,
      flex: 1,
    },
    lookupLinkCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(8),
      marginTop: vs(12),
      padding: vs(10),
      borderRadius: vs(10),
      backgroundColor: colors.primary100,
      borderWidth: 1,
      borderColor: colors.gradientBorder,
    },
    lookupLinkTextWrap: {
      flex: 1,
    },
    lookupLinkTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      marginBottom: vs(2),
    },
    lookupLinkText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray300,
      lineHeight: vs(18),
    },
    lookupWarning: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(8),
      marginTop: vs(12),
      padding: vs(10),
      borderRadius: vs(10),
      backgroundColor: colors.warningBg,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    lookupWarningText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.warningText,
      lineHeight: vs(18),
    },
    dateField: {
      marginBottom: vs(12),
    },
    dateInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.white,
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: vs(14),
      paddingVertical: vs(14),
    },
    dateText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    datePlaceholder: {
      color: colors.gray100,
    },
    clearDateText: {
      marginTop: vs(6),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    dateModalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    dateModalSheet: {
      backgroundColor: colors.white,
      borderTopLeftRadius: vs(16),
      borderTopRightRadius: vs(16),
      paddingBottom: vs(24),
    },
    dateModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: vs(16),
      paddingVertical: vs(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateModalTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    dateModalAction: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.primary,
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
    summaryHint: {
      marginTop: vs(6),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
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
      color: colors.onPrimary,
    },
  });
}
