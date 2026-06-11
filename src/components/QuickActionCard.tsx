import type { QuickAction } from "@/types/dashboard";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type QuickActionCardProps = QuickAction & {
  onPress?: () => void;
};

export default function QuickActionCard({
  label,
  iconName,
  iconColor,
  iconBackgroundColor,
  onPress,
}: QuickActionCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBackgroundColor }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 8,
      alignItems: "center",
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    cardPressed: {
      opacity: 0.85,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    label: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.semiBold,
      color: colors.text,
      textAlign: "center",
    },
  });
}
