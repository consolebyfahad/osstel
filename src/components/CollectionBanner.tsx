import type { CollectionBannerData } from "@/types/dashboard";
import { formatCompactCurrency } from "@/utils/currency";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CollectionBannerProps = CollectionBannerData & {
  onComplaintsPress?: () => void;
};

function formatAmount(amount: number | string, currency = "Rs"): string {
  if (typeof amount === "number") {
    return formatCompactCurrency(amount, currency);
  }
  return `${currency} ${amount}`;
}

export default function CollectionBanner({
  label,
  totalAmount,
  pendingAmount,
  complaintsOpen,
  currency = "Rs",
  gradientColors,
  onComplaintsPress,
}: CollectionBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const gradient = gradientColors ?? colors.bannerGradient;

  return (
    <LinearGradient
      colors={[...gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.total}>{formatAmount(totalAmount, currency)}</Text>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Pending</Text>
          <Text style={styles.footerValue}>
            {formatAmount(pendingAmount, currency)}
          </Text>
        </View>

        <View style={styles.divider} />

        {onComplaintsPress ? (
          <Pressable
            style={styles.footerItem}
            onPress={onComplaintsPress}
            accessibilityRole="button"
            accessibilityLabel="View complaints"
          >
            <Text style={styles.footerLabel}>Complaints</Text>
            <Text style={styles.footerValue}>{complaintsOpen} open</Text>
          </Pressable>
        ) : (
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Complaints</Text>
            <Text style={styles.footerValue}>{complaintsOpen} open</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    gradient: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      overflow: "hidden",
    },
    label: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.semiBold,
      color: colors.onGradientMuted,
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    total: {
      fontSize: FONT_SIZES.display,
      fontFamily: FONTS.bold,
      color: colors.onGradient,
      marginBottom: 20,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.gradientDivider,
      paddingTop: 16,
    },
    footerItem: {
      flex: 1,
    },
    footerLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.onGradientSubtle,
      marginBottom: 4,
    },
    footerValue: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: colors.onGradient,
    },
    divider: {
      width: 1,
      height: 36,
      backgroundColor: colors.gradientDivider,
      marginHorizontal: 16,
    },
  });
}
