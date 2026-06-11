import type { SubscriptionPlan } from "@/types/subscription";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SubscriptionPlanCardProps = {
  plan: SubscriptionPlan;
  isActive: boolean;
  onSelect: () => void;
};

export default function SubscriptionPlanCard({
  plan,
  isActive,
  onSelect,
}: SubscriptionPlanCardProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  return (
    <Pressable
      style={[
        styles.card,
        isActive && styles.cardActive,
        plan.popular && !isActive && styles.cardPopular,
      ]}
      onPress={onSelect}
    >
      {plan.popular ? (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Popular</Text>
        </View>
      ) : null}

      <Text style={[styles.name, isActive && styles.nameActive]}>{plan.name}</Text>

      <View style={styles.priceRow}>
        <Text style={[styles.price, isActive && styles.priceActive]}>
          {plan.priceLabel}
        </Text>
        <Text style={styles.period}>/mo</Text>
      </View>

      <Text style={styles.description}>{plan.description}</Text>

      <View style={styles.features}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={vs(14)}
              color={isActive ? colors.primary : colors.secondary}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.actionBtn,
          isActive ? styles.actionBtnActive : styles.actionBtnIdle,
        ]}
      >
        <Text
          style={[
            styles.actionText,
            isActive ? styles.actionTextActive : styles.actionTextIdle,
          ]}
        >
          {isActive ? "Current Plan" : plan.price === 0 ? "Select" : "Upgrade"}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    card: {
      width: vs(200),
      backgroundColor: colors.white,
      borderRadius: vs(16),
      padding: vs(16),
      borderWidth: 1.5,
      borderColor: colors.white100,
      marginRight: vs(12),
    },
    cardActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
    },
    cardPopular: {
      borderColor: colors.secondary200,
    },
    popularBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.secondary,
      paddingHorizontal: vs(8),
      paddingVertical: vs(3),
      borderRadius: vs(10),
      marginBottom: vs(10),
    },
    popularText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.bold,
      color: "#FFFFFF",
    },
    name: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(4),
    },
    nameActive: {
      color: colors.primary,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: vs(6),
    },
    price: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    priceActive: {
      color: colors.primary,
    },
    period: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginLeft: vs(2),
    },
    description: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(12),
      lineHeight: vs(16),
    },
    features: {
      gap: vs(6),
      marginBottom: vs(14),
      flex: 1,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
    },
    featureText: {
      flex: 1,
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray100,
    },
    actionBtn: {
      borderRadius: vs(10),
      paddingVertical: vs(10),
      alignItems: "center",
    },
    actionBtnActive: {
      backgroundColor: colors.primary,
    },
    actionBtnIdle: {
      backgroundColor: colors.primary100,
    },
    actionText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
    },
    actionTextActive: {
      color: "#FFFFFF",
    },
    actionTextIdle: {
      color: colors.primary,
    },
  });
}
