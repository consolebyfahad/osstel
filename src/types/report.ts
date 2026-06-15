import type { RentRecord, RentSummary } from "@/types/rent";
import type { Resident } from "@/types/resident";

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

export type TenantReportData = ResidentReportRow & {
  hostelAddress?: string;
  hostelCity?: string;
  hostelContactPhone?: string;
  generatedAt: string;
  generatedBy: string;
};

export const REPORT_TYPES = [
  {
    id: "rent",
    title: "Rent Collection",
    description: "Monthly rent summary with tenant names and payment status.",
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
    id: "tenant",
    title: "Tenant Profile",
    description: "Detailed paper report for a single tenant with photo and CNIC.",
    icon: "person-outline" as const,
    route: "/residents",
  },
] as const;
