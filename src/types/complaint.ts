export type ComplaintStatus = "open" | "in_progress" | "resolved";

export type ComplaintFilter = "all" | ComplaintStatus;

export interface ComplaintResident {
  id: string;
  name: string;
  phone?: string;
}

export interface ComplaintRoom {
  id?: string;
  roomNumber: string;
}

export interface ComplaintHostel {
  id: string;
  name: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  category?: string;
  hostel: ComplaintHostel;
  resident?: ComplaintResident | null;
  room?: ComplaintRoom | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ComplaintsSummary {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
}

export interface ComplaintsResponse {
  complaints: Complaint[];
  summary?: ComplaintsSummary;
}

export type GetComplaintsParams = {
  hostelId: string;
  status: ComplaintFilter;
};

export type GetMyComplaintsParams = {
  status?: ComplaintFilter;
};

export type CreateComplaintBody = {
  title: string;
  description: string;
};

export interface CreateComplaintResponse {
  message?: string;
  complaint: Complaint;
}

export type UpdateComplaintStatusBody = {
  status: ComplaintStatus;
};

export type UpdateComplaintStatusParams = {
  id: string;
  hostelId: string;
} & UpdateComplaintStatusBody;

export interface UpdateComplaintStatusResponse {
  message?: string;
  complaint: Complaint;
}

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  "open",
  "in_progress",
  "resolved",
];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const COMPLAINT_FILTERS: { id: ComplaintFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
];
