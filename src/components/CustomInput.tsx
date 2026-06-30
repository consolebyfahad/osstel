import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, type ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyType,
} from "react-native";

type CustomInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoCorrect?: boolean;
  returnKeyType?: ReturnKeyType;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  maxLength?: number;
  leftAdornment?: ReactNode;
  multiline?: boolean;
};

export default function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  hint,
  keyboardType = "default",
  secureTextEntry = false,
  autoCapitalize = "none",
  autoCorrect = false,
  returnKeyType = "next",
  onSubmitEditing,
  onFocus,
  maxLength,
  leftAdornment,
  multiline = false,
}: CustomInputProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const [visible, setVisible] = useState(false);
  const isSecure = secureTextEntry && !visible;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {leftAdornment ? (
          <View style={styles.leftAdornment}>{leftAdornment}</View>
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.disabledText}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          maxLength={maxLength}
          multiline={multiline}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setVisible((prev) => !prev)}
            hitSlop={8}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={vs(20)}
              color={colors.gray200}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
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
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: vs(14),
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderWidth: 1,
      borderColor: isDark ? colors.border : colors.borderSubtle,
      minHeight: vs(52),
      paddingHorizontal: vs(14),
      gap: vs(8),
    },
    leftAdornment: {
      flexDirection: "row",
      alignItems: "center",
    },
    input: {
      flex: 1,
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.medium,
      color: colors.text,
      paddingVertical: Platform.OS === "ios" ? vs(14) : vs(10),
    },
    hint: {
      marginTop: vs(6),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray,
    },
  });
}
