import CustomButton from "@/components/CustomButton";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type GuestLoginModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function GuestLoginModal({ visible, onClose }: GuestLoginModalProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const handleSignIn = () => {
    onClose();
    router.push("/auth/signin");
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={vs(28)} color={colors.primary} />
          </View>
          <Text style={styles.title}>Sign in to view contacts</Text>
          <Text style={styles.message}>
            Create an account or sign in to see hostel and owner phone numbers.
          </Text>
          <CustomButton title="Sign In" onPress={handleSignIn} />
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Not now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      paddingHorizontal: vs(24),
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: vs(20),
      padding: vs(24),
      alignItems: "center",
    },
    iconWrap: {
      width: vs(56),
      height: vs(56),
      borderRadius: vs(28),
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(16),
    },
    title: {
      fontSize: FONT_SIZES.lg,
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
    cancelBtn: {
      marginTop: vs(12),
      paddingVertical: vs(8),
    },
    cancelText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
  });
}
