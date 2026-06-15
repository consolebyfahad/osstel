import CustomButton from "@/components/CustomButton";
import ImageUploadField, {
  type UploadedImageValue,
} from "@/components/ImageUploadField";
import type { RentRecord, RentStatus } from "@/types/rent";
import { isRentDueWindow, rentDueDateLabel } from "@/utils/rent";
import {
  buildResidentRentHistoryHtml,
  type ResidentRentHistoryReportData,
} from "@/utils/reports/html";
import { downloadReportPdf } from "@/utils/reports/pdf";
import { sanitizeFileName } from "@/utils/reports/format";
import {
  useGetMeQuery,
  useGetMyRentHistoryQuery,
  useGetMyRentQuery,
  useSubmitRentPaymentMutation,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { formatShortDate } from "@/utils/reports/format";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomLoading from "@/components/CustomLoading";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function statusLabel(status: RentStatus) {
  if (status === "paid") return "Paid";
  if (status === "review") return "Under Review";
  return "Pending";
}

function statusMessage(record: RentRecord) {
  if (record.rejectionReason) {
    return "Your payment was rejected. Please submit a new proof.";
  }
  if (record.status === "paid") {
    return "Payment approved by your hostel manager.";
  }
  if (record.status === "review") {
    return "Payment proof sent. Waiting for owner approval.";
  }
  return "Rent is pending. Submit your payment proof when ready.";
}

type StatusBadgeProps = {
  status: RentStatus;
  rejected?: boolean;
  styles: ReturnType<typeof createStyles>;
};

function StatusBadge({ status, rejected, styles }: StatusBadgeProps) {
  const badgeStyle = rejected
    ? styles.statusRejected
    : status === "paid"
      ? styles.statusPaid
      : status === "review"
        ? styles.statusReview
        : styles.statusPending;

  const textStyle = rejected
    ? styles.statusTextRejected
    : status === "paid"
      ? styles.statusTextPaid
      : status === "review"
        ? styles.statusTextReview
        : styles.statusTextPending;

  const label = rejected ? "Rejected" : statusLabel(status);

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusText, textStyle]}>{label}</Text>
    </View>
  );
}

type PaymentProofCardProps = {
  record: RentRecord;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
};

function PaymentProofCard({ record, styles, colors }: PaymentProofCardProps) {
  const rejected = Boolean(record.rejectionReason);
  const showProof =
    Boolean(record.paymentProof) ||
    record.status === "review" ||
    record.status === "paid" ||
    rejected;

  if (!showProof) return null;

  return (
    <View style={styles.proofCard}>
      <View style={styles.proofHeader}>
        <View style={styles.proofHeaderLeft}>
          <Ionicons name="receipt-outline" size={vs(18)} color={colors.primary} />
          <Text style={styles.proofTitle}>Payment Proof</Text>
        </View>
        <StatusBadge
          status={record.status}
          rejected={rejected}
          styles={styles}
        />
      </View>

      {record.paymentProof ? (
        <Image
          source={{ uri: record.paymentProof }}
          style={styles.proofImage}
          resizeMode="cover"
        />
      ) : null}

      {record.submittedAt ? (
        <Text style={styles.proofMeta}>
          Submitted {formatShortDate(record.submittedAt)}
        </Text>
      ) : null}

      {record.rejectionReason ? (
        <Text style={styles.rejectionText}>
          Rejected: {record.rejectionReason}
        </Text>
      ) : null}

      <Text style={styles.proofMessage}>{statusMessage(record)}</Text>
    </View>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    data?: { message?: string; errors?: { msg: string }[] } | string;
  };
  if (typeof err.data === "string") return err.data;
  if (err.data?.errors?.length) return err.data.errors.map((e) => e.msg).join("\n");
  if (err.data?.message) return err.data.message;
  return fallback;
}

