import type { RentStatus } from "@/types/rent";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type ResidentRentBannerProps = {
  label: string;
  amount: number;
  status?: RentStatus;
  currency?: string;
};

function statusLabel(status: RentStatus | undefined) {
  if (status === "paid") return "Paid";
  if (status === "review") return "Under Review";
  if (status === "rejected") return "Rejected";
  if (status === "pending") return "Pending";
  return "Not available";
}

function statusColor(status: RentStatus | undefined, colors: AppColors) {
  if (status === "paid") return colors.success;
  if (status === "review") return colors.primary;
  if (status === "rejected") return colors.error;
  if (status === "pending") return colors.warning;
  return colors.gray200;
}

function statusBackground(status: RentStatus | undefined, colors: AppColors) {
  if (status === "paid") return colors.successBg;
  if (status === "review") return colors.infoBg;
  if (status === "rejected") return colors.errorBg;
  if (status === "pending") return colors.warningBg;
  return "rgba(255,255,255,0.2)";
}

export default function ResidentRentBanner({
  label,
  amount,
  status,
  currency = "Rs",
}: ResidentRentBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const gradient = colors.bannerGradient;

  return (
    <LinearGradient
      colors={[...gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.total}>
        {currency} {amount.toLocaleString()}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Status</Text>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusBackground(status, colors) },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              { color: statusColor(status, colors) },
            ]}
          >
            {statusLabel(status)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    gradient: {
      borderRadius: vs(16),
      padding: vs(20),
      marginBottom: vs(16),
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.gradientBorder,
    },
    label: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.semiBold,
      color: colors.onGradientMuted,
      letterSpacing: 1.2,
      marginBottom: vs(8),
    },
    total: {
      fontSize: FONT_SIZES.display,
      fontFamily: FONTS.bold,
      color: colors.onGradient,
      marginBottom: vs(16),
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.gradientDivider,
      paddingTop: vs(14),
    },
    footerLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.onGradientSubtle,
    },
    statusPill: {
      paddingHorizontal: vs(12),
      paddingVertical: vs(6),
      borderRadius: vs(20),
    },
    statusPillText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.semiBold,
    },
  });
}
