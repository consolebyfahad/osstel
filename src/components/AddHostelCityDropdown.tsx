import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

/** Cities available when creating a new hostel (add hostel screen only). */
export const ADD_HOSTEL_CITIES = [
  "Lahore",
  "Islamabad",
  "Faisalabad",
  "Multan",
] as const;

export type AddHostelCity = (typeof ADD_HOSTEL_CITIES)[number];

type DropdownItem = {
  label: string;
  value: AddHostelCity;
};

type AddHostelCityDropdownProps = {
  value: AddHostelCity | null;
  onChange: (city: AddHostelCity) => void;
  placeholder?: string;
};

export default function AddHostelCityDropdown({
  value,
  onChange,
  placeholder = "Select city",
}: AddHostelCityDropdownProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const data: DropdownItem[] = useMemo(
    () =>
      ADD_HOSTEL_CITIES.map((city) => ({
        label: city,
        value: city,
      })),
    [],
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>City</Text>
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
        maxHeight={vs(220)}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value}
        search={false}
        mode="default"
        fontFamily={fonts.semiBold}
        onChange={(item) => onChange(item.value)}
        renderLeftIcon={() => (
          <Ionicons
            name="location-outline"
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
