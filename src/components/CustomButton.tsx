import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function CustomButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const handlePress = async () => {
    if (disabled) return;
    await onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      width: "100%",
      height: 52,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    buttonDisabled: {
      backgroundColor: colors.gray100,
      opacity: 0.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: colors.white,
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.semiBold,
    },
  });
}
