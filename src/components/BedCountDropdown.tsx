import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export const BED_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;
export type BedCount = (typeof BED_COUNT_OPTIONS)[number];

type DropdownItem = {
  label: string;
  value: string;
};

type BedCountDropdownProps = {
  label?: string;
  value: number | null;
  onChange: (count: BedCount) => void;
  placeholder?: string;
};

function formatBedLabel(count: number) {
  return `${count} bed${count === 1 ? "" : "s"}`;
}

export default function BedCountDropdown({
  label = "Capacity (Beds)",
  value,
  onChange,
  placeholder = "Select number of beds",
}: BedCountDropdownProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const data: DropdownItem[] = useMemo(
    () =>
      BED_COUNT_OPTIONS.map((count) => ({
        label: formatBedLabel(count),
        value: String(count),
      })),
    [],
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Dropdown
        style={styles.dropdown}
        containerStyle={styles.dropdownContainer}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        itemTextStyle={styles.itemTextStyle}
        itemContainerStyle={styles.itemContainer}
        activeColor={colors.primary100}
        iconColor={colors.gray200}
        data={data}
        maxHeight={vs(240)}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value !== null ? String(value) : null}
        search={false}
        mode="default"
        fontFamily={fonts.semiBold}
        onChange={(item) => onChange(Number(item.value) as BedCount)}
        renderLeftIcon={() => (
          <Ionicons
            name="bed-outline"
            size={vs(18)}
            color={colors.primary}
            style={styles.leftIcon}
          />
        )}
      />
    </View>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: vs(16),
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    dropdown: {
      height: vs(52),
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: isDark ? colors.border : colors.borderSubtle,
      paddingHorizontal: vs(14),
    },
    dropdownContainer: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: isDark ? colors.border : colors.borderSubtle,
      overflow: "hidden",
    },
    placeholderStyle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.disabledText,
    },
    selectedTextStyle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    itemTextStyle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    itemContainer: {
      borderRadius: vs(8),
    },
    leftIcon: {
      marginRight: vs(8),
    },
  });
}
