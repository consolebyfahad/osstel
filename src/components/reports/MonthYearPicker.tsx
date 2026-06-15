import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type MonthYearPickerProps = {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
};

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

export default function MonthYearPicker({
  month,
  year,
  onChange,
}: MonthYearPickerProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts),
    [colors, fonts],
  );

  const shiftMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }

    onChange(nextMonth, nextYear);
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.arrowBtn} onPress={() => shiftMonth(-1)}>
        <Ionicons name="chevron-back" size={vs(20)} color={colors.text} />
      </Pressable>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{MONTH_NAMES[month - 1]}</Text>
        <Text style={styles.year}>{year}</Text>
      </View>
      <Pressable style={styles.arrowBtn} onPress={() => shiftMonth(1)}>
        <Ionicons name="chevron-forward" size={vs(20)} color={colors.text} />
      </Pressable>
    </View>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(8),
      paddingVertical: vs(10),
      marginBottom: vs(12),
    },
    arrowBtn: {
      width: vs(36),
      height: vs(36),
      alignItems: "center",
      justifyContent: "center",
    },
    labelWrap: {
      alignItems: "center",
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    year: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginTop: vs(2),
    },
  });
}
