import type { Hostel } from "@/types/hostel";
import type {
  RentCollectionReportData,
  RentReportHostelSection,
  ResidentReportRow,
  ResidentsListReportData,
  ResidentProfileReportData,
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
    totalExpenses?: number;
    expenses?: RentCollectionReportData["expenses"];
  },
): RentCollectionReportData {
  const sections: RentReportHostelSection[] = responses.map((response) => ({
    hostelId: response.hostel.id,
    hostelName: response.hostel.name,
    summary: response.summary,
    records: response.records,
  }));

  const totals = mergeRentSummaries(sections.map((section) => section.summary));
  const totalExpenses = params.totalExpenses ?? 0;

  return {
    month: params.month,
    year: params.year,
    scopeLabel: params.scopeLabel,
    generatedAt: new Date().toISOString(),
    generatedBy: params.generatedBy,
    sections,
    totals,
    financials: {
      totalExpenses,
      netRemaining: totals.collected - totalExpenses,
    },
    expenses: params.expenses ?? [],
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

export function buildResidentProfileReportData(
  resident: Resident,
  hostel: Hostel | undefined,
  params: { generatedBy: string },
): ResidentProfileReportData {
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
