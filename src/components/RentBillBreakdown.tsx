import type { RentCharge } from "@/types/rent";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type RentBillBreakdownProps = {
  baseAmount: number;
  charges?: RentCharge[];
  totalAmount: number;
  compact?: boolean;
};

export default function RentBillBreakdown({
  baseAmount,
  charges = [],
  totalAmount,
  compact = false,
}: RentBillBreakdownProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, compact),
    [colors, fonts, compact],
  );

  if (!charges.length && baseAmount === totalAmount) {
    return (
      <View style={styles.wrap}>
        <Row
          label="Base rent"
          value={`Rs ${baseAmount.toLocaleString()}`}
          styles={styles}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Row
        label="Base rent"
        value={`Rs ${baseAmount.toLocaleString()}`}
        styles={styles}
      />
      {charges.map((charge, index) => (
        <Row
          key={`${charge.label}-${index}`}
          label={charge.label}
          value={`Rs ${charge.amount.toLocaleString()}`}
          styles={styles}
          muted
        />
      ))}
      <View style={styles.divider} />
      <Row
        label="Total due"
        value={`Rs ${totalAmount.toLocaleString()}`}
        styles={styles}
        bold
      />
    </View>
  );
}

function Row({
  label,
  value,
  styles,
  muted = false,
  bold = false,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.label,
          muted && styles.labelMuted,
          bold && styles.labelBold,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text style={[styles.value, bold && styles.valueBold]}>{value}</Text>
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  compact: boolean,
) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.primary100,
      borderRadius: vs(12),
      padding: compact ? vs(10) : vs(12),
      gap: vs(6),
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: vs(12),
    },
    label: {
      flex: 1,
      fontSize: compact ? FONT_SIZES.sm : FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    labelMuted: {
      color: colors.gray300,
      fontSize: FONT_SIZES.sm,
    },
    labelBold: {
      fontFamily: fonts.semiBold,
    },
    value: {
      fontSize: compact ? FONT_SIZES.sm : FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    valueBold: {
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: vs(2),
    },
  });
}
