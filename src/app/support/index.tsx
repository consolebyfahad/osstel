import CustomButton from "@/components/CustomButton";
import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_STATUS_LABELS,
  type SupportCategory,
  type SupportRequest,
  type SupportStatus,
} from "@/types/support";
import {
  useGetSupportRequestsQuery,
  useSubmitSupportRequestMutation,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

const MESSAGE_MAX_LENGTH = 1000;
const SUBJECT_MAX_LENGTH = 120;

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    data?: { message?: string; errors?: { msg: string }[] } | string;
  };

  if (typeof err.data === "string") return err.data;
  if (err.data?.errors?.length) {
    return err.data.errors.map((e) => e.msg).join("\n");
  }
  if (err.data?.message) return err.data.message;
  return fallback;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCategoryLabel(category?: SupportCategory) {
  return (
    SUPPORT_CATEGORIES.find((item) => item.id === category)?.label ?? "General"
  );
}

type RequestCardProps = {
  request: SupportRequest;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  isDark: boolean;
};

function RequestCard({ request, styles, colors, isDark }: RequestCardProps) {
  const statusStyle =
    request.status === "resolved"
      ? styles.statusResolved
      : request.status === "in_progress"
        ? styles.statusInProgress
        : styles.statusOpen;

  const statusTextStyle =
    request.status === "resolved"
      ? styles.statusTextResolved
      : request.status === "in_progress"
        ? styles.statusTextInProgress
        : styles.statusTextOpen;

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestHeaderLeft}>
          <Text style={styles.requestSubject}>{request.subject}</Text>
          <Text style={styles.requestMeta}>
            {getCategoryLabel(request.category)} ·{" "}
            {formatDate(request.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, statusTextStyle]}>
            {SUPPORT_STATUS_LABELS[request.status as SupportStatus]}
          </Text>
        </View>
      </View>

      <Text style={styles.requestMessage}>{request.message}</Text>

      {request.adminReply ? (
        <View
          style={[
            styles.replyBox,
            isDark ? styles.replyBoxDark : styles.replyBoxLight,
          ]}
        >
          <Text style={styles.replyLabel}>Admin reply</Text>
          <Text style={styles.replyText}>{request.adminReply}</Text>
          {request.repliedAt ? (
            <Text style={styles.replyDate}>
              {formatDate(request.repliedAt)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function SupportScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SupportCategory>("general");

  const {
    data: supportData,
    isLoading,
    isFetching,
    refetch,
  } = useGetSupportRequestsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [submitSupport, { isLoading: isSubmitting }] =
    useSubmitSupportRequestMutation();

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refetch();
      }
    }, [isAuthenticated, refetch]),
  );

  const requests = supportData?.requests ?? [];
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  const canSubmit =
    trimmedSubject.length > 0 && trimmedMessage.length >= 10 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    Keyboard.dismiss();

    try {
      await submitSupport({
        subject: trimmedSubject,
        message: trimmedMessage,
        category,
      }).unwrap();

      setSubject("");
      setMessage("");
      setCategory("general");
      Toast.show({
        type: "success",
        text1: "Message sent",
        text2: "Our team will review it in the admin panel.",
      });
    } catch (error) {
      Alert.alert(
        "Could not send message",
        getErrorMessage(error, "Please try again in a moment."),
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.centerWrap}>
            <Text style={styles.emptyTitle}>Help & Support</Text>
            <Text style={styles.emptyDescription}>
              Sign in to contact the Osstel support team.
            </Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScreenHeader title="Help & Support" showBack />

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={isFetching && !isLoading}
                  onRefresh={refetch}
                  tintColor={colors.primary}
                />
              }
            >
              <View style={styles.infoCard}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={vs(24)}
                  color={colors.primary}
                />
                <Text style={styles.infoTitle}>Contact Osstel Admin</Text>
                <Text style={styles.infoText}>
                  Send a message and it will appear directly in the admin panel
                  for review.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>New message</Text>
              <View style={styles.formCard}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryRow}>
                  {SUPPORT_CATEGORIES.map((item) => {
                    const active = category === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.categoryChip,
                          active && styles.categoryChipActive,
                        ]}
                        onPress={() => setCategory(item.id)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            active && styles.categoryChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>Subject</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Brief summary of your issue"
                  placeholderTextColor={colors.gray200}
                  maxLength={SUBJECT_MAX_LENGTH}
                />

                <Text style={styles.label}>Message</Text>
                <TextInput
                  style={[styles.input, styles.messageInput]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe your issue or question (min 10 characters)"
                  placeholderTextColor={colors.gray200}
                  multiline
                  textAlignVertical="top"
                  maxLength={MESSAGE_MAX_LENGTH}
                />
                <Text style={styles.charCount}>
                  {message.length}/{MESSAGE_MAX_LENGTH}
                </Text>

                <CustomButton
                  title="Send to Admin"
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  loading={isSubmitting}
                />
              </View>

              <Text style={styles.sectionTitle}>Your messages</Text>
              {isLoading ? (
                <View style={styles.loadingWrap}>
                  <CustomLoading size="sm" />
                </View>
              ) : requests.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  description="Your submitted messages will appear here with status updates."
                  size="sm"
                  style={styles.emptyCard}
                />
              ) : (
                requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    styles={styles}
                    colors={colors}
                    isDark={isDark}
                  />
                ))
              )}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    flex: {
      flex: 1,
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    infoCard: {
      backgroundColor: isDark ? colors.primary100 : colors.primary100,
      borderRadius: vs(16),
      padding: vs(18),
      alignItems: "center",
      marginBottom: vs(20),
      borderWidth: 1,
      borderColor: isDark ? colors.primary200 : colors.primary200,
    },
    infoTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: vs(10),
      marginBottom: vs(6),
    },
    infoText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(20),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: vs(10),
      marginLeft: vs(4),
    },
    formCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(16),
      marginBottom: vs(24),
    },
    label: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    categoryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: vs(8),
      marginBottom: vs(16),
    },
    categoryChip: {
      paddingHorizontal: vs(12),
      paddingVertical: vs(8),
      borderRadius: vs(20),
      backgroundColor: colors.white100,
      borderWidth: 1,
      borderColor: colors.white100,
    },
    categoryChipActive: {
      backgroundColor: colors.primary100,
      borderColor: colors.primary200,
    },
    categoryChipText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    categoryChipTextActive: {
      color: colors.primary,
      fontFamily: fonts.semiBold,
    },
    input: {
      backgroundColor: colors.white100,
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white100,
      paddingHorizontal: vs(14),
      paddingVertical: vs(12),
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: vs(14),
    },
    messageInput: {
      minHeight: vs(120),
      marginBottom: vs(6),
    },
    charCount: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "right",
      marginBottom: vs(16),
    },
    loadingWrap: {
      paddingVertical: vs(24),
      alignItems: "center",
    },
    emptyCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(24),
      alignItems: "center",
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
      marginTop: vs(12),
      marginBottom: vs(8),
      textAlign: "center",
    },
    emptyDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      lineHeight: vs(22),
    },
    requestCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(10),
    },
    requestHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: vs(10),
      marginBottom: vs(10),
    },
    requestHeaderLeft: {
      flex: 1,
    },
    requestSubject: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    requestMeta: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    statusBadge: {
      paddingHorizontal: vs(10),
      paddingVertical: vs(5),
      borderRadius: vs(20),
    },
    statusOpen: {
      backgroundColor: colors.warningBg,
    },
    statusInProgress: {
      backgroundColor: colors.infoBg,
    },
    statusResolved: {
      backgroundColor: colors.successBg,
    },
    statusText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
    },
    statusTextOpen: {
      color: colors.warning,
    },
    statusTextInProgress: {
      color: colors.primary,
    },
    statusTextResolved: {
      color: colors.success,
    },
    requestMessage: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(20),
    },
    replyBox: {
      marginTop: vs(12),
      borderRadius: vs(12),
      padding: vs(12),
    },
    replyBoxLight: {
      backgroundColor: colors.white100,
    },
    replyBoxDark: {
      backgroundColor: colors.white100,
    },
    replyLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      marginBottom: vs(4),
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    replyText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(20),
    },
    replyDate: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginTop: vs(6),
    },
  });
}
