import HostelDropdown from "@/components/HostelDropdown";
import MonthYearPicker from "@/components/reports/MonthYearPicker";
import ReportScaffold from "@/components/reports/ReportScaffold";
import type { Hostel } from "@/types/hostel";
import type { RentCollectionReportData } from "@/types/report";
import { buildRentReportData } from "@/utils/reports/data";
import {
  formatCurrency,
  formatMonthYear,
  formatReportDate,
  rentStatusLabel,
  sanitizeFileName,
} from "@/utils/reports/format";
import { buildRentCollectionHtml } from "@/utils/reports/html";
import { downloadReportPdf } from "@/utils/reports/pdf";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_FEATURES } from "@/constants/plans";
import { showSubscriptionBlocked } from "@/utils/subscriptionAlert";
import {
  useGetHostelsQuery,
  useLazyGetRentQuery,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

function SummaryRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createPreviewStyles>;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function RentReportScreen() {
  const { colors, fonts, isDark } = useTheme();
  const previewStyles = useMemo(
    () => createPreviewStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const generatedBy = user?.name?.trim() || "Manager";
  const { checkFeature } = useSubscription();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedHostelId, setSelectedHostelId] = useState("all");
  const [reportData, setReportData] = useState<RentCollectionReportData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const { data: hostelsData } = useGetHostelsQuery();
  const [fetchRent] = useLazyGetRentQuery();

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
    if (selectedHostelId === "all") return;

    const exists = hostelOptions.some(
      (hostel) => hostel.id === selectedHostelId,
    );
    if (!exists) {
      setSelectedHostelId(hostelOptions.length > 1 ? "all" : hostelOptions[0].id);
    }
  }, [hostelOptions, selectedHostelId]);

  const scopeLabel = useMemo(() => {
    if (selectedHostelId === "all") return "All Hostels";
    return (
      hostelOptions.find((hostel) => hostel.id === selectedHostelId)?.name ??
      "Selected Hostel"
    );
  }, [hostelOptions, selectedHostelId]);

  const loadReport = useCallback(async () => {
    if (hostelOptions.length === 0) {
      setReportData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const targetHostels =
        selectedHostelId === "all"
          ? hostelOptions
          : hostelOptions.filter((hostel) => hostel.id === selectedHostelId);

      const responses = await Promise.all(
        targetHostels.map((hostel) =>
          fetchRent({
            hostelId: hostel.id,
            month,
            year,
            status: "all",
          })
            .unwrap()
            .catch(() => null),
        ),
      );

      const validResponses = responses.filter(Boolean);
      setReportData(
        buildRentReportData(validResponses as NonNullable<(typeof responses)[0]>[], {
          month,
          year,
          scopeLabel,
          generatedBy,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [
    fetchRent,
    generatedBy,
    hostelOptions,
    month,
    scopeLabel,
    selectedHostelId,
    year,
  ]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleDownload = async () => {
    if (!reportData) return;

    const exportCheck = checkFeature(PLAN_FEATURES.data_export);
    if (!exportCheck.allowed) {
      showSubscriptionBlocked(exportCheck.message);
      return;
    }

    setDownloading(true);
    try {
      const html = buildRentCollectionHtml(reportData);
      const fileName = sanitizeFileName(
        `osstel-rent-${year}-${month}-${scopeLabel}`,
      );
      await downloadReportPdf(html, fileName);
    } catch {
      Alert.alert("Download failed", "Could not generate the PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ReportScaffold
      title="Rent Collection Report"
      subtitle={formatMonthYear(month, year)}
      loading={loading}
      downloading={downloading}
      downloadDisabled={!reportData || reportData.sections.length === 0}
      onDownload={handleDownload}
      controls={
        <>
          <HostelDropdown
            hostels={hostelOptions}
            value={selectedHostelId}
            onChange={setSelectedHostelId}
            showAllOption
          />
          <MonthYearPicker
            month={month}
            year={year}
            onChange={(nextMonth, nextYear) => {
              setMonth(nextMonth);
              setYear(nextYear);
            }}
          />
        </>
      }
    >
      {reportData ? (
        <>
          <View style={previewStyles.metaCard}>
            <Text style={previewStyles.metaLine}>Scope: {scopeLabel}</Text>
            <Text style={previewStyles.metaLine}>
              Generated: {formatReportDate(reportData.generatedAt)}
            </Text>
            <Text style={previewStyles.metaLine}>
              Prepared by: {reportData.generatedBy}
            </Text>
          </View>

          <View style={previewStyles.summaryRow}>
            <SummaryRow
              label="Expected"
              value={formatCurrency(reportData.totals.expected)}
              styles={previewStyles}
            />
            <SummaryRow
              label="Collected"
              value={formatCurrency(reportData.totals.collected)}
              styles={previewStyles}
            />
            <SummaryRow
              label="Pending"
              value={formatCurrency(reportData.totals.pending)}
              styles={previewStyles}
            />
          </View>

          {reportData.sections.map((section) => (
            <View key={section.hostelId} style={previewStyles.sectionCard}>
              <Text style={previewStyles.sectionTitle}>{section.hostelName}</Text>
              <Text style={previewStyles.sectionMeta}>
                {section.records.length} resident
                {section.records.length === 1 ? "" : "s"}
              </Text>

              {section.records.length === 0 ? (
                <Text style={previewStyles.emptyText}>
                  No rent records for this month.
                </Text>
              ) : (
                section.records.map((record) => (
                  <View key={record.id} style={previewStyles.recordRow}>
                    <View style={previewStyles.recordMain}>
                      <Text style={previewStyles.recordTitle}>
                        {record.resident.name}
                      </Text>
                      <Text style={previewStyles.recordMeta}>
                        Room {record.room.roomNumber} ·{" "}
                        {record.resident.phone}
                      </Text>
                    </View>
                    <View style={previewStyles.recordRight}>
                      <Text style={previewStyles.recordAmount}>
                        {formatCurrency(record.amount)}
                      </Text>
                      <Text style={previewStyles.recordStatus}>
                        {rentStatusLabel(record.status)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ))}
        </>
      ) : null}
    </ReportScaffold>
  );
}

function createPreviewStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  isDark: boolean,
) {
  return StyleSheet.create({
    metaCard: {
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(12),
    },
    metaLine: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(4),
    },
    summaryRow: {
      flexDirection: "row",
      gap: vs(8),
      marginBottom: vs(12),
    },
    summaryItem: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(12),
    },
    summaryLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(4),
      textTransform: "uppercase",
    },
    summaryValue: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    sectionCard: {
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
      marginBottom: vs(10),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(4),
    },
    sectionMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(10),
    },
    emptyText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    recordRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: vs(10),
      borderTopWidth: 1,
      borderTopColor: colors.white100,
      gap: vs(10),
    },
    recordMain: {
      flex: 1,
    },
    recordTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: vs(2),
    },
    recordMeta: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.regular,
      color: colors.gray200,
    },
    recordRight: {
      alignItems: "flex-end",
    },
    recordAmount: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(2),
    },
    recordStatus: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      color: isDark ? colors.primary300 : colors.primary,
    },
  });
}
