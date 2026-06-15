import ReportTypeCard from "@/components/reports/ReportTypeCard";
import { REPORT_TYPES } from "@/types/report";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

export default function ReportsScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";

  if (!isManager) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerWrap}>
          <Text style={styles.emptyTitle}>Reports</Text>
          <Text style={styles.emptyDescription}>
            Report generation is available for managers only.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={vs(22)} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Reports</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Ionicons
            name="document-attach-outline"
            size={vs(28)}
            color={colors.primary}
          />
          <Text style={styles.heroTitle}>Generate & Download</Text>
          <Text style={styles.heroText}>
            Create monthly rent reports, resident directories, and detailed
            tenant profile PDFs for your hostels.
          </Text>
        </View>

        {REPORT_TYPES.map((report) => (
          <ReportTypeCard
            key={report.id}
            title={report.title}
            description={report.description}
            icon={report.icon}
            onPress={() => router.push(report.route as never)}
          />
        ))}
      </ScrollView>
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
      justifyContent: "space-between",
      paddingHorizontal: vs(16),
      paddingVertical: vs(12),
    },
    backBtn: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    heroCard: {
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: isDark ? colors.primary200 : colors.primary200,
      padding: vs(18),
      alignItems: "center",
      marginBottom: vs(20),
    },
    heroTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: vs(10),
      marginBottom: vs(6),
    },
    heroText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(20),
    },
    centerWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: vs(32),
    },
    emptyTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(8),
    },
    emptyDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
    },
  });
}
