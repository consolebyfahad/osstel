export type SupportCategory =
  | "general"
  | "account"
  | "billing"
  | "technical"
  | "other";

export type SupportStatus = "open" | "in_progress" | "resolved";

export interface SupportRequest {
  id: string;
  subject: string;
  message: string;
  category?: SupportCategory;
  status: SupportStatus;
  createdAt: string;
  updatedAt?: string | null;
  adminReply?: string | null;
  repliedAt?: string | null;
}

export interface SupportRequestsResponse {
  requests: SupportRequest[];
}

export interface SubmitSupportBody {
  subject: string;
  message: string;
  category?: SupportCategory;
}

export interface SubmitSupportResponse {
  message?: string;
  request: SupportRequest;
}

export const SUPPORT_CATEGORIES: {
  id: SupportCategory;
  label: string;
}[] = [
  { id: "general", label: "General" },
  { id: "account", label: "Account" },
  { id: "billing", label: "Billing & Plans" },
  { id: "technical", label: "Technical Issue" },
  { id: "other", label: "Other" },
];

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};
