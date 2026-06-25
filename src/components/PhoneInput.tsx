import CustomInput from "@/components/CustomInput";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ReturnKeyType } from "react-native";

type PhoneInputProps = {
  label: string;
  value: string;
  onChangeText: (digits: string) => void;
  placeholder?: string;
  maxLength?: number;
  returnKeyType?: ReturnKeyType;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
};

export function PhonePrefix() {
  const { colors, fonts } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: vs(6),
        },
        flag: {
          fontSize: FONT_SIZES.lg,
        },
        code: {
          fontSize: FONT_SIZES.md,
          fontFamily: fonts.semiBold,
          color: colors.text,
        },
        divider: {
          width: 1,
          height: vs(20),
          backgroundColor: colors.gray100,
          marginHorizontal: vs(4),
        },
      }),
    [colors, fonts],
  );

  return (
    <View style={styles.row}>
      <Text style={styles.flag}>🇵🇰</Text>
      <Text style={styles.code}>+92</Text>
      <View style={styles.divider} />
    </View>
  );
}

export default function PhoneInput({
  label,
  value,
  onChangeText,
  placeholder = "3001234567",
  maxLength = 10,
  returnKeyType,
  onSubmitEditing,
  onFocus,
}: PhoneInputProps) {
  const handleChange = (text: string) => {
    onChangeText(text.replace(/[^0-9]/g, "").slice(0, maxLength));
  };

  return (
    <CustomInput
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={handleChange}
      keyboardType="phone-pad"
      maxLength={maxLength}
      leftAdornment={<PhonePrefix />}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      onFocus={onFocus}
    />
  );
}
