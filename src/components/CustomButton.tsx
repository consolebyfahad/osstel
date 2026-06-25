import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, type ReactNode } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export type CustomButtonVariant =
  | "primary"
  | "destructive"
  | "outline"
  | "success";

export type CustomButtonSize = "md" | "sm";

type CustomButtonProps = {
  title: string | ReactNode;
  onPress: () => void | Promise<void>;
  variant?: CustomButtonVariant;
  size?: CustomButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function CustomButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = true,
  icon,
  style,
  textStyle,
}: CustomButtonProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const handlePress = async () => {
    if (disabled) return;
    await onPress();
  };

  const variantStyle = styles[`${variant}Button` as const];
  const variantTextStyle = styles[`${variant}Text` as const];
  const sizeStyle = size === "sm" ? styles.buttonSm : styles.buttonMd;
  const sizeTextStyle = size === "sm" ? styles.buttonTextSm : styles.buttonTextMd;
  const usesGradient = variant === "primary" && !disabled;

  const content =
    typeof title === "string" ? (
      <View style={styles.contentRow}>
        {icon}
        <Text
          style={[
            styles.buttonText,
            sizeTextStyle,
            variantTextStyle,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    ) : (
      title
    );

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyle,
        !usesGradient && variantStyle,
        fullWidth ? styles.buttonFullWidth : styles.buttonInline,
        disabled && styles.buttonDisabled,
        disabled && styles[`${variant}Disabled` as const],
        usesGradient && styles.gradientButton,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {usesGradient ? (
        <LinearGradient
          colors={[...colors.bannerGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {content}
    </TouchableOpacity>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    button: {
      borderRadius: vs(12),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "transparent",
    },
    buttonMd: {
      paddingVertical: vs(14),
    },
    buttonSm: {
      paddingVertical: vs(10),
      borderRadius: vs(10),
    },
    buttonInline: {
      alignSelf: "auto",
    },
    buttonFullWidth: {
      width: "100%",
      alignSelf: "stretch",
    },
    contentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: vs(6),
    },
    buttonText: {
      fontFamily: fonts.semiBold,
    },
    buttonTextMd: {
      fontSize: FONT_SIZES.xl,
    },
    buttonTextSm: {
      fontSize: FONT_SIZES.sm,
    },
    primaryButton: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    gradientButton: {
      overflow: "hidden",
      backgroundColor: "transparent",
    },
    primaryText: {
      color: colors.onPrimary,
    },
    primaryDisabled: {
      backgroundColor: colors.gray100,
      shadowOpacity: 0,
      elevation: 0,
    },
    destructiveButton: {
      backgroundColor: colors.error,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    destructiveText: {
      color: colors.onPrimary,
    },
    destructiveDisabled: {
      backgroundColor: colors.gray100,
      shadowOpacity: 0,
      elevation: 0,
    },
    outlineButton: {
      backgroundColor: colors.primary100,
      borderColor: colors.primary200,
    },
    outlineText: {
      color: colors.primary,
    },
    outlineDisabled: {
      opacity: 0.5,
    },
    successButton: {
      backgroundColor: colors.successBg,
      borderColor: colors.success,
    },
    successText: {
      color: colors.success,
    },
    successDisabled: {
      opacity: 0.5,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
}
