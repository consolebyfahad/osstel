import type { Room } from "@/types/room";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

type DropdownItem = {
  label: string;
  value: string;
};

type RoomDropdownProps = {
  rooms: Room[];
  hostelNames?: Record<string, string>;
  vacancyByRoomId?: Record<string, number>;
  value: string | null;
  onChange: (roomId: string) => void;
  placeholder?: string;
};

function buildRoomLabel(
  room: Room,
  hostelNames?: Record<string, string>,
  vacancyByRoomId?: Record<string, number>,
) {
  const hostelName = hostelNames?.[room.hostel];
  const vacant = vacancyByRoomId?.[room._id];
  const vacantLabel =
    vacant !== undefined
      ? `${vacant} vacant · Rs ${room.rent.toLocaleString()}/mo`
      : `${room.capacity} beds · Rs ${room.rent.toLocaleString()}/mo`;
  const roomLabel = `Room ${room.roomNumber} · ${vacantLabel}`;

  return hostelName ? `${hostelName} — ${roomLabel}` : roomLabel;
}

export default function RoomDropdown({
  rooms,
  hostelNames,
  vacancyByRoomId,
  value,
  onChange,
  placeholder = "Select room",
}: RoomDropdownProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const data: DropdownItem[] = useMemo(
    () =>
      [...rooms]
        .sort((a, b) =>
          a.roomNumber.localeCompare(b.roomNumber, undefined, {
            numeric: true,
          }),
        )
        .map((room) => ({
          label: buildRoomLabel(room, hostelNames, vacancyByRoomId),
          value: room._id,
        })),
    [hostelNames, rooms, vacancyByRoomId],
  );

  if (rooms.length === 0) return null;

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
        maxHeight={vs(280)}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        searchPlaceholder="Search rooms..."
        value={value}
        search={rooms.length > 4}
        mode="default"
        fontFamily={fonts.semiBold}
        onChange={(item) => onChange(item.value)}
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
      marginBottom: 0,
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
