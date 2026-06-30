import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import { getApiErrorMessage } from "@/utils/api";
import {
  useCreateRoomMeterMutation,
  useDeleteRoomMeterMutation,
  useGetRoomMetersQuery,
  useUpdateRoomMeterMutation,
} from "../../../store/api";
import type { RoomMeter } from "@/types/meter";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoomMetersScreen() {
  const { hostelId, roomId } = useLocalSearchParams<{
    hostelId: string;
    roomId: string;
  }>();
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const { data, isLoading, refetch } = useGetRoomMetersQuery(
    { hostelId: hostelId!, roomId: roomId! },
    { skip: !hostelId || !roomId },
  );
  const [createMeter, { isLoading: isCreating }] = useCreateRoomMeterMutation();
  const [updateMeter, { isLoading: isUpdating }] = useUpdateRoomMeterMutation();
  const [deleteMeter] = useDeleteRoomMeterMutation();

  const [name, setName] = useState("");
  const [unitLabel, setUnitLabel] = useState("kWh");
  const [ratePerUnit, setRatePerUnit] = useState("");
  const [lastReading, setLastReading] = useState("");
  const [editingMeter, setEditingMeter] = useState<RoomMeter | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnitLabel, setEditUnitLabel] = useState("");
  const [editRatePerUnit, setEditRatePerUnit] = useState("");

  const meters = data?.meters ?? [];

  const startEdit = (meter: RoomMeter) => {
    setEditingMeter(meter);
    setEditName(meter.name);
    setEditUnitLabel(meter.unitLabel);
    setEditRatePerUnit(String(meter.ratePerUnit));
  };

  const cancelEdit = () => {
    setEditingMeter(null);
    setEditName("");
    setEditUnitLabel("");
    setEditRatePerUnit("");
  };

  const handleSaveEdit = async () => {
    if (!hostelId || !roomId || !editingMeter) return;
    if (!editName.trim() || !editRatePerUnit.trim()) {
      Alert.alert("Missing fields", "Enter meter name and rate per unit.");
      return;
    }

    try {
      await updateMeter({
        hostelId,
        roomId,
        meterId: editingMeter.id,
        name: editName.trim(),
        unitLabel: editUnitLabel.trim() || "unit",
        ratePerUnit: Number(editRatePerUnit),
      }).unwrap();
      cancelEdit();
      refetch();
    } catch (error) {
      Alert.alert("Could not update meter", getApiErrorMessage(error));
    }
  };

  const handleAdd = async () => {
    if (!hostelId || !roomId || !name.trim() || !ratePerUnit.trim()) {
      Alert.alert("Missing fields", "Enter meter name and rate per unit.");
      return;
    }

    try {
      await createMeter({
        hostelId,
        roomId,
        name: name.trim(),
        unitLabel: unitLabel.trim() || "unit",
        ratePerUnit: Number(ratePerUnit),
        lastReading: lastReading.trim() ? Number(lastReading) : 0,
      }).unwrap();
      setName("");
      setRatePerUnit("");
      setLastReading("");
      refetch();
    } catch (error) {
      Alert.alert("Could not add meter", getApiErrorMessage(error));
    }
  };

  const handleDelete = (meterId: string, meterName: string) => {
    if (!hostelId || !roomId) return;
    Alert.alert("Delete meter", `Remove ${meterName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMeter({ hostelId, roomId, meterId }).unwrap();
            refetch();
          } catch (error) {
            Alert.alert("Delete failed", getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Room Meters" showBack />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.intro}>
            Add sub-meters for this room (electricity, gas, etc.). Readings are
            recorded monthly when you generate bills.
          </Text>

          {isLoading ? (
            <CustomLoading size="md" />
          ) : meters.length === 0 ? (
            <Text style={styles.empty}>No meters yet. Add one below.</Text>
          ) : (
            meters.map((meter) => (
              <View key={meter.id} style={styles.card}>
                {editingMeter?.id === meter.id ? (
                  <View style={styles.editForm}>
                    <CustomInput
                      label="Meter name"
                      placeholder="Electricity"
                      value={editName}
                      onChangeText={setEditName}
                    />
                    <CustomInput
                      label="Unit label"
                      placeholder="kWh"
                      value={editUnitLabel}
                      onChangeText={setEditUnitLabel}
                    />
                    <CustomInput
                      label="Rate per unit (Rs)"
                      placeholder="45"
                      value={editRatePerUnit}
                      onChangeText={(text) =>
                        setEditRatePerUnit(text.replace(/[^0-9.]/g, ""))
                      }
                      keyboardType="decimal-pad"
                    />
                    <View style={styles.editActions}>
                      <CustomButton
                        title="Save"
                        size="sm"
                        fullWidth={false}
                        onPress={() => void handleSaveEdit()}
                        loading={isUpdating}
                      />
                      <CustomButton
                        title="Cancel"
                        size="sm"
                        variant="outline"
                        fullWidth={false}
                        onPress={cancelEdit}
                      />
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{meter.name}</Text>
                      <Text style={styles.cardMeta}>
                        Rs {meter.ratePerUnit}/{meter.unitLabel} · Last reading:{" "}
                        {meter.lastReading}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable onPress={() => startEdit(meter)}>
                        <Ionicons
                          name="create-outline"
                          size={vs(20)}
                          color={colors.primary}
                        />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(meter.id, meter.name)}>
                        <Ionicons
                          name="trash-outline"
                          size={vs(20)}
                          color={colors.error}
                        />
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>Add meter</Text>
          <CustomInput
            label="Meter name"
            placeholder="Electricity"
            value={name}
            onChangeText={setName}
          />
          <CustomInput
            label="Unit label"
            placeholder="kWh"
            value={unitLabel}
            onChangeText={setUnitLabel}
          />
          <CustomInput
            label="Rate per unit (Rs)"
            placeholder="45"
            value={ratePerUnit}
            onChangeText={(text) => setRatePerUnit(text.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
          />
          <CustomInput
            label="Starting / last reading"
            placeholder="0"
            value={lastReading}
            onChangeText={(text) => setLastReading(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
          />
          <CustomButton
            title="Add Meter"
            onPress={() => void handleAdd()}
            loading={isCreating}
          />

          <CustomButton
            title="Record Monthly Readings"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: "/rooms/meter-billing",
                params: { hostelId, roomId },
              })
            }
          />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    intro: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
      marginBottom: vs(16),
    },
    empty: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(16),
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.white,
      borderRadius: vs(12),
      padding: vs(14),
      marginBottom: vs(10),
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardBody: { flex: 1 },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(12),
    },
    editForm: {
      flex: 1,
      gap: vs(8),
    },
    editActions: {
      flexDirection: "row",
      gap: vs(8),
      marginTop: vs(4),
    },
    cardTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    cardMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginTop: vs(2),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginTop: vs(16),
      marginBottom: vs(8),
    },
  });
}
