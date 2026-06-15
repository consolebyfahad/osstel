import HostelDropdown from "@/components/HostelDropdown";
import ProfileAvatar from "@/components/ProfileAvatar";
import ReportScaffold from "@/components/reports/ReportScaffold";
import type { Hostel } from "@/types/hostel";
import type { ResidentsListReportData } from "@/types/report";
import {
  buildResidentsReportData,
  mapResidentsWithHostel,
} from "@/utils/reports/data";
import {
  formatReportDate,
  formatShortDate,
  sanitizeFileName,
} from "@/utils/reports/format";
import { buildResidentsListHtml } from "@/utils/reports/html";
import { downloadReportPdf } from "@/utils/reports/pdf";
import { formatCnic } from "@/utils/cnic";
import {
  useGetHostelsQuery,
  useLazyGetResidentsQuery,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

export default function ResidentsReportScreen() {
  const { colors, fonts, isDark } = useTheme();
  const previewStyles = useMemo(
    () => createPreviewStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const generatedBy = user?.name?.trim() || "Manager";

  const [selectedHostelId, setSelectedHostelId] = useState("all");
  const [reportData, setReportData] = useState<ResidentsListReportData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const { data: hostelsData } = useGetHostelsQuery();
  const [fetchResidents] = useLazyGetResidentsQuery();

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

      const groups = await Promise.all(
        targetHostels.map(async (hostel) => {
          const response = await fetchResidents({ hostelId: hostel.id })
            .unwrap()
            .catch(() => ({ residents: [] }));
          return mapResidentsWithHostel(response.residents ?? [], hostel.name);
        }),
      );

      setReportData(
        buildResidentsReportData(groups.flat(), {
          scopeLabel,
          generatedBy,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [fetchResidents, generatedBy, hostelOptions, scopeLabel, selectedHostelId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleDownload = async () => {
    if (!reportData) return;

    setDownloading(true);
    try {
      const html = buildResidentsListHtml(reportData);
      const fileName = sanitizeFileName(`vaas-residents-${scopeLabel}`);
      await downloadReportPdf(html, fileName);
    } catch {
      Alert.alert("Download failed", "Could not generate the PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ReportScaffold
      title="Residents Directory"
      subtitle={`${reportData?.residents.length ?? 0} residents`}
      loading={loading}
      downloading={downloading}
      downloadDisabled={!reportData || reportData.residents.length === 0}
      onDownload={handleDownload}
      controls={
        <HostelDropdown
          hostels={hostelOptions}
          value={selectedHostelId}
          onChange={setSelectedHostelId}
          showAllOption
        />
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
              Total residents: {reportData.residents.length}
            </Text>
          </View>

          {reportData.residents.length === 0 ? (
            <Text style={previewStyles.emptyText}>
              No residents found for this scope.
            </Text>
          ) : (
            reportData.residents.map((resident) => (
              <View key={resident.tenancyId} style={previewStyles.recordCard}>
                <ProfileAvatar
                  name={resident.name}
                  phone={resident.phone}
                  imageUri={resident.profileImage}
                  size={vs(40)}
                />
                <View style={previewStyles.recordContent}>
                  <Text style={previewStyles.recordTitle}>{resident.name}</Text>
                  <Text style={previewStyles.recordMeta}>
                    Room {resident.roomNumber} · {resident.hostelName}
                  </Text>
                  <Text style={previewStyles.recordSubMeta}>
                    {resident.phone}
                    {resident.cnic
                      ? ` · ${formatCnic(resident.cnic)}`
                      : ""} · Check-in{" "}
                    {formatShortDate(resident.checkInDate)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </>
      ) : null}
    </ReportScaffold>
  );
}

function createPreviewStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  _isDark: boolean,
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
    emptyText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      paddingVertical: vs(24),
    },
    recordCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: vs(12),
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(12),
      marginBottom: vs(8),
    },
    recordContent: {
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
      fontFamily: fonts.medium,
      color: colors.gray200,
      marginBottom: vs(2),
    },
    recordSubMeta: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.regular,
      color: colors.gray300,
    },
  });
}
