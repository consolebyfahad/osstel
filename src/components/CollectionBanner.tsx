import type { CollectionBannerData } from "@/types/dashboard";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CollectionBannerProps = CollectionBannerData & {
  onComplaintsPress?: () => void;
};

const DEFAULT_GRADIENT: [string, string] = ["#5DB7DE", "#9ED4EB"];

function formatAmount(amount: number | string, currency = "Rs"): string {
  const value = typeof amount === "number" ? amount.toLocaleString() : amount;
  return `${currency} ${value}`;
}

export default function CollectionBanner({
  label,
  totalAmount,
  pendingAmount,
  complaintsOpen,
  currency = "Rs",
  gradientColors = DEFAULT_GRADIENT,
  onComplaintsPress,
}: CollectionBannerProps) {
  return (
    <LinearGradient
      colors={gradientColors}
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

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  total: {
    fontSize: FONT_SIZES.display,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
    paddingTop: 16,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: 4,
  },
  footerValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginHorizontal: 16,
  },
});
