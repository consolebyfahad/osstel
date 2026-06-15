import type { LegalDocument } from "@/content/legal";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LegalDocumentScreenProps = {
  document: LegalDocument;
};

export default function LegalDocumentScreen({
  document,
}: LegalDocumentScreenProps) {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={vs(22)} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {document.title}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>
          Last updated: {document.lastUpdated}
        </Text>

        <Text style={styles.intro}>{document.intro}</Text>

        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletMarker}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Ionicons
            name="mail-outline"
            size={vs(20)}
            color={colors.primary}
          />
          <Text style={styles.contactText}>
            Questions? Contact us at {document.contactEmail}
          </Text>
        </View>
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
      flex: 1,
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: "center",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    lastUpdated: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(16),
    },
    intro: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(24),
      marginBottom: vs(24),
    },
    section: {
      marginBottom: vs(22),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(10),
    },
    paragraph: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(24),
      marginBottom: vs(10),
    },
    bulletRow: {
      flexDirection: "row",
      gap: vs(8),
      marginBottom: vs(8),
      paddingRight: vs(4),
    },
    bulletMarker: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.primary,
      lineHeight: vs(24),
    },
    bulletText: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(24),
    },
    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(10),
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: isDark ? colors.primary200 : colors.primary200,
      padding: vs(16),
      marginTop: vs(8),
    },
    contactText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.text,
      lineHeight: vs(20),
    },
  });
}