export default function ResidentRentView() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const month = now.getMonth() + 1;

  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentProof, setPaymentProof] = useState<UploadedImageValue>({
    localUri: null,
    uploadValue: null,
  });
  const [paymentNote, setPaymentNote] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<RentRecord | null>(null);

  const { data: meData, refetch: refetchMe } = useGetMeQuery();
  const {
    data: currentRentData,
    isLoading: currentLoading,
    isFetching: currentFetching,
    refetch: refetchCurrent,
    isError: currentError,
  } = useGetMyRentQuery({ month, year: now.getFullYear() });

  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
    refetch: refetchHistory,
  } = useGetMyRentHistoryQuery({ year });

  const [submitPayment, { isLoading: isSubmitting }] =
    useSubmitRentPaymentMutation();

  useFocusEffect(
    useCallback(() => {
      refetchMe();
      refetchCurrent();
      refetchHistory();
    }, [refetchCurrent, refetchHistory, refetchMe]),
  );

  const profile = meData?.user ?? user;
  const room = profile?.room ?? user?.room;
  const hostel = profile?.hostel ?? user?.hostel;
  const currentRecord = currentRentData?.record ?? pendingRecord;

  useEffect(() => {
    if (currentRentData?.record) {
      setPendingRecord(null);
    }
  }, [currentRentData?.record]);

  const hasRentRecord = Boolean(currentRecord?.id);
  const currentStatus = currentRecord?.status;
  const canSubmitPayment =
    hasRentRecord &&
    (currentStatus === "pending" || Boolean(currentRecord?.rejectionReason));
  const showDueHighlight =
    isRentDueWindow() &&
    (!hasRentRecord || currentStatus === "pending");

  const historyRecords = historyData?.records ?? [];

  const closePayModal = () => {
    setShowPayModal(false);
    setPaymentProof({ localUri: null, uploadValue: null });
    setPaymentNote("");
  };

  const handleSubmitPayment = async () => {
    if (!paymentProof.uploadValue) {
      Alert.alert("Payment screenshot required", "Upload a screenshot of your rent payment.");
      return;
    }

    const rentId = currentRecord?.id;
    if (!rentId) {
      Alert.alert(
        "Rent record unavailable",
        "Your rent record for this month is not ready yet. Please contact your hostel manager.",
      );
      return;
    }

    try {
      const result = await submitPayment({
        rentId,
        paymentProof: paymentProof.uploadValue,
        note: paymentNote.trim() || undefined,
      }).unwrap();

      setPendingRecord({
        ...result.record,
        paymentProof:
          result.record.paymentProof ?? paymentProof.uploadValue ?? null,
        status: result.record.status ?? "review",
        submittedAt: result.record.submittedAt ?? new Date().toISOString(),
      });

      closePayModal();
      Alert.alert(
        "Payment submitted",
        "Your payment proof has been sent to the hostel owner for approval.",
      );
      refetchCurrent();
      refetchHistory();
    } catch (error) {
      Alert.alert("Submission failed", getErrorMessage(error, "Could not submit payment."));
    }
  };

  const handleDownloadReport = async () => {
    if (!profile?.name || !hostel?.name || !room?.roomNumber) return;

    setDownloading(true);
    try {
      const reportData: ResidentRentHistoryReportData = {
        year,
        residentName: profile.name,
        hostelName: hostel.name,
        roomNumber: room.roomNumber,
        generatedAt: new Date().toISOString(),
        records: historyRecords.map((record) => ({
          month: new Date(record.dueDate).getMonth() + 1 || month,
          year: new Date(record.dueDate).getFullYear() || year,
          amount: record.amount,
          status: record.status,
        })),
        summary: historyData?.summary ?? {
          totalPaid: historyRecords
            .filter((record) => record.status === "paid")
            .reduce((sum, record) => sum + record.amount, 0),
          monthsPaid: historyRecords.filter((record) => record.status === "paid")
            .length,
          monthsPending: historyRecords.filter(
            (record) => record.status === "pending" || record.status === "review",
          ).length,
        },
      };

      const html = buildResidentRentHistoryHtml(reportData);
      await downloadReportPdf(
        html,
        sanitizeFileName(`vaas-my-rent-${year}-${profile.name}`),
      );
    } catch {
      Alert.alert("Download failed", "Could not generate your rent report.");
    } finally {
      setDownloading(false);
    }
  };

  const refreshing = (currentFetching && !currentLoading) || historyFetching;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rent</Text>
        <Text style={styles.subtitle}>
          {hostel?.name ?? "Hostel"} · Room {room?.roomNumber ?? "—"}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refetchCurrent();
              refetchHistory();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {showDueHighlight ? (
          <View style={styles.dueBanner}>
            <Ionicons name="alert-circle" size={vs(22)} color={colors.warning} />
            <View style={styles.dueBannerText}>
              <Text style={styles.dueBannerTitle}>Rent due soon</Text>
              <Text style={styles.dueBannerSub}>
                Please pay and submit proof before{" "}
                {rentDueDateLabel(month, now.getFullYear())}.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.currentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {MONTH_NAMES[month - 1]} {now.getFullYear()}
            </Text>
            {hasRentRecord && currentStatus ? (
              <StatusBadge
                status={currentStatus}
                rejected={Boolean(currentRecord?.rejectionReason)}
                styles={styles}
              />
            ) : null}
          </View>
          {currentLoading ? (
            <CustomLoading size="md" style={styles.loader} />
          ) : currentError ? (
            <Text style={styles.errorText}>
              Could not load this month&apos;s rent. Pull to refresh.
            </Text>
          ) : (
            <>
              <Text style={styles.amount}>
                Rs {(currentRecord?.amount ?? room?.rent ?? 0).toLocaleString()}
              </Text>
              {!hasRentRecord ? (
                <Text style={styles.reviewText}>
                  Your rent record for this month is not set up yet. Please
                  contact your hostel manager.
                </Text>
              ) : currentRecord ? (
                <PaymentProofCard
                  record={currentRecord}
                  styles={styles}
                  colors={colors}
                />
              ) : null}
              {canSubmitPayment && room ? (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => setShowPayModal(true)}
                >
                  <Ionicons name="cloud-upload-outline" size={vs(18)} color={colors.white} />
                  <Text style={styles.primaryBtnText}>
                    {currentRecord?.rejectionReason
                      ? "Resubmit Payment Proof"
                      : "Submit Payment Proof"}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <View style={styles.yearRow}>
            <Pressable
              style={styles.yearBtn}
              onPress={() => setYear((value) => value - 1)}
            >
              <Ionicons name="chevron-back" size={vs(18)} color={colors.text} />
            </Pressable>
            <Text style={styles.yearLabel}>{year}</Text>
            <Pressable
              style={styles.yearBtn}
              onPress={() => setYear((value) => value + 1)}
              disabled={year >= now.getFullYear()}
            >
              <Ionicons
                name="chevron-forward"
                size={vs(18)}
                color={year >= now.getFullYear() ? colors.gray300 : colors.text}
              />
            </Pressable>
          </View>
        </View>

        {historyLoading ? (
          <CustomLoading size="md" style={styles.loader} />
        ) : historyRecords.length === 0 ? (
          <Text style={styles.emptyText}>No rent records for {year}.</Text>
        ) : (
          historyRecords.map((record: RentRecord) => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.historyCardMain}>
                <Text style={styles.historyMonth}>
                  {MONTH_NAMES[new Date(record.dueDate).getMonth()] ??
                    "Month"}{" "}
                  {new Date(record.dueDate).getFullYear()}
                </Text>
                <Text style={styles.historyAmount}>
                  Rs {record.amount.toLocaleString()}
                </Text>
                {record.paymentProof ? (
                  <Text style={styles.historyProofHint}>Proof submitted</Text>
                ) : null}
              </View>
              <StatusBadge
                status={record.status}
                rejected={Boolean(record.rejectionReason)}
                styles={styles}
              />
            </View>
          ))
        )}

        <View style={styles.downloadWrap}>
          <CustomButton
            title={downloading ? "Generating PDF..." : "Download Year Report (PDF)"}
            onPress={handleDownloadReport}
            disabled={downloading || historyRecords.length === 0}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showPayModal}
        animationType="slide"
        transparent
        onRequestClose={closePayModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Submit Rent Payment</Text>
            <Text style={styles.modalSub}>
              Upload a screenshot of your bank transfer or payment receipt. It
              will be sent to your hostel owner for approval.
            </Text>

            <ImageUploadField
              label="Payment Screenshot"
              value={paymentProof}
              onChange={setPaymentProof}
              preset="document"
            />

            <Text style={styles.noteLabel}>Details (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={paymentNote}
              onChangeText={setPaymentNote}
              placeholder="Transaction ID, bank name, or notes..."
              placeholderTextColor={colors.gray200}
              multiline
              maxLength={300}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closePayModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <View style={styles.submitWrap}>
                <CustomButton
                  title={isSubmitting ? "Sending..." : "Send to Owner"}
                  onPress={handleSubmitPayment}
                  disabled={isSubmitting || !paymentProof.uploadValue}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: vs(20),
      paddingTop: vs(16),
      paddingBottom: vs(8),
    },
    title: {
      fontSize: FONT_SIZES.title,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginTop: vs(4),
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(110),
    },
    dueBanner: {
      flexDirection: "row",
      gap: vs(10),
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.15)" : "#FFFBEB",
      borderWidth: 1,
      borderColor: colors.warning,
      borderRadius: vs(14),
      padding: vs(14),
      marginBottom: vs(14),
    },
    dueBannerText: {
      flex: 1,
    },
    dueBannerTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    dueBannerSub: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginTop: vs(4),
      lineHeight: vs(18),
    },
    currentCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(16),
      marginBottom: vs(20),
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: vs(10),
      marginBottom: vs(10),
    },
    cardTitle: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    amount: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(12),
    },
    statusBadge: {
      paddingHorizontal: vs(10),
      paddingVertical: vs(4),
      borderRadius: vs(20),
    },
    statusPaid: {
      backgroundColor: isDark ? colors.secondary100 : "#DCFCE7",
    },
    statusReview: {
      backgroundColor: isDark ? colors.primary100 : "#DBEAFE",
    },
    statusPending: {
      backgroundColor: isDark ? "rgba(237, 161, 47, 0.15)" : "#FEF3C7",
    },
    statusRejected: {
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
    },
    statusText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
    },
    statusTextPaid: {
      color: colors.success,
    },
    statusTextReview: {
      color: colors.primary,
    },
    statusTextPending: {
      color: colors.warning,
    },
    statusTextRejected: {
      color: colors.error,
    },
    proofCard: {
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.white100,
      padding: vs(12),
      marginBottom: vs(12),
      gap: vs(10),
    },
    proofHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: vs(8),
    },
    proofHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
      flex: 1,
    },
    proofTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    proofImage: {
      width: "100%",
      height: vs(180),
      borderRadius: vs(12),
      backgroundColor: colors.white,
    },
    proofMeta: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    proofMessage: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      lineHeight: vs(18),
    },
    statusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: vs(8),
    },
    statusLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
    },
    statusValue: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    rejectionText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.error,
      marginBottom: vs(8),
    },
    reviewText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.primary,
      marginBottom: vs(8),
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: vs(8),
      backgroundColor: colors.primary,
      borderRadius: vs(12),
      paddingVertical: vs(12),
      marginTop: vs(8),
    },
    primaryBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.white,
    },
    historyHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: vs(12),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    yearRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(8),
    },
    yearBtn: {
      width: vs(32),
      height: vs(32),
      alignItems: "center",
      justifyContent: "center",
    },
    yearLabel: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
      minWidth: vs(48),
      textAlign: "center",
    },
    historyCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: vs(10),
      backgroundColor: colors.white,
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(8),
    },
    historyCardMain: {
      flex: 1,
    },
    historyMonth: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    historyAmount: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginTop: vs(2),
    },
    historyProofHint: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.primary,
      marginTop: vs(4),
    },
    emptyText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      paddingVertical: vs(24),
    },
    downloadWrap: {
      marginTop: vs(16),
    },
    loader: {
      marginVertical: vs(12),
    },
    errorText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.error,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalCard: {
      backgroundColor: colors.white,
      borderTopLeftRadius: vs(24),
      borderTopRightRadius: vs(24),
      padding: vs(20),
      paddingBottom: vs(32),
    },
    modalTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(8),
    },
    modalSub: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
      marginBottom: vs(16),
    },
    noteLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    noteInput: {
      minHeight: vs(90),
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white100,
      backgroundColor: colors.white100,
      padding: vs(12),
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: vs(16),
      textAlignVertical: "top",
    },
    modalActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(12),
    },
    cancelBtn: {
      paddingVertical: vs(14),
      paddingHorizontal: vs(12),
    },
    cancelBtnText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
    },
    submitWrap: {
      flex: 1,
    },
  });
}
