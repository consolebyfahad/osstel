export type HostelConnectionStatus = "not_connected" | "pending" | "active";

export interface PendingJoinRequest {
  id: string;
  hostel: {
    id: string;
    name: string;
    hostelCode: string;
  };
}

export interface JoinHostelBody {
  hostelCode: string;
}

export interface JoinHostelResponse {
  joinRequest: {
    id: string;
    status: string;
    hostel: {
      id: string;
      name: string;
      hostelCode: string;
    };
  };
}

export interface JoinRequestItem {
  id: string;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  resident: {
    id: string;
    name: string;
    phone: string;
  } | null;
  hostel: {
    id: string;
    name: string;
    hostelCode: string;
  } | null;
  tenancy: {
    id: string;
    roomNumber: string | null;
  } | null;
}

export interface JoinRequestsResponse {
  requests: JoinRequestItem[];
}

export interface LeaveRequestBody {
  leavingDate: string;
  reason: string;
  notes?: string;
  requestedRefundAmount?: number;
}

export interface LeaveRequestResponse {
  leaveRequest: {
    id: string;
    status: string;
    leavingDate: string;
    securityDepositHeld?: number;
    requestedRefundAmount?: number | null;
    daysUntilLeave: number;
    shortNotice: boolean;
  };
}

export interface LeaveRequestItem {
  id: string;
  status: string;
  leavingDate: string;
  reason: string;
  notes?: string | null;
  securityDepositHeld?: number;
  requestedRefundAmount?: number | null;
  createdAt: string;
  resident: {
    id: string;
    name: string;
    phone: string;
  } | null;
  hostel: {
    id: string;
    name: string;
    hostelCode: string;
  } | null;
  tenancy?: {
    id: string;
    roomNumber: string | null;
    securityDeposit?: number;
  } | null;
}

export interface ApproveLeaveRequestBody {
  refundAmount?: number;
}

export interface ApproveLeaveRequestResponse {
  message?: string;
  approvedRefundAmount?: number;
  expenseId?: string | null;
}

export interface LeaveRequestsResponse {
  requests: LeaveRequestItem[];
}
