import CustomButton from "@/components/CustomButton";
import { getRooms } from "@/services/rooms";
import { addTenant } from "@/services/tenants";
import type { Room } from "@/types/room";
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

export default function AddTenant() {
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, insets.bottom),
    [colors, fonts, insets.bottom],
  );

  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [cnic, setCnic] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getRooms().then((roomList) => {
      setRooms(roomList);
      if (roomId && roomList.some((r) => r.id === roomId)) {
        setSelectedRoomId(roomId);
      }
    });
  }, [roomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  const isValid =
    name.trim().length > 0 &&
    phoneDigits.length >= 9 &&
    selectedRoomId !== null;

  const handleSave = async () => {
    if (!isValid || !selectedRoom || isSaving) return;
    Keyboard.dismiss();
    setIsSaving(true);

    try {
      await addTenant({
        name: name.trim(),
        phone: `+92${phoneDigits}`,
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.roomNumber,
        cnic: cnic.trim() || undefined,
        moveInDate: moveInDate.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Could not save tenant. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
              <Text style={styles.headerTitle}>Add Tenant</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.subtitle}>
                Register a new tenant and assign them to a room.
              </Text>

              {rooms.length === 0 ? (
                <View style={styles.emptyRooms}>
                  <Ionicons
                    name="home-outline"
                    size={vs(32)}
                    color={colors.warning}
                  />
                  <Text style={styles.emptyRoomsTitle}>No rooms yet</Text>
                  <Text style={styles.emptyRoomsText}>
                    Add a room before registering a tenant.
                  </Text>
                  <Pressable
                    style={styles.addRoomLink}
                    onPress={() => router.push("/rooms/add")}
                  >
                    <Text style={styles.addRoomLinkText}>Add Room</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Ali Khan"
                      placeholderTextColor={colors.gray100}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <View style={styles.phoneRow}>
                      <View style={styles.countryCode}>
                        <Text style={styles.flag}>🇵🇰</Text>
                        <Text style={styles.code}>+92</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="300 1234567"
                        placeholderTextColor={colors.gray100}
                        value={phoneDigits}
                        onChangeText={(text) =>
                          setPhoneDigits(text.replace(/[^0-9]/g, "").slice(0, 10))
                        }
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Assign Room</Text>
                    <View style={styles.roomList}>
                      {rooms.map((room) => {
                        const isSelected = selectedRoomId === room.id;
                        return (
                          <Pressable
                            key={room.id}
                            style={[
                              styles.roomCard,
                              isSelected && styles.roomCardSelected,
                            ]}
                            onPress={() => setSelectedRoomId(room.id)}
                          >
                            <View style={styles.roomCardHeader}>
                              <Text
                                style={[
                                  styles.roomNumber,
                                  isSelected && styles.roomNumberSelected,
                                ]}
                              >
                                Room {room.roomNumber}
                              </Text>
                              {isSelected ? (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={vs(20)}
                                  color={colors.primary}
                                />
                              ) : null}
                            </View>
                            <Text style={styles.roomMeta}>
                              {room.totalBeds} beds · Rs{" "}
                              {room.monthlyRentPerBed.toLocaleString()}/bed
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>CNIC (optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 35202-1234567-1"
                      placeholderTextColor={colors.gray100}
                      value={cnic}
                      onChangeText={setCnic}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Move-in Date (optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.gray100}
                      value={moveInDate}
                      onChangeText={setMoveInDate}
                    />
                  </View>

                  {selectedRoom ? (
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>Monthly rent</Text>
                      <Text style={styles.summaryValue}>
                        Rs {selectedRoom.monthlyRentPerBed.toLocaleString()} /
                        bed
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>

            {rooms.length > 0 ? (
              <View style={styles.footer}>
                <CustomButton
                  title={isSaving ? "Saving..." : "Save Tenant"}
                  onPress={handleSave}
                  disabled={!isValid || isSaving}
                />
              </View>
            ) : null}
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
    roomList: {
      gap: vs(10),
    },
    roomCard: {
      borderRadius: vs(14),
      borderWidth: 1.5,
      borderColor: colors.white100,
      backgroundColor: colors.white,
      padding: vs(14),
    },
    roomCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary100,
    },
    roomCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: vs(4),
    },
    roomNumber: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    roomNumberSelected: {
      color: colors.primary,
    },
    roomMeta: {
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
