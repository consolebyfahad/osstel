import type { Hostel } from "@/types/hostel";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type HostelCardProps = {
  hostel: Hostel;
  roomCount?: number;
  onPress?: () => void;
};

function getManagerName(hostel: Hostel) {
  if (typeof hostel.manager === "object" && hostel.manager?.name) {
    return hostel.manager.name;
  }
  return null;
}

export default function HostelCard({
  hostel,
  roomCount = 0,
  onPress,
}: HostelCardProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const managerName = getManagerName(hostel);

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="business-outline" size={vs(22)} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{hostel.name}</Text>
          <Text style={styles.subtitle}>{hostel.city}</Text>
        </View>
        {onPress ? (
          <Ionicons name="chevron-forward" size={vs(20)} color={colors.gray200} />
        ) : null}
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={vs(16)} color={colors.gray200} />
        <Text style={styles.detailText} numberOfLines={2}>
          {hostel.address}
        </Text>
      </View>

      {hostel.contactPhone ? (
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={vs(16)} color={colors.gray200} />
          <Text style={styles.detailText}>{hostel.contactPhone}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.roomBadge}>
          <Ionicons name="bed-outline" size={vs(14)} color={colors.primary} />
          <Text style={styles.roomBadgeText}>
            {roomCount} room{roomCount === 1 ? "" : "s"}
          </Text>
        </View>
        {managerName ? (
          <Text style={styles.managerText}>{managerName}</Text>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    card: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(18),
      padding: vs(16),
      marginBottom: vs(12),
      borderWidth: 1,
      borderColor: isDark ? colors.white200 : colors.white100,
    },
    cardPressed: {
      opacity: 0.92,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: vs(12),
      gap: vs(12),
    },
    iconWrap: {
      width: vs(48),
      height: vs(48),
      borderRadius: vs(14),
      backgroundColor: colors.primary100,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(2),
    },
    subtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(8),
      marginBottom: vs(8),
    },
    detailText: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(20),
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: vs(4),
    },
    roomBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      backgroundColor: colors.primary100,
      paddingHorizontal: vs(10),
      paddingVertical: vs(4),
      borderRadius: vs(12),
    },
    roomBadgeText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    managerText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
  });
}
