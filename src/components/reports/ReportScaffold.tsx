import CustomButton from "@/components/CustomButton";
import ScreenHeader from "@/components/ScreenHeader";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, type ReactNode } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReportScaffoldProps = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  controls?: ReactNode;
  children: ReactNode;
  onDownload: () => void | Promise<void>;
  downloading?: boolean;
  downloadDisabled?: boolean;
  downloadLabel?: string;
};

export default function ReportScaffold({
  title,
  subtitle,
  loading = false,
  controls,
  children,
  onDownload,
  downloading = false,
  downloadDisabled = false,
  downloadLabel = "Download PDF",
}: ReportScaffoldProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title={title} subtitle={subtitle} showBack />

      {controls ? <View style={styles.controls}>{controls}</View> : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <CustomLoading size="lg" />
          <Text style={styles.loadingText}>Preparing report preview...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewBadge}>
            <Ionicons
              name="document-text-outline"
              size={vs(16)}
              color={colors.primary}
            />
            <Text style={styles.previewBadgeText}>Report preview</Text>
          </View>
          {children}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <CustomButton
          title={downloading ? "Generating PDF..." : downloadLabel}
          onPress={onDownload}
          disabled={loading || downloading || downloadDisabled}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: vs(12),
      paddingBottom: vs(8),
    },
    iconBtn: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: {
      flex: 1,
      alignItems: "center",
    },
    title: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginTop: vs(2),
    },
    controls: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(8),
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: vs(12),
    },
    loadingText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(20),
    },
    previewBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      alignSelf: "flex-start",
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      paddingHorizontal: vs(10),
      paddingVertical: vs(6),
      borderRadius: vs(20),
      marginBottom: vs(14),
    },
    previewBadgeText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    footer: {
      paddingHorizontal: vs(20),
      paddingTop: vs(10),
      paddingBottom: vs(16),
      borderTopWidth: 1,
      borderTopColor: colors.white100,
      backgroundColor: colors.background,
    },
  });
}
