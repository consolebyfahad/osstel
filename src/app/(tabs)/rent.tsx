import { getRooms } from "@/services/rooms";
import type { RentFilter, RentRecord } from "@/types/rent";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTER_SPRING = { damping: 18, stiffness: 180 };

const FILTERS: { id: RentFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "review", label: "Review" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
];

// Placeholder — wire to API/storage when rent records exist
const RENT_RECORDS: RentRecord[] = [];

function formatAmount(amount: number) {
  return `Rs ${amount.toLocaleString()}`;
}

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

type SummaryCardProps = {
  label: string;
  value: string;
  variant: "expected" | "collected" | "pending";
  styles: ReturnType<typeof createStyles>;
};

function SummaryCard({ label, value, variant, styles }: SummaryCardProps) {
  const variantStyle =
    variant === "collected"
      ? styles.summaryCollected
      : variant === "pending"
        ? styles.summaryPending
        : styles.summaryExpected;

  const labelStyle =
    variant === "collected"
      ? styles.summaryLabelCollected
      : variant === "pending"
        ? styles.summaryLabelPending
        : styles.summaryLabelExpected;

  const valueStyle =
    variant === "collected"
      ? styles.summaryValueCollected
      : variant === "pending"
        ? styles.summaryValuePending
        : styles.summaryValueExpected;

  return (
    <View style={[styles.summaryCard, variantStyle]}>
      <Text style={[styles.summaryLabel, labelStyle]}>{label}</Text>
      <Text style={[styles.summaryValue, valueStyle]}>{value}</Text>
    </View>
  );
}

type AnimatedFilterBarProps = {
  activeFilter: RentFilter;
  onFilterChange: (filter: RentFilter) => void;
  styles: ReturnType<typeof createStyles>;
};

