import type { Hostel } from "@/types/hostel";
import type {
  RentCollectionReportData,
  RentReportHostelSection,
  ResidentReportRow,
  ResidentsListReportData,
  TenantReportData,
} from "@/types/report";
import type { RentResponse } from "@/types/rent";
import type { Resident } from "@/types/resident";

export function emptyRentSummary() {
  return {
    expected: 0,
    collected: 0,
    pending: 0,
    review: 0,
    overdue: 0,
  };
}

export function mergeRentSummaries(
  summaries: RentCollectionReportData["totals"][],
) {
  return summaries.reduce(
    (acc, summary) => ({
      expected: acc.expected + summary.expected,
      collected: acc.collected + summary.collected,
      pending: acc.pending + summary.pending,
      review: acc.review + summary.review,
      overdue: acc.overdue + summary.overdue,
    }),
    emptyRentSummary(),
  );
}

export function buildRentReportData(
  responses: RentResponse[],
  params: {
    month: number;
    year: number;
    scopeLabel: string;
    generatedBy: string;
  },
): RentCollectionReportData {
  const sections: RentReportHostelSection[] = responses.map((response) => ({
    hostelId: response.hostel.id,
    hostelName: response.hostel.name,
    summary: response.summary,
    records: response.records,
  }));

  return {
    month: params.month,
    year: params.year,
    scopeLabel: params.scopeLabel,
    generatedAt: new Date().toISOString(),
    generatedBy: params.generatedBy,
    sections,
    totals: mergeRentSummaries(sections.map((section) => section.summary)),
  };
}

export function buildResidentsReportData(
  residents: ResidentReportRow[],
  params: {
    scopeLabel: string;
    generatedBy: string;
  },
): ResidentsListReportData {
  return {
    scopeLabel: params.scopeLabel,
    generatedAt: new Date().toISOString(),
    generatedBy: params.generatedBy,
    residents: [...residents].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function buildTenantReportData(
  resident: Resident,
  hostel: Hostel | undefined,
  params: { generatedBy: string },
): TenantReportData {
  return {
    ...resident,
    hostelName: hostel?.name ?? "Hostel",
    hostelAddress: hostel?.address,
    hostelCity: hostel?.city,
    hostelContactPhone: hostel?.contactPhone,
    generatedAt: new Date().toISOString(),
    generatedBy: params.generatedBy,
  };
}

export function mapResidentsWithHostel(
  residents: Resident[],
  hostelName: string,
): ResidentReportRow[] {
  return residents.map((resident) => ({
    ...resident,
    hostelName,
  }));
}
