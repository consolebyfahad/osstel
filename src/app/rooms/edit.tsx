import CustomButton from "@/components/CustomButton";
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
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
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
  TouchableWithoutFeedback,
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
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom),
    [colors, fonts, insets.bottom],
  );

  const room = data?.rooms?.find((item: Room) => item._id === roomId);

  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [rent, setRent] = useState("");
  const [status, setStatus] = useState<RoomStatus>("available");

  useEffect(() => {
    if (!room) return;
    setRoomNumber(room.roomNumber);
    setCapacity(String(room.capacity));
    setRent(String(room.rent));
    setStatus(room.status);
  }, [room]);

  const isValid =
    roomNumber.trim().length > 0 &&
    Number(capacity) > 0 &&
    Number(rent) > 0;

  const isBusy = isSaving || isDeleting;

  const handleSave = async () => {
    if (!isValid || isBusy || !hostelId || !roomId) return;
    Keyboard.dismiss();

    try {
      await updateRoom({
        hostelId,
        roomId,
        roomNumber: roomNumber.trim(),
        capacity: Number(capacity),
        rent: Number(rent),
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Missing room information.</Text>
          <CustomButton title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <CustomLoading size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Room not found.</Text>
          <CustomButton title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <ScreenHeader title="Edit Room" showBack />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.field}>
                <Text style={styles.label}>Room Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 201"
                  placeholderTextColor={colors.gray100}
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Capacity (Beds)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3"
                  placeholderTextColor={colors.gray100}
                  value={capacity}
                  onChangeText={(text) =>
                    setCapacity(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Monthly Rent (Rs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 18000"
                  placeholderTextColor={colors.gray100}
                  value={rent}
                  onChangeText={(text) => setRent(text.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={7}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusRow}>
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

              <Pressable
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={isBusy}
              >
                <Text style={styles.deleteBtnText}>
                  {isDeleting ? "Deleting..." : "Delete Room"}
                </Text>
              </Pressable>
            </ScrollView>

            <View style={styles.footer}>
              <CustomButton
                title={isSaving ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                disabled={!isValid || isBusy}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    statusRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: vs(8),
    },
    statusChip: {
      paddingHorizontal: vs(12),
      paddingVertical: vs(8),
      borderRadius: vs(20),
      backgroundColor: colors.white100,
    },
    statusChipActive: {
      backgroundColor: colors.primary100,
    },
    statusChipText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    statusChipTextActive: {
      color: colors.primary,
      fontFamily: fonts.semiBold,
    },
    deleteBtn: {
      marginTop: vs(12),
      paddingVertical: vs(14),
      alignItems: "center",
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.error,
    },
    deleteBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.error,
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
