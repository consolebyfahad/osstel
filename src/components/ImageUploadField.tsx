import type { ImageUploadPreset } from "@/utils/imageUpload";
import { pickImageWithSourceChoice } from "@/utils/imageUpload";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type UploadedImageValue = {
  localUri: string | null;
  uploadValue: string | null;
};

type ImageUploadFieldProps = {
  label: string;
  hint?: string;
  value: UploadedImageValue;
  onChange: (value: UploadedImageValue) => void;
  preset?: ImageUploadPreset;
  aspect?: [number, number];
  variant?: "avatar" | "card";
  style?: StyleProp<ViewStyle>;
};

export default function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  preset = "standard",
  aspect,
  variant = "card",
  style,
}: ImageUploadFieldProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePick = async () => {
    setIsProcessing(true);
    try {
      const picked = await pickImageWithSourceChoice({
        preset,
        allowsEditing: true,
        aspect,
        permissionMessage: "Allow access to your camera or photo library.",
      });

      if (!picked) return;

      onChange({
        localUri: picked.localUri,
        uploadValue: picked.uploadValue,
      });
    } catch {
      Alert.alert("Error", "Could not process the selected photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    onChange({ localUri: null, uploadValue: null });
  };

  const previewUri = value.localUri ?? value.uploadValue;

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[
          variant === "avatar" ? styles.avatarBox : styles.cardBox,
          previewUri && styles.boxFilled,
        ]}
        onPress={handlePick}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <CustomLoading size="sm" />
        ) : previewUri ? (
          <Image
            source={{ uri: previewUri }}
            style={variant === "avatar" ? styles.avatarImage : styles.cardImage}
            contentFit="cover"
          />
        ) : (
          <>
            <Ionicons
              name={variant === "avatar" ? "person-outline" : "camera-outline"}
              size={vs(variant === "avatar" ? 28 : 24)}
              color={colors.gray200}
            />
            {/* <Text style={styles.placeholder}>Tap to add photo</Text> */}
          </>
        )}
      </Pressable>

      {previewUri ? (
        <Pressable onPress={handleRemove} style={styles.removeBtn}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      ) : null}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  const surface = isDark ? colors.white100 : colors.white;
  const border = isDark ? colors.white200 : colors.white100;

  return StyleSheet.create({
    wrap: {
      marginBottom: vs(4),
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    avatarBox: {
      width: vs(96),
      height: vs(96),
      borderRadius: vs(48),
      borderWidth: 1,
      borderColor: border,
      backgroundColor: surface,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      overflow: "hidden",
    },
    cardBox: {
      height: vs(120),
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: border,
      backgroundColor: surface,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    boxFilled: {
      borderColor: colors.primary200,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    placeholder: {
      marginTop: vs(6),
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    removeBtn: {
      alignSelf: "center",
      marginTop: vs(8),
    },
    removeText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.error,
    },
    hint: {
      marginTop: vs(6),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
    },
  });
}
