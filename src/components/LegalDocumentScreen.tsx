import type { LegalDocument } from "@/content/legal";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
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
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title={document.title} showBack titleNumberOfLines={1} />

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
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
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
