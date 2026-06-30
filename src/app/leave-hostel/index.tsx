import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import { useCreateLeaveRequestMutation, useGetMeQuery } from "../../../store/api";
import { getApiErrorMessage } from "@/utils/api";
import { toIsoDateString } from "@/types/auth";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LeaveHostelScreen() {
  const { colors, fonts } = useTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const { data: meData } = useGetMeQuery();
  const securityDeposit = meData?.user.securityDeposit ?? 0;

  const defaultLeaveDate = useMemo(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    [],
  );

  const [leavingDate, setLeavingDate] = useState(defaultLeaveDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateDraft, setDateDraft] = useState(defaultLeaveDate);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [requestedRefund, setRequestedRefund] = useState("");
  const [createLeaveRequest, { isLoading }] = useCreateLeaveRequestMutation();

  useEffect(() => {
    if (securityDeposit > 0) {
      setRequestedRefund(String(securityDeposit));
    }
  }, [securityDeposit]);

  const daysUntilLeave = Math.ceil(
    (leavingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const shortNotice = daysUntilLeave < 30;
  const parsedRefund =
    requestedRefund.trim() === "" ? null : Number(requestedRefund);
  const refundInvalid =
    parsedRefund !== null &&
    (Number.isNaN(parsedRefund) ||
      parsedRefund < 0 ||
      parsedRefund > securityDeposit);

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selected) setLeavingDate(selected);
      return;
    }
    if (selected) setDateDraft(selected);
  };

  const handleDateConfirm = () => {
    setLeavingDate(dateDraft);
    setShowDatePicker(false);
  };

  const submitRequest = async () => {
    try {
      const result = await createLeaveRequest({
        leavingDate: toIsoDateString(leavingDate),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        ...(parsedRefund !== null && !refundInvalid
          ? { requestedRefundAmount: parsedRefund }
          : {}),
      }).unwrap();

      Alert.alert(
        "Request submitted",
        result.leaveRequest.shortNotice
          ? "Your leave request was sent. Note: it is less than 30 days before your leaving date."
          : "Your leave request was sent to the hostel manager.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert(
        "Could not submit request",
        getApiErrorMessage(error) || "Please try again.",
      );
    }
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert("Reason required", "Please enter a reason for leaving.");
      return;
    }

    if (refundInvalid) {
      Alert.alert(
        "Invalid refund amount",
        `Refund cannot exceed your security deposit of Rs ${securityDeposit.toLocaleString()}.`,
      );
      return;
    }

    const confirm = () => {
      if (shortNotice) {
        Alert.alert(
          "Less than 30 days notice",
          "You are submitting a leave request less than 30 days before your leaving date. The manager may still approve or reject it.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Submit anyway", onPress: () => void submitRequest() },
          ],
        );
        return;
      }
      void submitRequest();
    };

    if (securityDeposit > 0) {
      Alert.alert(
        "Submit leave request?",
        `Your manager will review your request. Security deposit on record: Rs ${securityDeposit.toLocaleString()}.${
          parsedRefund !== null && parsedRefund > 0
            ? ` You requested a refund of Rs ${parsedRefund.toLocaleString()}.`
            : ""
        }`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit", onPress: confirm },
        ],
      );
      return;
    }

    confirm();
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Leave Hostel" showBack />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.intro}>
              Submit a request to leave your current hostel. Your account stays
              active and you can join another hostel later after approval.
            </Text>

            {securityDeposit > 0 ? (
              <View style={styles.depositCard}>
                <Ionicons
                  name="wallet-outline"
                  size={vs(22)}
                  color={colors.primary}
                />
                <View style={styles.depositTextWrap}>
                  <Text style={styles.depositTitle}>Security deposit</Text>
                  <Text style={styles.depositValue}>
                    Rs {securityDeposit.toLocaleString()} held
                  </Text>
                  <Text style={styles.depositHint}>
                    This amount is refundable. Mention how much you expect back
                    below and your manager will confirm on approval.
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.dateField}>
              <Text style={styles.label}>Leaving Date</Text>
              <Pressable
                style={styles.dateInput}
                onPress={() => {
                  setDateDraft(leavingDate);
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateText}>
                  {leavingDate.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={vs(20)}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            {shortNotice ? (
              <Text style={styles.warning}>
                This is less than 30 days from today. You can still submit, but
                approval is up to your manager.
              </Text>
            ) : null}

            <CustomInput
              label="Reason for leaving"
              placeholder="Why are you leaving?"
              value={reason}
              onChangeText={setReason}
              multiline={true}
            />

            {securityDeposit > 0 ? (
              <CustomInput
                label="Requested security deposit refund (Rs)"
                placeholder={String(securityDeposit)}
                value={requestedRefund}
                onChangeText={(text) =>
                  setRequestedRefund(text.replace(/[^0-9]/g, "").slice(0, 8))
                }
                keyboardType="number-pad"
                hint={`Maximum refundable: Rs ${securityDeposit.toLocaleString()}`}
              />
            ) : null}

            {refundInvalid ? (
              <Text style={styles.errorText}>
                Refund amount must be between 0 and Rs{" "}
                {securityDeposit.toLocaleString()}.
              </Text>
            ) : null}

            <CustomInput
              label="Additional Notes"
              placeholder="Optional details for your manager"
              value={notes}
              onChangeText={setNotes}
              multiline={true}
            />

            <CustomButton
              title="Submit Leave Request"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={refundInvalid}
            />
          </ScrollView>

          {Platform.OS === "ios" ? (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <Pressable
                style={styles.dateModalOverlay}
                onPress={() => setShowDatePicker(false)}
              >
                <Pressable style={styles.dateModalSheet} onPress={() => {}}>
                  <View style={styles.dateModalHeader}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateModalAction}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.dateModalTitle}>Leaving Date</Text>
                    <Pressable onPress={handleDateConfirm}>
                      <Text style={styles.dateModalAction}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={dateDraft}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          ) : showDatePicker ? (
            <DateTimePicker
              value={dateDraft}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    flex: { flex: 1 },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    intro: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(20),
      marginBottom: vs(20),
    },
    depositCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: vs(12),
      backgroundColor: colors.primary100,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.gradientBorder,
      padding: vs(14),
      marginBottom: vs(16),
    },
    depositTextWrap: { flex: 1 },
    depositTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      marginBottom: vs(2),
    },
    depositValue: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(4),
    },
    depositHint: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      lineHeight: vs(18),
    },
    dateField: { marginBottom: vs(12) },
    label: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray300,
      marginBottom: vs(6),
    },
    dateInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.white,
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: vs(14),
      paddingVertical: vs(14),
    },
    dateText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    warning: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.warning,
      marginBottom: vs(12),
      lineHeight: vs(18),
    },
    errorText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.error,
      marginBottom: vs(12),
      marginTop: vs(-4),
    },
    dateModalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    dateModalSheet: {
      backgroundColor: colors.white,
      borderTopLeftRadius: vs(16),
      borderTopRightRadius: vs(16),
      paddingBottom: vs(24),
    },
    dateModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: vs(16),
      paddingVertical: vs(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateModalTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    dateModalAction: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
  });
}
