import type { ApiPlan, SubscriptionPlanId } from "@/types/subscription";
import { formatPlanPrice } from "@/types/subscription";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type PlanUpgradeCardProps = {
  plan: ApiPlan;
  isCurrent: boolean;
  showUpgrade: boolean;
  upgradeDisabled?: boolean;
  onUpgrade?: () => void;
};

function getVariantStyles(
  planId: SubscriptionPlanId,
  colors: AppColors,
  isDark: boolean,
) {
  if (planId === "premium") {
    return {
      borderColor: colors.warning,
      accent: colors.warning,
      chipBg: isDark ? "rgba(237, 161, 47, 0.18)" : "#FFFBEB",
    };
  }
  if (planId === "standard") {
    return {
      borderColor: colors.primary,
      accent: colors.primary,
      chipBg: colors.primary100,
    };
  }
  return {
    borderColor: colors.gray200,
    accent: colors.gray200,
    chipBg: isDark ? colors.white100 : colors.white100,
  };
}

export default function PlanUpgradeCard({
  plan,
  isCurrent,
  showUpgrade,
  upgradeDisabled = false,
  onUpgrade,
}: PlanUpgradeCardProps) {
  const { colors, fonts, isDark } = useTheme();
  const variant = getVariantStyles(plan.id, colors, isDark);
  const styles = useMemo(
    () => createStyles(colors, fonts, variant.borderColor, variant.accent),
    [colors, fonts, variant.borderColor, variant.accent],
  );

  return (
    <View
      style={[
        styles.card,
        isCurrent && styles.cardCurrent,
        { borderColor: isCurrent ? variant.borderColor : colors.white100 },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name}>{plan.name}</Text>
        {isCurrent ? (
          <View style={[styles.currentChip, { backgroundColor: variant.chipBg }]}>
            <Text style={[styles.currentChipText, { color: variant.accent }]}>
              Current Plan
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.price}>{formatPlanPrice(plan.price)}</Text>

      <View style={styles.features}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={vs(16)}
              color={variant.accent}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {isCurrent ? (
        <View style={styles.currentBtn}>
          <Text style={styles.currentBtnText}>Current plan</Text>
        </View>
      ) : showUpgrade ? (
        <Pressable
          style={[styles.upgradeBtn, upgradeDisabled && styles.upgradeBtnDisabled]}
          onPress={onUpgrade}
          disabled={upgradeDisabled || !onUpgrade}
        >
          <Text style={styles.upgradeBtnText}>Upgrade to {plan.name}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  borderColor: string,
  accent: string,
) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      borderRadius: vs(18),
      padding: vs(20),
      marginBottom: vs(16),
      borderWidth: 2,
    },
    cardCurrent: {
      shadowColor: borderColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 3,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: vs(8),
      marginBottom: vs(8),
    },
    name: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      flex: 1,
    },
    currentChip: {
      paddingHorizontal: vs(10),
      paddingVertical: vs(4),
      borderRadius: vs(20),
    },
    currentChipText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
    },
    price: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: accent,
      marginBottom: vs(16),
    },
    features: {
      gap: vs(10),
      marginBottom: vs(18),
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(8),
    },
    featureText: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(20),
    },
    currentBtn: {
      borderRadius: vs(12),
      paddingVertical: vs(12),
      alignItems: "center",
      backgroundColor: colors.white100,
    },
    currentBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
    upgradeBtn: {
      borderRadius: vs(12),
      paddingVertical: vs(14),
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    upgradeBtnDisabled: {
      opacity: 0.5,
    },
    upgradeBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: "#FFFFFF",
    },
  });
}