function AnimatedFilterBar({
  activeFilter,
  onFilterChange,
  styles,
}: AnimatedFilterBarProps) {
  const activeIndex = FILTERS.findIndex((f) => f.id === activeFilter);
  const sliderIndex = useSharedValue(activeIndex);
  const tabWidth = useSharedValue(0);

  useEffect(() => {
    sliderIndex.value = withSpring(activeIndex, FILTER_SPRING);
  }, [activeIndex, sliderIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth.value,
    transform: [{ translateX: sliderIndex.value * tabWidth.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const barPadding = vs(8);
    tabWidth.value = (event.nativeEvent.layout.width - barPadding) / FILTERS.length;
  };

  return (
    <View style={styles.filterBar} onLayout={handleLayout}>
      <Animated.View style={[styles.filterIndicator, indicatorStyle]} />
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <Pressable
            key={filter.id}
            style={styles.filterTab}
            onPress={() => onFilterChange(filter.id)}
          >
            <Text
              style={[styles.filterText, isActive && styles.filterTextActive]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Rent() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const [activeFilter, setActiveFilter] = useState<RentFilter>("all");
  const [expectedRent, setExpectedRent] = useState(0);

  const currentMonth = getCurrentMonth();

  useFocusEffect(
    useCallback(() => {
      getRooms().then((rooms) => {
        const total = rooms.reduce(
          (sum, room) => sum + room.totalBeds * room.monthlyRentPerBed,
          0,
        );
        setExpectedRent(total);
      });
    }, []),
  );

  const collected = RENT_RECORDS.filter((r) => r.status === "paid").reduce(
    (sum, r) => sum + r.amount,
    0,
  );
  const pending = Math.max(expectedRent - collected, 0);

  const filteredRecords = RENT_RECORDS.filter((record) => {
    if (activeFilter === "all") return true;
    return record.status === activeFilter;
  });

  const emptyMessage =
    activeFilter === "all"
      ? "No rent records found for this filter."
      : `No ${activeFilter} rent records found.`;

  const isEmpty = filteredRecords.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.staticHeader}>
        <View style={styles.header}>
          <Text style={styles.title}>Rent Management</Text>
          <Text style={styles.month}>{currentMonth}</Text>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            label="EXPECTED"
            value={formatAmount(expectedRent)}
            variant="expected"
            styles={styles}
          />
          <SummaryCard
            label="COLLECTED"
            value={formatAmount(collected)}
            variant="collected"
            styles={styles}
          />
          <SummaryCard
            label="PENDING"
            value={formatAmount(pending)}
            variant="pending"
            styles={styles}
          />
        </View>

        <AnimatedFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          styles={styles}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isEmpty && styles.scrollContentEmpty,
        ]}
      >
        <Animated.View
          key={activeFilter}
          entering={FadeIn.duration(280).springify().damping(20)}
          exiting={FadeOut.duration(180)}
        >
          {isEmpty ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons
                  name="cash"
                  size={vs(36)}
                  color={colors.warning}
                />
              </View>
              <Text style={styles.emptyTitle}>No records</Text>
              <Text style={styles.emptyDescription}>{emptyMessage}</Text>
            </View>
          ) : (
            filteredRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <Text style={styles.recordName}>{record.tenantName}</Text>
                <Text style={styles.recordMeta}>
                  Room {record.roomNumber} · {formatAmount(record.amount)}
                </Text>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    staticHeader: {
      paddingHorizontal: vs(20),
      paddingTop: vs(16),
      paddingBottom: vs(4),
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(110),
    },
    scrollContentEmpty: {
      flexGrow: 1,
      justifyContent: "center",
    },
    header: {
      marginBottom: vs(20),
    },
    title: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(4),
    },
    month: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    summaryRow: {
      flexDirection: "row",
      gap: vs(10),
      marginBottom: vs(20),
    },
    summaryCard: {
      flex: 1,
      borderRadius: vs(14),
      paddingVertical: vs(14),
      paddingHorizontal: vs(10),
      borderWidth: 1,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    summaryExpected: {
      backgroundColor: colors.white,
      borderColor: colors.white100,
    },
    summaryCollected: {
      backgroundColor: isDark ? colors.secondary100 : "#F0FDF4",
      borderColor: isDark ? colors.secondary : colors.success,
    },
    summaryPending: {
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.12)" : "#FFFBEB",
      borderColor: colors.warning,
    },
    summaryLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      letterSpacing: 0.8,
      marginBottom: vs(6),
    },
    summaryLabelExpected: {
      color: colors.gray200,
    },
    summaryLabelCollected: {
      color: colors.success,
    },
    summaryLabelPending: {
      color: colors.warning,
    },
    summaryValue: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
    },
    summaryValueExpected: {
      color: colors.text,
    },
    summaryValueCollected: {
      color: colors.success,
    },
    summaryValuePending: {
      color: colors.warning,
    },
    filterBar: {
      flexDirection: "row",
      backgroundColor: colors.white100,
      borderRadius: vs(14),
      padding: vs(4),
      marginBottom: vs(12),
      position: "relative",
    },
    filterIndicator: {
      position: "absolute",
      top: vs(4),
      left: vs(4),
      bottom: vs(4),
      borderRadius: vs(10),
      backgroundColor: colors.white,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    filterTab: {
      flex: 1,
      paddingVertical: vs(10),
      alignItems: "center",
      borderRadius: vs(10),
      zIndex: 1,
    },
    filterText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    filterTextActive: {
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: vs(48),
    },
    emptyIconWrap: {
      width: vs(80),
      height: vs(80),
      borderRadius: vs(18),
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.15)" : "#FFEDD5",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(20),
    },
    emptyTitle: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(8),
    },
    emptyDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      maxWidth: vs(260),
    },
    recordCard: {
      backgroundColor: colors.white,
      borderRadius: vs(14),
      padding: vs(16),
      marginBottom: vs(10),
      borderWidth: 1,
      borderColor: colors.white100,
    },
    recordName: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    recordMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
  });
}
