import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import GradientBackground from "@/components/GradientBackground";
import RentBillBreakdown from "@/components/RentBillBreakdown";
import ScreenHeader from "@/components/ScreenHeader";
import { getApiErrorMessage } from "@/utils/api";
import {
  useFinalizeRentBillMutation,
  useGetRentBillPreviewQuery,
} from "../../../../store/api";
import type { RentBillCharge } from "@/types/meter";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ExtraChargeRow = { label: string; amount: string };

export default function FinalizeRentBillScreen() {
  const { rentId } = useLocalSearchParams<{ rentId: string }>();
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const { data, isLoading, refetch } = useGetRentBillPreviewQuery(rentId!, {
    skip: !rentId,
  });
  const [finalizeBill, { isLoading: isSaving }] = useFinalizeRentBillMutation();
  const [extraCharges, setExtraCharges] = useState<ExtraChargeRow[]>([]);
  const preview = data;

  useEffect(() => {
    if (!preview?.currentCharges?.length) return;
    const existingExtras = preview.currentCharges
      .filter((charge: RentBillCharge) => charge.type === "extra")
      .map((charge: RentBillCharge) => ({
        label: charge.label,
        amount: String(charge.amount),
      }));
    if (existingExtras.length) {
      setExtraCharges(existingExtras);
    }
  }, [preview?.currentCharges]);

  const meterCharges = preview?.meterCharges ?? [];
  const extrasTotal = extraCharges.reduce((sum, row) => {
    const value = Number(row.amount);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);
  const projectedTotal =
    (preview?.baseAmount ?? 0) +
    meterCharges.reduce((sum: number, charge: RentBillCharge) => sum + charge.amount, 0) +
    extrasTotal;

  const addExtraRow = () => {
    setExtraCharges((rows) => [...rows, { label: "", amount: "" }]);
  };

  const updateExtraRow = (
    index: number,
    field: keyof ExtraChargeRow,
    value: string,
  ) => {
    setExtraCharges((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const removeExtraRow = (index: number) => {
    setExtraCharges((rows) => rows.filter((_, i) => i !== index));
  };

  const handleFinalize = async () => {
    if (!rentId) return;

    const parsedExtras = extraCharges
      .filter((row) => row.label.trim() && row.amount.trim())
      .map((row) => ({
        label: row.label.trim(),
        amount: Number(row.amount),
      }));

    for (const extra of parsedExtras) {
      if (Number.isNaN(extra.amount) || extra.amount < 0) {
        Alert.alert("Invalid extra charge", "Check extra charge amounts.");
        return;
      }
    }

    try {
      await finalizeBill({
        paymentId: rentId,
        extraCharges: parsedExtras,
      }).unwrap();
      Alert.alert("Bill finalized", "The resident can now see the updated total.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Could not finalize", getApiErrorMessage(error));
    }
  };

  if (isLoading || !preview) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScreenHeader title="Finalize Bill" showBack />
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
        <ScreenHeader
          title="Finalize Bill"
          subtitle={`${preview.month}/${preview.year}`}
          showBack
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.intro}>
            Utility charges are split among {preview.residentCount} resident
            {preview.residentCount === 1 ? "" : "s"} in this room.
          </Text>

          {preview.readings.length === 0 ? (
            <Text style={styles.warning}>
              No meter readings recorded for this month. Record readings from
              the room billing screen first, or add manual extra charges below.
            </Text>
          ) : null}

          <RentBillBreakdown
            baseAmount={preview.baseAmount}
            charges={meterCharges}
            totalAmount={projectedTotal}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Extra charges</Text>
            <Pressable onPress={addExtraRow}>
              <Text style={styles.addLink}>+ Add</Text>
            </Pressable>
          </View>

          {extraCharges.map((row, index) => (
            <View key={index} style={styles.extraRow}>
              <View style={styles.extraInputs}>
                <CustomInput
                  label="Description"
                  placeholder="e.g. Water tanker"
                  value={row.label}
                  onChangeText={(text) => updateExtraRow(index, "label", text)}
                />
                <CustomInput
                  label="Amount (Rs)"
                  placeholder="500"
                  value={row.amount}
                  onChangeText={(text) =>
                    updateExtraRow(index, "amount", text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                />
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => removeExtraRow(index)}
              >
                <Ionicons name="trash-outline" size={vs(18)} color={colors.error} />
              </Pressable>
            </View>
          ))}

          {preview.billFinalizedAt ? (
            <Text style={styles.finalizedNote}>
              Last finalized:{" "}
              {new Date(preview.billFinalizedAt).toLocaleString()}
            </Text>
          ) : null}

          <CustomButton
            title="Finalize & Notify Resident"
            onPress={() => void handleFinalize()}
            loading={isSaving}
            disabled={preview.status === "paid" || preview.status === "review"}
          />

          <CustomButton
            title="Refresh preview"
            variant="outline"
            onPress={() => void refetch()}
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
      gap: vs(12),
    },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    intro: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
    },
    warning: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.warning,
      lineHeight: vs(18),
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: vs(8),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    addLink: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    extraRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: vs(8),
    },
    extraInputs: { flex: 1, gap: vs(4) },
    removeBtn: {
      padding: vs(10),
      marginBottom: vs(8),
    },
    finalizedNote: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
  });
}
