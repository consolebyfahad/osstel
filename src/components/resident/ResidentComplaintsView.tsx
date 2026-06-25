import CustomButton from "@/components/CustomButton";
import AnimatedFilterBar from "@/components/AnimatedFilterBar";
import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import {
  COMPLAINT_FILTERS,
  COMPLAINT_STATUS_LABELS,
  type Complaint,
  type ComplaintFilter,
  type ComplaintStatus,
} from "@/types/complaint";
import {
  useCreateComplaintMutation,
  useGetMeQuery,
  useGetMyComplaintsQuery,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
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

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 1000;

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

type ResidentComplaintCardProps = {
  complaint: Complaint;
  styles: ReturnType<typeof createStyles>;
};

function ResidentComplaintCard({ complaint, styles }: ResidentComplaintCardProps) {
  const statusStyle =
    complaint.status === "resolved"
      ? styles.statusResolved
      : complaint.status === "in_progress"
        ? styles.statusInProgress
        : styles.statusOpen;

  const statusTextStyle =
    complaint.status === "resolved"
      ? styles.statusTextResolved
      : complaint.status === "in_progress"
        ? styles.statusTextInProgress
        : styles.statusTextOpen;

  const metaParts = [
    complaint.hostel?.name,
    complaint.room ? `Room ${complaint.room.roomNumber}` : null,
  ].filter(Boolean);

  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordHeaderLeft}>
          <Text style={styles.recordTitle}>{complaint.title}</Text>
          {metaParts.length > 0 ? (
            <Text style={styles.recordMeta}>{metaParts.join(" · ")}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, statusTextStyle]}>
            {COMPLAINT_STATUS_LABELS[complaint.status as ComplaintStatus]}
          </Text>
        </View>
      </View>

      {complaint.description ? (
        <Text style={styles.recordDescription}>{complaint.description}</Text>
      ) : null}

      <Text style={styles.recordDate}>{formatDate(complaint.createdAt)}</Text>
    </View>
  );
}

export default function ResidentComplaintsView() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const [activeFilter, setActiveFilter] = useState<ComplaintFilter>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: meData } = useGetMeQuery();
  const hasHostel = Boolean(meData?.user?.hostel ?? meData?.user?.room);

  const {
    data: complaintsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetMyComplaintsQuery({ status: activeFilter });

  const [createComplaint, { isLoading: isSubmitting }] =
    useCreateComplaintMutation();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const complaints = complaintsData?.complaints ?? [];
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const canSubmit =
    hasHostel &&
    trimmedTitle.length > 0 &&
    trimmedDescription.length >= 10 &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    Keyboard.dismiss();

    try {
      await createComplaint({
        title: trimmedTitle,
        description: trimmedDescription,
      }).unwrap();

      setTitle("");
      setDescription("");
      Toast.show({
        type: "success",
        text1: "Complaint submitted",
        text2: "Your hostel manager has been notified.",
      });
    } catch (error) {
      Alert.alert(
        "Could not submit complaint",
        getErrorMessage(error, "Please try again in a moment."),
      );
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="My Complaints" showBack />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
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
                  name="chatbox-ellipses-outline"
                  size={vs(28)}
                  color={colors.primary}
                />
                <Text style={styles.infoTitle}>Report a hostel issue</Text>
                <Text style={styles.infoText}>
                  Submit maintenance or facility complaints to your hostel
                  manager. For Osstel app help, use Help & Support in Profile.
                </Text>
              </View>

              {!hasHostel ? (
                <EmptyState
                  title="No hostel assigned"
                  description="You need an active hostel tenancy before filing complaints."
                />
              ) : (
                <>
                  <Text style={styles.sectionTitle}>New complaint</Text>
                  <View style={styles.formCard}>
                    <Text style={styles.inputLabel}>Title</Text>
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Brief summary of the issue"
                      placeholderTextColor={colors.gray300}
                      maxLength={TITLE_MAX_LENGTH}
                    />

                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Describe the issue in detail (min. 10 characters)"
                      placeholderTextColor={colors.gray300}
                      multiline
                      textAlignVertical="top"
                      maxLength={DESCRIPTION_MAX_LENGTH}
                    />

                    <CustomButton
                      title={isSubmitting ? "Submitting..." : "Submit Complaint"}
                      onPress={handleSubmit}
                      disabled={!canSubmit}
                    />
                  </View>
                </>
              )}

              <Text style={styles.sectionTitle}>Your complaints</Text>

              <AnimatedFilterBar
                filters={COMPLAINT_FILTERS}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                style={styles.filterBarSpacing}
              />

              {isLoading ? (
                <CustomLoading size="md" style={styles.loader} />
              ) : complaints.length === 0 ? (
                <EmptyState
                  title="No complaints yet"
                  description={
                    activeFilter === "all"
                      ? "Your submitted complaints will appear here."
                      : `No ${COMPLAINT_STATUS_LABELS[activeFilter as ComplaintStatus]?.toLowerCase() ?? activeFilter} complaints found.`
                  }
                />
              ) : (
                complaints.map((complaint) => (
                  <ResidentComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    styles={styles}
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
      borderColor: colors.primary200,
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
      letterSpacing: 0.6,
      marginBottom: vs(10),
    },
    formCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(16),
      marginBottom: vs(24),
    },
    inputLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.white100,
      borderRadius: vs(12),
      paddingHorizontal: vs(14),
      paddingVertical: vs(12),
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      marginBottom: vs(14),
    },
    textArea: {
      minHeight: vs(120),
    },
    filterBarSpacing: {
      marginBottom: vs(12),
    },
    loader: {
      marginVertical: vs(24),
    },
    recordCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(16),
      marginBottom: vs(12),
    },
    recordHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: vs(10),
      marginBottom: vs(10),
    },
    recordHeaderLeft: {
      flex: 1,
    },
    recordTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(4),
    },
    recordMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    recordDescription: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: vs(20),
      marginBottom: vs(10),
    },
    recordDate: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray300,
    },
    statusBadge: {
      paddingHorizontal: vs(10),
      paddingVertical: vs(6),
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
  });
}
