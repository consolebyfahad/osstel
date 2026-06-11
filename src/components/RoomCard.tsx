import type { Room } from "@/types/room";
import type { Tenant } from "@/types/tenant";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RoomCardProps = {
  room: Room;
  tenants: Tenant[];
  onAddTenant?: (roomId: string) => void;
};

const AVATAR_COLORS = ["#5DB7DE", "#4EDCA3", "#7C6CF0", "#EDA12F"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function RoomCard({
  room,
  tenants,
  onAddTenant,
}: RoomCardProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const occupied = tenants.length;
  const available = Math.max(room.totalBeds - occupied, 0);
  const isFull = available === 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="bed-outline"
              size={vs(22)}
              color={colors.secondary}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Room {room.roomNumber}</Text>
            <Text style={styles.subtitle}>
              {room.totalBeds} Beds · {available} Available
            </Text>
          </View>
        </View>

        {!isFull ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {available} Free
            </Text>
          </View>
        ) : (
          <View style={styles.badgeFull}>
            <Text style={styles.badgeFullText}>Full</Text>
          </View>
        )}
      </View>

      <View style={styles.progressBar}>
        {Array.from({ length: room.totalBeds }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index < occupied ? styles.segmentFilled : styles.segmentEmpty,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.avatarRow}>
          {tenants.map((tenant, index) => (
            <View
              key={tenant.id}
              style={[
                styles.avatar,
                { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                index > 0 && styles.avatarOverlap,
              ]}
            >
              <Text style={styles.avatarText}>{getInitials(tenant.name)}</Text>
            </View>
          ))}

          {!isFull ? (
            <Pressable
              style={[styles.addButton, tenants.length > 0 && styles.avatarOverlap]}
              onPress={() => onAddTenant?.(room.id)}
              hitSlop={8}
            >
              <Ionicons name="add" size={vs(18)} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.occupancy}>
          {occupied}/{room.totalBeds} occupied
        </Text>
      </View>
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      borderRadius: vs(20),
      padding: vs(16),
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.white100,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: vs(14),
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: vs(8),
    },
    iconWrap: {
      width: vs(44),
      height: vs(44),
      borderRadius: vs(12),
      backgroundColor: colors.secondary100,
      alignItems: "center",
      justifyContent: "center",
      marginRight: vs(12),
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
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    badge: {
      backgroundColor: colors.secondary100,
      paddingHorizontal: vs(10),
      paddingVertical: vs(5),
      borderRadius: vs(20),
    },
    badgeText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      color: colors.secondary,
    },
    badgeFull: {
      backgroundColor: isDark ? colors.white200 : "#FEE2E2",
      paddingHorizontal: vs(10),
      paddingVertical: vs(5),
      borderRadius: vs(20),
    },
    badgeFullText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      color: colors.error,
    },
    progressBar: {
      flexDirection: "row",
      gap: vs(6),
      marginBottom: vs(14),
    },
    segment: {
      flex: 1,
      height: vs(8),
      borderRadius: vs(4),
    },
    segmentFilled: {
      backgroundColor: colors.primary,
    },
    segmentEmpty: {
      backgroundColor: colors.primary100,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    avatarRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: vs(36),
      height: vs(36),
      borderRadius: vs(18),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.white,
    },
    avatarOverlap: {
      marginLeft: vs(-10),
    },
    avatarText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.bold,
      color: "#FFFFFF",
    },
    addButton: {
      width: vs(36),
      height: vs(36),
      borderRadius: vs(18),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.primary200,
      backgroundColor: colors.primary100,
    },
    occupancy: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
  });
}
