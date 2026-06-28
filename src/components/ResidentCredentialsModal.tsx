import CustomButton from "@/components/CustomButton";
import type { ResidentLoginCredentials } from "@/types/resident";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

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
  const insets = useSafeAreaInsets();
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
        <View
          style={[
            styles.sheet,
            {
              maxHeight: SCREEN_HEIGHT * 0.92,
              paddingBottom: Math.max(insets.bottom, vs(16)),
            },
          ]}
        >
          <View style={styles.handle} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name="checkmark-circle"
                size={vs(32)}
                color={colors.success}
              />
            </View>

            <Text style={styles.title}>Resident Added</Text>
            <Text style={styles.subtitle}>
              Share these login credentials with {residentName}. They sign in with
              User ID and password in the Osstel app.
            </Text>

            <View style={styles.credentialsRow}>
              <View style={[styles.credentialBox, styles.credentialBoxHalf]}>
                <Text style={styles.credentialLabel}>User ID</Text>
                <Text style={styles.credentialValue} selectable>
                  {credentials.userId}
                </Text>
              </View>

              <View style={[styles.credentialBox, styles.credentialBoxHalf]}>
                <Text style={styles.credentialLabel}>Password</Text>
                <Text style={styles.credentialValue} selectable>
                  {credentials.password}
                </Text>
              </View>
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>Share message</Text>
              <Text style={styles.messageText} selectable>
                {credentials.shareMessage}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <CustomButton title="Share Credentials" onPress={handleShare} />
            <Pressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
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
    sheet: {
      backgroundColor: colors.white,
      borderTopLeftRadius: vs(24),
      borderTopRightRadius: vs(24),
    },
    handle: {
      alignSelf: "center",
      width: vs(40),
      height: vs(4),
      borderRadius: vs(2),
      backgroundColor: colors.white200,
      marginTop: vs(10),
      marginBottom: vs(4),
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingHorizontal: vs(24),
      paddingTop: vs(8),
      paddingBottom: vs(8),
    },
    iconWrap: {
      width: vs(56),
      height: vs(56),
      borderRadius: vs(28),
      backgroundColor: colors.successBg,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: vs(14),
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
      marginBottom: vs(18),
    },
    credentialsRow: {
      flexDirection: "row",
      gap: vs(10),
      marginBottom: vs(12),
    },
    credentialBox: {
      backgroundColor: colors.white100,
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white200,
      padding: vs(14),
    },
    credentialBoxHalf: {
      flex: 1,
      minWidth: 0,
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
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    messageBox: {
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      borderRadius: vs(12),
      padding: vs(14),
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
    footer: {
      paddingHorizontal: vs(24),
      paddingTop: vs(12),
      borderTopWidth: 1,
      borderTopColor: colors.white100,
    },
    doneBtn: {
      alignItems: "center",
      paddingVertical: vs(14),
      marginTop: vs(4),
    },
    doneBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
  });
}
