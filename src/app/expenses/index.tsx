import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomLoading from "@/components/CustomLoading";
import EmptyState from "@/components/EmptyState";
import GradientBackground from "@/components/GradientBackground";
import HostelDropdown from "@/components/HostelDropdown";
import ImageUploadField, {
  type UploadedImageValue,
} from "@/components/ImageUploadField";
import MonthYearPicker from "@/components/reports/MonthYearPicker";
import ScreenHeader from "@/components/ScreenHeader";
import type { Expense } from "@/types/expense";
import type { Hostel } from "@/types/hostel";
import { formatCompactCurrency } from "@/utils/currency";
import {
  getImageTooLargeMessage,
  prepareImageForUpload,
} from "@/utils/imageUpload";
import { formatMonthYear } from "@/utils/reports/format";
import {
  useGetExpensesQuery,
  useGetHostelsQuery,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ExpenseCard({
  expense,
  styles,
  colors,
}: {
  expense: Expense;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
}) {
  return (
    <View style={styles.expenseCard}>
      {expense.image ? (
        <Image
          source={{ uri: expense.image }}
          style={styles.expenseImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.expenseImagePlaceholder}>
          <Ionicons name="receipt-outline" size={vs(22)} color={colors.gray300} />
        </View>
      )}
      <View style={styles.expenseContent}>
        <Text style={styles.expenseTitle}>{expense.title}</Text>
        {expense.details ? (
          <Text style={styles.expenseDetails} numberOfLines={2}>
            {expense.details}
          </Text>
        ) : null}
        <Text style={styles.expenseAmount}>
          Rs {expense.amount.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function ExpensesScreen() {
  const { colors, fonts, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedHostelId, setSelectedHostelId] = useState("");

  const { data: hostelsData } = useGetHostelsQuery(undefined);
  const hostelOptions = useMemo(
    () =>
      (hostelsData?.hostels ?? []).map((hostel: Hostel) => ({
        id: hostel._id,
        name: hostel.name,
      })),
    [hostelsData?.hostels],
  );

  useEffect(() => {
    if (hostelOptions.length === 0) return;
    const exists = hostelOptions.some(
      (hostel) => hostel.id === selectedHostelId,
    );
    if (!selectedHostelId || !exists) {
      setSelectedHostelId(
        hostelOptions.length > 1 ? hostelOptions[0].id : hostelOptions[0].id,
      );
    }
  }, [hostelOptions, selectedHostelId]);

  const {
    data: expensesData,
    isLoading,
    isFetching,
    refetch,
  } = useGetExpensesQuery(
    { hostelId: selectedHostelId, month, year },
    { skip: !selectedHostelId },
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedHostelId) refetch();
    }, [refetch, selectedHostelId]),
  );

  const expenses = expensesData?.expenses ?? [];
  const summary = expensesData?.summary;
  const isEmpty = !isLoading && expenses.length === 0;

  if (hostelOptions.length === 0) {
    return (
      <GradientBackground style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.flex}>
            <ScreenHeader title="Expenses" showBack />
            <EmptyState
              title="No hostels yet"
              description="Add a hostel first to track expenses."
              actionLabel="Go to Hostels"
              onAction={() => router.push("/(tabs)/hostels")}
            />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.flex}>
          <ScreenHeader
            title="Expenses"
            showBack
            rightSlot={
              <Pressable
                style={styles.addBtn}
                onPress={() =>
                  router.push({
                    pathname: "/expenses/add",
                    params: selectedHostelId
                      ? { hostelId: selectedHostelId }
                      : undefined,
                  })
                }
              >
                <Ionicons name="add" size={vs(24)} color={colors.primary} />
              </Pressable>
            }
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
                name="wallet-outline"
                size={vs(24)}
                color={colors.primary}
              />
              <Text style={styles.infoTitle}>Hostel Expenses</Text>
              <Text style={styles.infoText}>
                Track repairs, utilities, and other hostel spending by month.
              </Text>
            </View>

            <View style={styles.dropdownWrap}>
              <HostelDropdown
                hostels={hostelOptions}
                value={selectedHostelId}
                onChange={setSelectedHostelId}
                showAllOption={false}
              />
            </View>

            <MonthYearPicker
              month={month}
              year={year}
              onChange={(nextMonth, nextYear) => {
                setMonth(nextMonth);
                setYear(nextYear);
              }}
            />

            {summary ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>
                  {formatMonthYear(month, year)} total
                </Text>
                <Text style={styles.summaryValue}>
                  {formatCompactCurrency(summary.totalAmount)}
                </Text>
                <Text style={styles.summaryHint}>
                  {summary.count} expense{summary.count === 1 ? "" : "s"}
                </Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>All expenses</Text>

            {isLoading ? (
              <View style={styles.loadingWrap}>
                <CustomLoading size="md" />
              </View>
            ) : isEmpty ? (
              <EmptyState
                title="No expenses yet"
                description={`No expenses recorded for ${formatMonthYear(month, year)}.`}
                actionLabel="Add Expense"
                onAction={() =>
                  router.push({
                    pathname: "/expenses/add",
                    params: { hostelId: selectedHostelId },
                  })
                }
                size="sm"
              />
            ) : (
              expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  styles={styles}
                  colors={colors}
                />
              ))
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: "transparent" },
    flex: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: vs(20),
      paddingBottom: vs(40),
    },
    addBtn: {
      width: vs(40),
      height: vs(40),
      alignItems: "center",
      justifyContent: "center",
    },
    infoCard: {
      backgroundColor: colors.primary100,
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
    dropdownWrap: { marginBottom: vs(16) },
    summaryCard: {
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(16),
      marginBottom: vs(16),
    },
    summaryLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(4),
    },
    summaryValue: {
      fontSize: FONT_SIZES.xxl,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    summaryHint: {
      marginTop: vs(4),
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
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
    loadingWrap: {
      paddingVertical: vs(24),
      alignItems: "center",
    },
    expenseCard: {
      flexDirection: "row",
      gap: vs(12),
      backgroundColor: isDark ? colors.white100 : colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(12),
      marginBottom: vs(10),
    },
    expenseImage: {
      width: vs(72),
      height: vs(72),
      borderRadius: vs(12),
      backgroundColor: colors.white100,
    },
    expenseImagePlaceholder: {
      width: vs(72),
      height: vs(72),
      borderRadius: vs(12),
      backgroundColor: colors.white100,
      alignItems: "center",
      justifyContent: "center",
    },
    expenseContent: { flex: 1 },
    expenseTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(4),
    },
    expenseDetails: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      marginBottom: vs(6),
      lineHeight: vs(18),
    },
    expenseAmount: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.error,
    },
  });
}
