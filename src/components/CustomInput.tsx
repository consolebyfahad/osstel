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
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoCorrect?: boolean;
  returnKeyType?: ReturnKeyType;
  onSubmitEditing?: () => void;
  maxLength?: number;
  leftAdornment?: ReactNode;
};

export default function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
  autoCapitalize = "none",
  autoCorrect = false,
  returnKeyType = "next",
  onSubmitEditing,
  maxLength,
  leftAdornment,
}: CustomInputProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
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
          placeholderTextColor={colors.gray100}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
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
    </View>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
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
      borderRadius: vs(16),
      backgroundColor: colors.white,
      minHeight: vs(56),
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
  });
}
