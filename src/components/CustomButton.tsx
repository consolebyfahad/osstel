import CustomLoading from "@/components/CustomLoading";
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
  title: string;
  onPress: () => void | Promise<void>;
  variant?: CustomButtonVariant;
  size?: CustomButtonSize;
  disabled?: boolean;
  loading?: boolean;
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
  loading = false,
  fullWidth = true,
  icon,
  style,
  textStyle,
}: CustomButtonProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, isDark),
    [colors, isDark],
  );

  const isInactive = disabled || loading;
  const usesGradient = variant === "primary" && !disabled;

  const handlePress = async () => {
    if (isInactive) return;
    await onPress();
  };

  const variantStyle = styles[`${variant}Button` as const];
  const variantTextStyle = styles[`${variant}Text` as const];
  const sizeStyle = size === "sm" ? styles.buttonSm : styles.buttonMd;
  const sizeTextStyle = size === "sm" ? styles.buttonTextSm : styles.buttonTextMd;
  const disabledStyle = disabled ? styles[`${variant}Disabled` as const] : null;
  const disabledTextStyle = disabled ? styles.disabledText : null;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyle,
        !usesGradient && variantStyle,
        fullWidth ? styles.buttonFullWidth : styles.buttonInline,
        disabledStyle,
        usesGradient && styles.gradientButton,
        style,
      ]}
      onPress={handlePress}
      disabled={isInactive}
      activeOpacity={0.85}
    >
      {usesGradient ? (
        <LinearGradient
          colors={[...colors.buttonGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View style={styles.contentRow}>
        <View style={[styles.contentInner, loading && styles.hiddenContent]}>
          {icon}
          <Text
            style={[
              styles.buttonText,
              sizeTextStyle,
              variantTextStyle,
              disabledTextStyle,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
        {loading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <CustomLoading size="xs" />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    button: {
      borderRadius: vs(12),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "transparent",
      minHeight: vs(48),
    },
    buttonMd: {
      paddingVertical: vs(14),
      paddingHorizontal: vs(16),
    },
    buttonSm: {
      paddingVertical: vs(10),
      paddingHorizontal: vs(12),
      borderRadius: vs(10),
      minHeight: vs(40),
    },
    buttonInline: {
      alignSelf: "auto",
    },
    buttonFullWidth: {
      width: "100%",
      alignSelf: "stretch",
    },
    contentRow: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      minHeight: vs(20),
    },
    contentInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: vs(8),
    },
    hiddenContent: {
      opacity: 0,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      fontFamily: FONTS.semiBold,
    },
    buttonTextMd: {
      fontSize: FONT_SIZES.lg,
    },
    buttonTextSm: {
      fontSize: FONT_SIZES.sm,
    },
    gradientButton: {
      overflow: "hidden",
      backgroundColor: "transparent",
      borderColor: "transparent",
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: isDark ? 3 : 2 },
      shadowOpacity: isDark ? 0.12 : 0.08,
      shadowRadius: isDark ? 6 : 6,
      elevation: isDark ? 3 : 2,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryText: {
      color: colors.onPrimary,
    },
    primaryDisabled: {
      backgroundColor: colors.buttonDisabledBackground,
      borderColor: colors.buttonDisabledBorder,
      shadowOpacity: 0,
      elevation: 0,
    },
    destructiveButton: {
      backgroundColor: colors.error,
      borderColor: colors.error,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    destructiveText: {
      color: colors.onPrimary,
    },
    destructiveDisabled: {
      backgroundColor: colors.buttonDisabledBackground,
      borderColor: colors.buttonDisabledBorder,
      shadowOpacity: 0,
      elevation: 0,
    },
    outlineButton: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderColor: colors.primary,
    },
    outlineText: {
      color: colors.primary,
    },
    outlineDisabled: {
      backgroundColor: colors.buttonDisabledBackground,
      borderColor: colors.buttonDisabledBorder,
    },
    successButton: {
      backgroundColor: colors.successBg,
      borderColor: colors.success,
    },
    successText: {
      color: colors.successText,
    },
    successDisabled: {
      backgroundColor: colors.buttonDisabledBackground,
      borderColor: colors.buttonDisabledBorder,
    },
    disabledText: {
      color: colors.buttonDisabledText,
    },
  });
}
