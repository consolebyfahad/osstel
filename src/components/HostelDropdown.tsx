import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export type HostelOption = {
  id: string;
  name: string;
};

type DropdownItem = {
  label: string;
  value: string;
};

type HostelDropdownProps = {
  hostels: HostelOption[];
  value: string;
  onChange: (hostelId: string) => void;
  showAllOption?: boolean;
};

export default function HostelDropdown({
  hostels,
  value,
  onChange,
  showAllOption = true,
}: HostelDropdownProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const data: DropdownItem[] = useMemo(() => {
    const items =
      showAllOption && hostels.length > 1
        ? [{ label: "All Hostels", value: "all" }]
        : [];
    return [
      ...items,
      ...hostels.map((hostel) => ({
        label: hostel.name,
        value: hostel.id,
      })),
    ];
  }, [hostels, showAllOption]);

  if (hostels.length === 0) return null;

  return (
    <View style={styles.wrapper}>
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
        maxHeight={vs(260)}
        labelField="label"
        valueField="value"
        placeholder="Select hostel"
        searchPlaceholder="Search hostels..."
        value={value}
        search={hostels.length > 3}
        mode="default"
        fontFamily={fonts.semiBold}
        onChange={(item) => onChange(item.value)}
        renderLeftIcon={() => (
          <Ionicons
            name="business-outline"
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
    dropdown: {
      height: vs(48),
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
      paddingHorizontal: vs(14),
    },
    dropdownContainer: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
      overflow: "hidden",
    },
    placeholderStyle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    selectedTextStyle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
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
