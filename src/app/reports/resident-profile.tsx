import ProfileAvatar from "@/components/ProfileAvatar";
import ReportScaffold from "@/components/reports/ReportScaffold";
import type { ResidentProfileReportData } from "@/types/report";
import { buildResidentProfileReportData } from "@/utils/reports/data";
import {
  formatReportDate,
  formatShortDate,
  sanitizeFileName,
} from "@/utils/reports/format";
import { buildResidentProfileHtml } from "@/utils/reports/html";
import { downloadReportPdf } from "@/utils/reports/pdf";
import { formatCnic } from "@/utils/cnic";
import {
  useGetHostelQuery,
  useGetResidentsQuery,
} from "../../../store/api";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

function DetailItem({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createPreviewStyles>;
}) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function ResidentProfileReportScreen() {
  const { tenancyId, hostelId } = useLocalSearchParams<{
    tenancyId?: string;
    hostelId?: string;
  }>();
  const { colors, fonts, isDark } = useTheme();
  const previewStyles = useMemo(
    () => createPreviewStyles(colors, fonts, isDark),
    [colors, fonts, isDark],
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const generatedBy = user?.name?.trim() || "Manager";
  const [downloading, setDownloading] = useState(false);

  const {
    data: residentsData,
    isLoading: residentsLoading,
  } = useGetResidentsQuery(
    { hostelId: hostelId ?? "" },
    { skip: !hostelId },
  );

  const { data: hostelData, isLoading: hostelLoading } = useGetHostelQuery(
    hostelId ?? "",
    { skip: !hostelId },
  );

  const resident = useMemo(
    () =>
      residentsData?.residents?.find(
        (item) => item.tenancyId === tenancyId,
      ) ?? null,
    [residentsData?.residents, tenancyId],
  );

  const reportData: ResidentProfileReportData | null = useMemo(() => {
    if (!resident) return null;
    return buildResidentProfileReportData(resident, hostelData?.hostel, {
      generatedBy,
    });
  }, [generatedBy, hostelData?.hostel, resident]);

  const loading = residentsLoading || hostelLoading;

  const handleDownload = async () => {
    if (!reportData) return;

    setDownloading(true);
    try {
      const html = buildResidentProfileHtml(reportData);
      const fileName = sanitizeFileName(`osstel-resident-${reportData.name}`);
      await downloadReportPdf(html, fileName);
    } catch {
      Alert.alert("Download failed", "Could not generate the resident PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (!tenancyId || !hostelId) {
    return (
      <ReportScaffold
        title="Resident Profile Report"
        loading={false}
        downloadDisabled
        onDownload={() => undefined}
      >
        <Text style={previewStyles.emptyText}>
          Missing resident information. Open this report from the residents list.
        </Text>
      </ReportScaffold>
    );
  }

  return (
    <ReportScaffold
      title="Resident Profile Report"
      subtitle={reportData?.name}
      loading={loading}
      downloading={downloading}
      downloadDisabled={!reportData}
      onDownload={handleDownload}
    >
      {!loading && !reportData ? (
        <Text style={previewStyles.emptyText}>Resident not found.</Text>
      ) : null}

      {reportData ? (
        <>
          <View style={previewStyles.heroCard}>
            <ProfileAvatar
              name={reportData.name}
              phone={reportData.phone}
              imageUri={reportData.profileImage}
              size={vs(88)}
            />
            <Text style={previewStyles.heroName}>{reportData.name}</Text>
            <Text style={previewStyles.heroMeta}>
              {reportData.hostelName} · Room {reportData.roomNumber}
            </Text>
            <Text style={previewStyles.heroMeta}>
              Generated: {formatReportDate(reportData.generatedAt)}
            </Text>
          </View>

          <View style={previewStyles.grid}>
            <DetailItem label="Phone" value={reportData.phone} styles={previewStyles} />
            <DetailItem
              label="CNIC"
              value={
                reportData.cnic ? formatCnic(reportData.cnic) : "Not provided"
              }
              styles={previewStyles}
            />
            <DetailItem
              label="Emergency"
              value={reportData.emergencyNumber ?? "Not provided"}
              styles={previewStyles}
            />
            <DetailItem
              label="Father Name"
              value={reportData.fatherName ?? "Not provided"}
              styles={previewStyles}
            />
            <DetailItem
              label="Father Phone"
              value={reportData.fatherPhone ?? "Not provided"}
              styles={previewStyles}
            />
            <DetailItem
              label="Check-in"
              value={formatShortDate(reportData.checkInDate)}
              styles={previewStyles}
            />
            <DetailItem
              label="Hostel Address"
              value={
                reportData.hostelAddress
                  ? `${reportData.hostelAddress}${reportData.hostelCity ? `, ${reportData.hostelCity}` : ""}`
                  : "—"
              }
              styles={previewStyles}
            />
            <DetailItem
              label="Hostel Contact"
              value={reportData.hostelContactPhone ?? "—"}
              styles={previewStyles}
            />
          </View>

          {reportData.cnicFront || reportData.cnicBack ? (
            <View style={previewStyles.idSection}>
              <Text style={previewStyles.idTitle}>CNIC Documents</Text>
              <View style={previewStyles.idGrid}>
                {reportData.cnicFront ? (
                  <View style={previewStyles.idCard}>
                    <Text style={previewStyles.idLabel}>Front</Text>
                    <Image
                      source={{ uri: reportData.cnicFront }}
                      style={previewStyles.idImage}
                      contentFit="contain"
                    />
                  </View>
                ) : null}
                {reportData.cnicBack ? (
                  <View style={previewStyles.idCard}>
                    <Text style={previewStyles.idLabel}>Back</Text>
                    <Image
                      source={{ uri: reportData.cnicBack }}
                      style={previewStyles.idImage}
                      contentFit="contain"
                    />
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
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
    emptyText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.regular,
      color: colors.gray200,
      textAlign: "center",
      paddingVertical: vs(24),
    },
    heroCard: {
      backgroundColor: colors.white,
      borderRadius: vs(16),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(20),
      alignItems: "center",
      marginBottom: vs(14),
    },
    heroName: {
      fontSize: FONT_SIZES.xl,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: vs(12),
      marginBottom: vs(4),
    },
    heroMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.medium,
      color: colors.gray200,
      textAlign: "center",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: vs(8),
      marginBottom: vs(14),
    },
    detailItem: {
      width: "48%",
      backgroundColor: colors.white,
      borderRadius: vs(12),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(12),
    },
    detailLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      textTransform: "uppercase",
      marginBottom: vs(4),
    },
    detailValue: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    idSection: {
      backgroundColor: colors.white,
      borderRadius: vs(14),
      borderWidth: 1,
      borderColor: colors.white100,
      padding: vs(14),
    },
    idTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: vs(10),
    },
    idGrid: {
      gap: vs(10),
    },
    idCard: {
      marginBottom: vs(8),
    },
    idLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: fonts.semiBold,
      color: colors.gray200,
      marginBottom: vs(6),
    },
    idImage: {
      width: "100%",
      height: vs(160),
      borderRadius: vs(10),
      backgroundColor: colors.white100,
    },
  });
}
