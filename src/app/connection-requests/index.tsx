import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import ScreenHeader from "@/components/ScreenHeader";
import type { LeaveRequestItem } from "@/types/connection";
import {
  useApproveJoinRequestMutation,
  useApproveLeaveRequestMutation,
  useGetManagerJoinRequestsQuery,
  useGetManagerLeaveRequestsQuery,
  useRejectJoinRequestMutation,
  useRejectLeaveRequestMutation,
} from "../../../store/api";
import { getApiErrorMessage } from "@/utils/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConnectionRequestsScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const {
    data: joinData,
    isFetching: joinFetching,
    refetch: refetchJoin,
  } = useGetManagerJoinRequestsQuery();
  const {
    data: leaveData,
    isFetching: leaveFetching,
    refetch: refetchLeave,
  } = useGetManagerLeaveRequestsQuery();

  const [approveJoin] = useApproveJoinRequestMutation();
  const [rejectJoin] = useRejectJoinRequestMutation();
  const [approveLeave, { isLoading: isApprovingLeave }] =
    useApproveLeaveRequestMutation();
  const [rejectLeave] = useRejectLeaveRequestMutation();

  const [approveLeaveTarget, setApproveLeaveTarget] =
    useState<LeaveRequestItem | null>(null);
  const [refundAmount, setRefundAmount] = useState("");

  const joinRequests = joinData?.requests ?? [];
  const leaveRequests = leaveData?.requests ?? [];

  const handleJoinAction = (id: string, action: "approve" | "reject") => {
    const verb = action === "approve" ? "Approve" : "Reject";
    Alert.alert(`${verb} join request`, `Are you sure you want to ${action} this request?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: verb,
        style: action === "reject" ? "destructive" : "default",
        onPress: async () => {
          try {
            if (action === "approve") {
              await approveJoin(id).unwrap();
            } else {
              await rejectJoin(id).unwrap();
            }
          } catch (error) {
            Alert.alert("Action failed", getApiErrorMessage(error) || "Please try again.");
          }
        },
      },
    ]);
  };

  const openApproveLeaveModal = (request: LeaveRequestItem) => {
    const deposit = request.securityDepositHeld ?? 0;
    const suggested =
      request.requestedRefundAmount != null && request.requestedRefundAmount > 0
        ? String(request.requestedRefundAmount)
        : deposit > 0
          ? String(deposit)
          : "";
    setRefundAmount(suggested);
    setApproveLeaveTarget(request);
  };

  const closeApproveLeaveModal = () => {
    setApproveLeaveTarget(null);
    setRefundAmount("");
  };

  const handleConfirmApproveLeave = async () => {
    if (!approveLeaveTarget) return;

    const deposit = approveLeaveTarget.securityDepositHeld ?? 0;
    const parsedRefund = refundAmount.trim() === "" ? 0 : Number(refundAmount);

    if (Number.isNaN(parsedRefund) || parsedRefund < 0) {
      Alert.alert("Invalid amount", "Enter a valid refund amount.");
      return;
    }

    if (parsedRefund > deposit) {
      Alert.alert(
        "Invalid amount",
        `Refund cannot exceed the security deposit of Rs ${deposit.toLocaleString()}.`,
      );
      return;
    }

    try {
      const result = await approveLeave({
        id: approveLeaveTarget.id,
        refundAmount: parsedRefund,
      }).unwrap();

      closeApproveLeaveModal();

      Alert.alert(
        "Leave approved",
        parsedRefund > 0
          ? `${approveLeaveTarget.resident?.name ?? "Resident"} has been removed. Rs ${parsedRefund.toLocaleString()} refund recorded in expenses.`
          : `${approveLeaveTarget.resident?.name ?? "Resident"} has been removed from the hostel.`,
      );
    } catch (error) {
      Alert.alert("Action failed", getApiErrorMessage(error) || "Please try again.");
    }
  };

  const handleLeaveAction = (id: string, action: "approve" | "reject") => {
    if (action === "approve") {
      const request = leaveRequests.find((item) => item.id === id);
      if (request) openApproveLeaveModal(request);
      return;
    }

    Alert.alert("Reject leave request", "Are you sure you want to reject this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await rejectLeave(id).unwrap();
          } catch (error) {
            Alert.alert("Action failed", getApiErrorMessage(error) || "Please try again.");
          }
        },
      },
    ]);
  };

  const isEmpty = joinRequests.length === 0 && leaveRequests.length === 0;
  const approveDeposit = approveLeaveTarget?.securityDepositHeld ?? 0;

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader title="Connection Requests" showBack />
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isEmpty && styles.scrollContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={joinFetching || leaveFetching}
              onRefresh={() => {
                refetchJoin();
                refetchLeave();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {isEmpty ? (
            <EmptyState
              title="No pending requests"
              description="Join and leave requests from residents will appear here."
              size="sm"
            />
          ) : null}

          {joinRequests.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Join Requests</Text>
              {joinRequests.map((request) => (
                <View key={request.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{request.resident?.name}</Text>
                  <Text style={styles.cardMeta}>
                    {request.resident?.phone} · {request.hostel?.name}
                  </Text>
                  {request.tenancy?.roomNumber ? (
                    <Text style={styles.cardMeta}>
                      Room {request.tenancy.roomNumber}
                    </Text>
                  ) : null}
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleJoinAction(request.id, "approve")}
                    >
                      <Text style={styles.approveText}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleJoinAction(request.id, "reject")}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {leaveRequests.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Leave Requests</Text>
              {leaveRequests.map((request) => (
                <View key={request.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{request.resident?.name}</Text>
                  <Text style={styles.cardMeta}>
                    {request.hostel?.name} · Leaving{" "}
                    {new Date(request.leavingDate).toLocaleDateString()}
                  </Text>
                  {request.tenancy?.roomNumber ? (
                    <Text style={styles.cardMeta}>
                      Room {request.tenancy.roomNumber}
                    </Text>
                  ) : null}
                  <Text style={styles.cardMeta}>{request.reason}</Text>
                  {request.notes ? (
                    <Text style={styles.cardNotes}>{request.notes}</Text>
                  ) : null}
                  {(request.securityDepositHeld ?? 0) > 0 ? (
                    <View style={styles.depositRow}>
                      <Ionicons
                        name="wallet-outline"
                        size={vs(16)}
                        color={colors.primary}
                      />
                      <Text style={styles.depositMeta}>
                        Deposit held: Rs{" "}
                        {(request.securityDepositHeld ?? 0).toLocaleString()}
                        {request.requestedRefundAmount != null &&
                        request.requestedRefundAmount > 0
                          ? ` · Requested refund: Rs ${request.requestedRefundAmount.toLocaleString()}`
                          : ""}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleLeaveAction(request.id, "approve")}
                    >
                      <Text style={styles.approveText}>Approve & Remove</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleLeaveAction(request.id, "reject")}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>

        <Modal
          visible={approveLeaveTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={closeApproveLeaveModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Approve leave request</Text>
              <Text style={styles.modalText}>
                {approveLeaveTarget?.resident?.name} will be removed from{" "}
                {approveLeaveTarget?.hostel?.name} on{" "}
                {approveLeaveTarget
                  ? new Date(approveLeaveTarget.leavingDate).toLocaleDateString()
                  : ""}
                . Their app will be unlinked from this hostel.
              </Text>

              {approveDeposit > 0 ? (
                <>
                  <Text style={styles.modalSubtext}>
                    Security deposit on record: Rs {approveDeposit.toLocaleString()}
                    {approveLeaveTarget?.requestedRefundAmount != null &&
                    approveLeaveTarget.requestedRefundAmount > 0
                      ? `\nResident requested: Rs ${approveLeaveTarget.requestedRefundAmount.toLocaleString()}`
                      : ""}
                  </Text>
                  <CustomInput
                    label="Refund amount to return (Rs)"
                    placeholder="0"
                    value={refundAmount}
                    onChangeText={(text) =>
                      setRefundAmount(text.replace(/[^0-9]/g, "").slice(0, 8))
                    }
                    keyboardType="number-pad"
                    hint="This will be added to hostel expenses automatically."
                  />
                </>
              ) : (
                <Text style={styles.modalSubtext}>
                  No security deposit on record for this resident.
                </Text>
              )}

              <View style={styles.modalActions}>
                <CustomButton
                  title="Cancel"
                  onPress={closeApproveLeaveModal}
                  variant="outline"
                  style={styles.modalBtn}
                />
                <CustomButton
                  title="Approve Leave"
                  onPress={() => void handleConfirmApproveLeave()}
                  loading={isApprovingLeave}
                  style={styles.modalBtn}
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(colors: AppColors, fonts: typeof FONTS, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    scrollContent: { paddingHorizontal: vs(20), paddingBottom: vs(40) },
    scrollContentEmpty: { flexGrow: 1, justifyContent: "center" },
    sectionTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: vs(10),
      marginTop: vs(8),
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(12),
    },
    cardTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    cardMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(2),
    },
    cardNotes: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray300,
      marginTop: vs(4),
      fontStyle: "italic",
    },
    depositRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(6),
      marginTop: vs(8),
      paddingTop: vs(8),
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    depositMeta: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    actionsRow: {
      flexDirection: "row",
      gap: vs(10),
      marginTop: vs(12),
    },
    actionBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: vs(10),
      borderRadius: vs(10),
    },
    approveBtn: {
      backgroundColor: colors.successBg,
    },
    rejectBtn: {
      backgroundColor: colors.errorBg,
    },
    approveText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.success,
    },
    rejectText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.error,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      paddingHorizontal: vs(20),
    },
    modalCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      padding: vs(18),
    },
    modalTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(8),
    },
    modalText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray300,
      lineHeight: vs(20),
      marginBottom: vs(12),
    },
    modalSubtext: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      lineHeight: vs(18),
      marginBottom: vs(12),
    },
    modalActions: {
      flexDirection: "row",
      gap: vs(10),
      marginTop: vs(8),
    },
    modalBtn: {
      flex: 1,
    },
  });
}
