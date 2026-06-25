import type { RentRecord, RentSummary } from "@/types/rent";
import type { Resident } from "@/types/resident";

export interface ExpenseReportRow {
  id: string;
  title: string;
  details: string;
  amount: number;
  hostelName: string;
}

export interface ReportFinancials {
  totalExpenses: number;
  netRemaining: number;
}

export type ReportHostelScope = string;

export interface RentReportHostelSection {
  hostelId: string;
  hostelName: string;
  summary: RentSummary;
  records: RentRecord[];
}

export interface RentCollectionReportData {
  month: number;
  year: number;
  scopeLabel: string;
  generatedAt: string;
  generatedBy: string;
  sections: RentReportHostelSection[];
  totals: RentSummary;
  financials: ReportFinancials;
  expenses: ExpenseReportRow[];
}

export type ResidentReportRow = Resident & {
  hostelName: string;
};

export interface ResidentsListReportData {
  scopeLabel: string;
  generatedAt: string;
  generatedBy: string;
  residents: ResidentReportRow[];
}

export type ResidentProfileReportData = ResidentReportRow & {
  hostelAddress?: string;
  hostelCity?: string;
  hostelContactPhone?: string;
  generatedAt: string;
  generatedBy: string;
};

export const REPORT_TYPES = [
  {
    id: "rent",
    title: "Monthly Financial Report",
    description: "Rent collection, expenses, and remaining balance for the month.",
    icon: "cash-outline" as const,
    route: "/reports/rent",
  },
  {
    id: "residents",
    title: "All Residents",
    description: "Complete resident directory for one or all hostels.",
    icon: "people-outline" as const,
    route: "/reports/residents",
  },
  {
    id: "resident-profile",
    title: "Resident Profile",
    description: "Detailed paper report for a single resident with photo and CNIC.",
    icon: "person-outline" as const,
    route: "/residents",
  },
] as const;
