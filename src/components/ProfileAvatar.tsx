import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ProfileAvatarProps = {
  name: string;
  phone?: string;
  fallback?: string;
  imageUri?: string | null;
  size?: number;
  editable?: boolean;
  onPress?: () => void;
};

export function getProfileInitials(
  name: string,
  phone?: string,
  fallback?: string,
) {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }

  const phoneTrimmed = phone?.trim();
  if (phoneTrimmed && !phoneTrimmed.startsWith("google_")) {
    return phoneTrimmed.slice(-2);
  }

  const fallbackTrimmed = fallback?.trim();
  if (fallbackTrimmed) {
    const localPart = fallbackTrimmed.split("@")[0];
    return localPart.slice(0, 2).toUpperCase();
  }

  return "??";
}

export default function ProfileAvatar({
  name,
  phone,
  fallback,
  imageUri,
  size = vs(96),
  editable = false,
  onPress,
}: ProfileAvatarProps) {
  const { colors, fonts } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, size),
    [colors, fonts, size],
  );
  const initials = getProfileInitials(name, phone, fallback);

  const content = imageUri ? (
    <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
  ) : (
    <Text style={styles.initials}>{initials}</Text>
  );

  if (editable && onPress) {
    return (
      <Pressable style={styles.wrap} onPress={onPress}>
        <View style={styles.avatar}>{content}</View>
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={vs(14)} color={colors.onPrimary} />
        </View>
      </Pressable>
    );
  }

  return <View style={[styles.avatar, styles.wrap]}>{content}</View>;
}

function createStyles(colors: AppColors, fonts: typeof FONTS, size: number) {
  return StyleSheet.create({
    wrap: {
      alignSelf: "center",
      marginBottom: vs(16),
    },
    avatar: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    initials: {
      fontSize: size * 0.32,
      fontFamily: fonts.bold,
      color: colors.onPrimary,
    },
    editBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: vs(32),
      height: vs(32),
      borderRadius: vs(16),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
  });
}
