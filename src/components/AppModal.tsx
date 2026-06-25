import CustomButton, { type CustomButtonVariant } from "@/components/CustomButton";
import type { AppModalButton, AppModalOptions } from "@/types/appModal";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type AppModalProps = {
  visible: boolean;
  options: AppModalOptions | null;
  onClose: () => void;
  onAction: (button: AppModalButton) => void;
};

function toButtonVariant(style: AppModalButton["style"]): CustomButtonVariant {
  if (style === "destructive") return "destructive";
  if (style === "outline" || style === "cancel") return "outline";
  return "primary";
}

export default function AppModal({
  visible,
  options,
  onClose,
  onAction,
}: AppModalProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  if (!options) return null;

  const buttons = options.buttons ?? [{ text: "OK", style: "primary" as const }];
  const actionButtons = buttons.filter((button) => button.style !== "cancel");
  const cancelButtons = buttons.filter((button) => button.style === "cancel");

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          {options.icon ? (
            <View style={styles.iconWrap}>
              <Ionicons
                name={options.icon}
                size={vs(28)}
                color={options.iconColor ?? colors.primary}
              />
            </View>
          ) : null}

          <Text style={styles.title}>{options.title}</Text>
          {options.message ? (
            <Text style={styles.message}>{options.message}</Text>
          ) : null}

          <View style={styles.actions}>
            {actionButtons.map((button) => (
              <CustomButton
                key={button.text}
                title={button.text}
                variant={toButtonVariant(button.style)}
                onPress={() => onAction(button)}
              />
            ))}

            {cancelButtons.map((button) => (
              <Pressable
                key={button.text}
                style={styles.cancelBtn}
                onPress={() => onAction(button)}
              >
                <Text style={styles.cancelBtnText}>{button.text}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.overlay,
      paddingHorizontal: vs(24),
    },
    card: {
      width: "100%",
      maxWidth: vs(360),
      backgroundColor: colors.white,
      borderRadius: vs(20),
      padding: vs(24),
    },
    iconWrap: {
      width: vs(56),
      height: vs(56),
      borderRadius: vs(28),
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: vs(16),
    },
    title: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
      marginBottom: vs(8),
    },
    message: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(20),
      marginBottom: vs(20),
    },
    actions: {
      gap: vs(10),
      marginTop: vs(4),
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: vs(12),
    },
    cancelBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
  });
}
