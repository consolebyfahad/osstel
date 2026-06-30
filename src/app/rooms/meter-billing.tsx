import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import { getApiErrorMessage } from "@/utils/api";
import {
  useFinalizeRoomBillsMutation,
  useGetRoomMeterReadingsQuery,
  useRecordRoomMeterReadingsMutation,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function RoomMeterBillingScreen() {
  const { hostelId, roomId } = useLocalSearchParams<{
    hostelId: string;
    roomId: string;
  }>();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const shiftPeriod = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };

  const isCurrentPeriod =
    month === now.getMonth() + 1 && year === now.getFullYear();

  const { data, isLoading, refetch } = useGetRoomMeterReadingsQuery(
    { hostelId: hostelId!, roomId: roomId!, month, year },
    { skip: !hostelId || !roomId },
  );
  const [recordReadings, { isLoading: isSaving }] =
    useRecordRoomMeterReadingsMutation();
  const [finalizeBills, { isLoading: isFinalizing }] =
    useFinalizeRoomBillsMutation();

  const [readings, setReadings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data?.meters) return;
    const initial: Record<string, string> = {};
    for (const meter of data.meters) {
      initial[meter.id] = meter.reading
        ? String(meter.reading.currentReading)
        : String(meter.lastReading ?? "");
    }
    setReadings(initial);
  }, [data?.meters, month, year]);

  const handleSaveReadings = async () => {
    if (!hostelId || !roomId || !data?.meters.length) return;

    for (const meter of data.meters) {
      const raw = readings[meter.id] ?? String(meter.lastReading ?? "");
      const currentReading = Number(raw);
      const previousReading = meter.reading
        ? meter.reading.previousReading
        : meter.lastReading ?? 0;

      if (Number.isNaN(currentReading) || currentReading < 0) {
        Alert.alert(
          "Invalid reading",
          `Enter a valid current reading for ${meter.name}.`,
        );
        return;
      }

      if (currentReading < previousReading) {
        Alert.alert(
          "Reading too low",
          `${meter.name}: current reading (${currentReading}) cannot be less than the previous reading (${previousReading}).`,
        );
        return;
      }
    }

    try {
      await recordReadings({
        hostelId,
        roomId,
        month,
        year,
        readings: data.meters.map((meter) => ({
          meterId: meter.id,
          currentReading: Number(readings[meter.id] ?? meter.lastReading),
        })),
      }).unwrap();
      Alert.alert("Saved", "Meter readings saved.");
      refetch();
    } catch (error) {
      Alert.alert("Save failed", getApiErrorMessage(error));
    }
  };

  const handleFinalizeAll = async () => {
    if (!hostelId || !roomId) return;

    Alert.alert(
      "Finalize room bills",
      "This will update rent bills for all residents in this room and notify them.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finalize",
          onPress: async () => {
            try {
              const result = await finalizeBills({
                hostelId,
                roomId,
                month,
                year,
              }).unwrap();
              Alert.alert(
                "Bills finalized",
                `${result.finalized.length} resident bill(s) updated.${
                  result.skipped.length
                    ? ` ${result.skipped.length} skipped (already paid/review).`
                    : ""
                }`,
                [{ text: "OK", onPress: () => router.back() }],
              );
            } catch (error) {
              Alert.alert("Finalize failed", getApiErrorMessage(error));
            }
          },
        },
      ],
    );
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader
          title="Monthly Billing"
          subtitle={`${MONTH_NAMES[month - 1]} ${year}`}
          showBack
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.periodRow}>
            <Pressable
              style={styles.periodBtn}
              onPress={() => shiftPeriod(-1)}
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={vs(20)} color={colors.primary} />
            </Pressable>
            <Text style={styles.periodLabel}>
              {MONTH_NAMES[month - 1]} {year}
            </Text>
            <Pressable
              style={[
                styles.periodBtn,
                isCurrentPeriod && styles.periodBtnDisabled,
              ]}
              onPress={() => !isCurrentPeriod && shiftPeriod(1)}
              disabled={isCurrentPeriod}
              accessibilityLabel="Next month"
            >
              <Ionicons
                name="chevron-forward"
                size={vs(20)}
                color={isCurrentPeriod ? colors.gray200 : colors.primary}
              />
            </Pressable>
          </View>

          <Text style={styles.intro}>
            Enter current meter readings, save, then finalize bills. Utility
            charges are split equally among residents in the room.
          </Text>

          {isLoading ? (
            <CustomLoading size="md" />
          ) : !data?.meters.length ? (
            <Text style={styles.empty}>
              No meters on this room. Add meters first.
            </Text>
          ) : (
            <>
              <Text style={styles.meta}>
                {data.residentCount} active resident
                {data.residentCount === 1 ? "" : "s"} in room
              </Text>
              {data.meters.map((meter) => (
                <View key={meter.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{meter.name}</Text>
                  <Text style={styles.cardMeta}>
                    Previous: {meter.lastReading} {meter.unitLabel} · Rs{" "}
                    {meter.ratePerUnit}/{meter.unitLabel}
                  </Text>
                  <CustomInput
                    label={`Current reading (${meter.unitLabel})`}
                    placeholder={String(meter.lastReading)}
                    value={readings[meter.id] ?? ""}
                    onChangeText={(text) =>
                      setReadings((prev) => ({
                        ...prev,
                        [meter.id]: text.replace(/[^0-9]/g, ""),
                      }))
                    }
                    keyboardType="number-pad"
                  />
                  {meter.reading ? (
                    <Text style={styles.savedReading}>
                      Saved: {meter.reading.unitsConsumed} {meter.unitLabel} = Rs{" "}
                      {meter.reading.totalAmount.toLocaleString()}
                    </Text>
                  ) : null}
                </View>
              ))}

              <CustomButton
                title="Save Readings"
                onPress={() => void handleSaveReadings()}
                loading={isSaving}
              />
              <CustomButton
                title="Finalize All Resident Bills"
                variant="success"
                onPress={() => void handleFinalizeAll()}
                loading={isFinalizing}
              />
            </>
          )}
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
      gap: vs(10),
    },
    periodRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: vs(4),
    },
    periodBtn: {
      width: vs(40),
      height: vs(40),
      borderRadius: vs(12),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary100,
    },
    periodBtnDisabled: {
      opacity: 0.5,
    },
    periodLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    intro: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
    },
    empty: {
      fontSize: FONT_SIZES.sm,
      color: colors.gray200,
    },
    meta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: vs(12),
      padding: vs(14),
      borderWidth: 1,
      borderColor: colors.border,
      gap: vs(4),
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
      marginBottom: vs(4),
    },
    savedReading: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.success,
    },
  });
}
