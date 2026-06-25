import type { HostelDashboardItem } from "@/types/dashboard";
import type { Hostel } from "@/types/hostel";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import { formatCompactCurrency } from "@/utils/currency";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  useGetHostelRoomsQuery,
  useGetResidentsQuery,
} from "../../store/api";

type HostelCardProps = {
  hostel: Hostel;
  stats?: HostelDashboardItem;
  onPress?: () => void;
};

export default function HostelCard({ hostel, stats, onPress }: HostelCardProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const { data: roomsData } = useGetHostelRoomsQuery(hostel._id);
  const { data: residentsData } = useGetResidentsQuery({ hostelId: hostel._id });

  const rooms: Room[] = roomsData?.rooms ?? [];
  const residents: Resident[] = residentsData?.residents ?? [];

  const totalRooms = stats?.rooms.totalRooms ?? rooms.length;
  const totalBeds =
    stats?.rooms.totalBedrooms ??
    rooms.reduce((sum: number, room: Room) => sum + room.capacity, 0);
  const occupiedBeds = stats?.rooms.occupiedBeds ?? residents.length;
  const occupancyPercent =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const monthlyCollected = stats?.monthlyCollection.collected ?? 0;

  const headerGradient = isDark
    ? ([colors.secondary300, colors.secondary] as [string, string])
    : ([colors.secondary, "#8B5CF6"] as [string, string]);

  const content = (
    <View style={styles.card}>
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.activeBadge}>
              <Ionicons name="business-outline" size={vs(14)} color={colors.onPrimary} />
              <Text style={styles.activeBadgeText}>Active Hostel</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {hostel.name}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={vs(14)} color={colors.onGradientMuted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {hostel.city}
              </Text>
            </View>
          </View>

          <View style={styles.amountBlock}>
            <Text style={styles.amountValue}>
              {formatCompactCurrency(monthlyCollected)}
            </Text>
            <Text style={styles.amountLabel}>Monthly</Text>
          </View>
        </View>

        <View style={styles.occupancyRow}>
          <Text style={styles.occupancyLabel}>Occupancy</Text>
          <Text style={styles.occupancyValue}>{occupancyPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${occupancyPercent}%` }]} />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.bodyHeader}>
          <Text style={styles.roomsTitle}>Rooms ({totalRooms})</Text>
          {onPress ? (
            <Pressable
              onPress={onPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Manage ${hostel.name}`}
            >
              <Text style={styles.manageLink}>Manage ›</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    pressable: {
      marginBottom: vs(16),
    },
    pressablePressed: {
      opacity: 0.96,
      transform: [{ scale: 0.995 }],
    },
    card: {
      borderRadius: vs(24),
      overflow: "hidden",
      backgroundColor: isDark ? colors.white100 : colors.white,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 16,
      elevation: 6,
    },
    header: {
      paddingHorizontal: vs(18),
      paddingTop: vs(18),
      paddingBottom: vs(16),
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: vs(12),
      marginBottom: vs(16),
    },
    headerLeft: {
      flex: 1,
    },
    activeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      marginBottom: vs(8),
    },
    activeBadgeText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.onGradientMuted,
    },
    title: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.onPrimary,
      marginBottom: vs(6),
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(4),
    },
    locationText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.onGradientMuted,
    },
    amountBlock: {
      alignItems: "flex-end",
    },
    amountValue: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.onPrimary,
    },
    amountLabel: {
      marginTop: vs(2),
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.onGradientSubtle,
    },
    occupancyRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: vs(8),
    },
    occupancyLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.onGradientMuted,
    },
    occupancyValue: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.onPrimary,
    },
    progressTrack: {
      height: vs(6),
      borderRadius: vs(999),
      backgroundColor: "rgba(255, 255, 255, 0.28)",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: vs(999),
      backgroundColor: colors.onPrimary,
    },
    body: {
      paddingHorizontal: vs(18),
      paddingTop: vs(16),
      paddingBottom: vs(18),
      backgroundColor: isDark ? colors.white100 : colors.white,
    },
    bodyHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    roomsTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    manageLink: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.secondary,
    },
  });
}
