import type { HostelDirectoryItem } from "@/types/hostelDirectory";
import {
  formatPhoneForDisplay,
  phoneToTelUri,
} from "@/utils/phone";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

type DiscoverHostelDirectoryCardProps = {
  hostel: HostelDirectoryItem;
  isGuest: boolean;
  onContactLockedPress: () => void;
};

export default function DiscoverHostelDirectoryCard({
  hostel,
  isGuest,
  onContactLockedPress,
}: DiscoverHostelDirectoryCardProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const vacancyLabel =
    hostel.vacantBeds > 0
      ? `${hostel.vacantRooms} vacant room${hostel.vacantRooms === 1 ? "" : "s"} · ${hostel.vacantBeds} bed${hostel.vacantBeds === 1 ? "" : "s"}`
      : "Fully occupied";

  const ownerName = hostel.owner?.name?.trim();
  const ownerPhone = hostel.owner?.phone?.trim();
  const contactPhone = hostel.contactPhone?.trim();
  const hasContactInfo = Boolean(contactPhone || ownerPhone);

  const handleCall = async (phone: string, label: string) => {
    const telUri = phoneToTelUri(phone);
    if (!telUri) {
      Alert.alert("Invalid number", "This phone number cannot be dialed.");
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(telUri);
      if (!canOpen) {
        Alert.alert("Cannot call", "Phone calls are not supported on this device.");
        return;
      }
      await Linking.openURL(telUri);
    } catch {
      Alert.alert("Call failed", `Could not open the phone app for ${label}.`);
    }
  };

  const renderContactButton = (
    label: string,
    phone: string | undefined,
    actionLabel: string,
  ) => {
    if (isGuest || !phone) {
      return (
        <Pressable
          style={({ pressed }) => [
            styles.contactBtn,
            styles.contactBtnLocked,
            pressed && styles.contactBtnPressed,
          ]}
          onPress={onContactLockedPress}
        >
          <Ionicons name="lock-closed-outline" size={vs(16)} color={colors.gray200} />
          <Text style={styles.contactBtnLockedText}>{actionLabel}</Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        style={({ pressed }) => [
          styles.contactBtn,
          pressed && styles.contactBtnPressed,
        ]}
        onPress={() => handleCall(phone, label)}
      >
        <Ionicons name="call-outline" size={vs(16)} color={colors.primary} />
        <Text style={styles.contactBtnText}>
          {actionLabel} · {formatPhoneForDisplay(phone)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="business" size={vs(20)} color={colors.primary} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{hostel.name}</Text>
          <Text style={styles.cardSubtitle}>
            {[hostel.city, hostel.address].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View
          style={[
            styles.vacancyBadge,
            hostel.hasVacancy ? styles.vacancyOpen : styles.vacancyFull,
          ]}
        >
          <Text
            style={[
              styles.vacancyText,
              hostel.hasVacancy ? styles.vacancyTextOpen : styles.vacancyTextFull,
            ]}
          >
            {hostel.hasVacancy ? "Vacancy" : "Full"}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="bed-outline" size={vs(16)} color={colors.gray200} />
        <Text style={styles.detailText}>{vacancyLabel}</Text>
      </View>

      {ownerName ? (
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={vs(16)} color={colors.gray200} />
          <Text style={styles.detailText}>Owner: {ownerName}</Text>
        </View>
      ) : null}

      {hasContactInfo || isGuest ? (
        <View style={styles.phoneRow}>
          {renderContactButton(hostel.name, contactPhone, "Hostel contact")}
          {ownerPhone && ownerPhone !== contactPhone
            ? renderContactButton(
                ownerName ?? hostel.name,
                ownerPhone,
                "Owner contact",
              )
            : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(12),
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(10),
      marginBottom: vs(12),
    },
    cardIconWrap: {
      width: vs(40),
      height: vs(40),
      borderRadius: vs(12),
      backgroundColor: colors.primary100,
      alignItems: "center",
      justifyContent: "center",
    },
    cardHeaderText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(2),
    },
    cardSubtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(18),
    },
    vacancyBadge: {
      paddingHorizontal: vs(8),
      paddingVertical: vs(4),
      borderRadius: vs(10),
    },
    vacancyOpen: {
      backgroundColor: colors.successBg,
    },
    vacancyFull: {
      backgroundColor: colors.white100,
    },
    vacancyText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
    },
    vacancyTextOpen: {
      color: colors.success,
    },
    vacancyTextFull: {
      color: colors.gray200,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      marginBottom: vs(8),
    },
    detailText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    phoneRow: {
      gap: vs(8),
      marginTop: vs(4),
    },
    contactBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      backgroundColor: colors.primary100,
      borderRadius: vs(12),
      paddingHorizontal: vs(12),
      paddingVertical: vs(10),
    },
    contactBtnLocked: {
      backgroundColor: colors.white100,
      borderWidth: 1,
      borderColor: colors.white200,
    },
    contactBtnPressed: {
      opacity: 0.85,
    },
    contactBtnText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    contactBtnLockedText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
  });
}
