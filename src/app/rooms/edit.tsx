import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import BedCountDropdown, {
  BED_COUNT_OPTIONS,
  type BedCount,
} from "@/components/BedCountDropdown";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import {
  useDeleteHostelRoomMutation,
  useGetHostelRoomsQuery,
  useUpdateHostelRoomMutation,
} from "../../../store/api";
import { ROOM_STATUSES, type Room, type RoomStatus } from "@/types/room";
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

function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export default function EditRoomScreen() {
  const { hostelId, roomId } = useLocalSearchParams<{
    hostelId: string;
    roomId: string;
  }>();
  const { data, isLoading } = useGetHostelRoomsQuery(hostelId!, {
    skip: !hostelId,
  });
  const [updateRoom, { isLoading: isSaving }] = useUpdateHostelRoomMutation();
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteHostelRoomMutation();
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark, insets.bottom, keyboardHeight),
    [colors, fonts, isDark, insets.bottom, keyboardHeight],
  );

  const room = data?.rooms?.find((item: Room) => item._id === roomId);

  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState<BedCount | null>(null);
  const [rent, setRent] = useState("");
  const [status, setStatus] = useState<RoomStatus>("available");

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
    if (!room) return;
    setRoomNumber(room.roomNumber);
    const roomCapacity = room.capacity;
    setCapacity(
      BED_COUNT_OPTIONS.includes(roomCapacity as BedCount)
        ? (roomCapacity as BedCount)
        : BED_COUNT_OPTIONS[0],
    );
    setRent(String(room.rent));
    setStatus(room.status);
  }, [room]);

  const parsedRent = Number(rent);
  const isValid =
    roomNumber.trim().length > 0 &&
    capacity !== null &&
    capacity > 0 &&
    parsedRent > 0;

  const isBusy = isSaving || isDeleting;

  const handleSave = async () => {
    if (!isValid || isBusy || !hostelId || !roomId) return;
    Keyboard.dismiss();

    try {
      await updateRoom({
        hostelId,
        roomId,
        roomNumber: roomNumber.trim(),
        capacity,
        rent: parsedRent,
        status,
      }).unwrap();
      router.back();
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Could not update room."));
    }
  };

  const handleDelete = () => {
    if (!hostelId || !roomId || isBusy) return;

    Alert.alert(
      "Delete room",
      "This will permanently remove the room. Residents assigned to it may need to be moved first.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoom({ hostelId, roomId }).unwrap();
              router.back();
            } catch (error) {
              Alert.alert(
                "Error",
                getErrorMessage(error, "Could not delete room."),
              );
            }
          },
        },
      ],
    );
  };

  if (!hostelId || !roomId) {
    return (
      <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Missing room information.</Text>
          <CustomButton title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    </GradientBackground>
    );
  }

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

  if (!room) {
    return (
      <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Room not found.</Text>
          <CustomButton title="Go Back" onPress={() => router.back()} />
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
          <ScreenHeader title="Edit Room" showBack />

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.subtitle}>
              Update room details, capacity, rent, or availability status.
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

            <BedCountDropdown value={capacity} onChange={setCapacity} />

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

            {parsedRent > 0 ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Monthly rent</Text>
                <Text style={styles.summaryValue}>
                  Rs {parsedRent.toLocaleString()}
                </Text>
              </View>
            ) : null}

            <View style={styles.statusSection}>
              <Text style={styles.statusLabel}>Room Status</Text>
              <View style={styles.statusGrid}>
                {ROOM_STATUSES.map((option) => {
                  const isActive = status === option;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.statusChip,
                        isActive && styles.statusChipActive,
                      ]}
                      onPress={() => setStatus(option)}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          isActive && styles.statusChipTextActive,
                        ]}
                      >
                        {formatStatusLabel(option)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.actions}>
              <CustomButton
                title="Save Changes"
                onPress={handleSave}
                disabled={!isValid || isBusy}
                loading={isSaving}
              />

              <CustomButton
                title="Delete Room"
                onPress={handleDelete}
                variant="destructive"
                disabled={isBusy}
                loading={isDeleting}
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
      marginTop: vs(-8),
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
    statusSection: {
      marginBottom: vs(8),
    },
    statusLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(10),
    },
    statusGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: vs(10),
    },
    statusChip: {
      flexGrow: 1,
      flexBasis: "46%",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: vs(12),
      paddingHorizontal: vs(10),
      borderRadius: vs(14),
      backgroundColor: isDark ? colors.surfaceMuted : colors.background,
      borderWidth: 1.5,
      borderColor: isDark ? colors.chipBorder : colors.white100,
    },
    statusChipActive: {
      backgroundColor: isDark ? colors.primary400 : colors.primary,
      borderColor: colors.primary,
    },
    statusChipText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      textAlign: "center",
    },
    statusChipTextActive: {
      color: colors.onPrimary,
    },
    actions: {
      marginTop: vs(16),
      gap: vs(12),
    },
    deleteBtn: {
      marginTop: vs(16),
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    missingWrap: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: vs(32),
      gap: vs(20),
    },
    missingText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
    },
  });
}
