import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useMemo, type ReactNode } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type CustomButtonProps = {
  title: string | ReactNode;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function CustomButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
}: CustomButtonProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const handlePress = async () => {
    if (disabled) return;
    await onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {typeof title === "string" ? (
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      ) : (
        title
      )}
    </TouchableOpacity>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      width: "100%",
      paddingVertical: vs(14),
      borderRadius: vs(12),
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonDisabled: {
      backgroundColor: colors.gray100,
      opacity: 0.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.semiBold,
    },
  });
}
