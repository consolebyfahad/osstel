import CustomButton from "@/components/CustomButton";
import type { ResidentLoginCredentials } from "@/types/resident";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ResidentCredentialsModalProps = {
  visible: boolean;
  residentName: string;
  credentials: ResidentLoginCredentials | null;
  onClose: () => void;
};

export default function ResidentCredentialsModal({
  visible,
  residentName,
  credentials,
  onClose,
}: ResidentCredentialsModalProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  if (!credentials) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: credentials.shareMessage,
        title: `${residentName} — Osstel Login`,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="key-outline" size={vs(28)} color={colors.primary} />
          </View>

          <Text style={styles.title}>Resident Added</Text>
          <Text style={styles.subtitle}>
            Share these login credentials with {residentName}. They use User ID
            and password to sign in to the resident app.
          </Text>

          <View style={styles.credentialBox}>
            <Text style={styles.credentialLabel}>User ID</Text>
            <Text style={styles.credentialValue} selectable>
              {credentials.userId}
            </Text>
          </View>

          <View style={styles.credentialBox}>
            <Text style={styles.credentialLabel}>Password</Text>
            <Text style={styles.credentialValue} selectable>
              {credentials.password}
            </Text>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Share message</Text>
            <Text style={styles.messageText} selectable>
              {credentials.shareMessage}
            </Text>
          </View>

          <CustomButton title="Share Credentials" onPress={handleShare} />

          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.overlay,
    },
    card: {
      backgroundColor: colors.white,
      borderTopLeftRadius: vs(24),
      borderTopRightRadius: vs(24),
      padding: vs(24),
      paddingBottom: vs(36),
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
    subtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(20),
      marginBottom: vs(20),
    },
    credentialBox: {
      backgroundColor: colors.white100,
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(10),
    },
    credentialLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: vs(6),
    },
    credentialValue: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    messageBox: {
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      borderRadius: vs(12),
      padding: vs(14),
      marginBottom: vs(20),
      marginTop: vs(6),
    },
    messageLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      marginBottom: vs(8),
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    messageText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(20),
    },
    doneBtn: {
      alignItems: "center",
      paddingVertical: vs(14),
      marginTop: vs(10),
    },
    doneBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
  });
}
