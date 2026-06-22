export type RentStatus = "review" | "paid" | "pending" | "rejected";

export type RentFilter = "all" | RentStatus;

export interface RentResident {
  id: string;
  name: string;
  phone: string;
}

export interface RentRoom {
  id: string;
  roomNumber: string;
}

export interface RentRecord {
  id: string;
  amount: number;
  status: RentStatus;
  dueDate: string;
  isOverdue: boolean;
  resident: RentResident;
  room: RentRoom;
  paymentProof: string | null;
  submittedAt: string | null;
  rejectionReason: string | null;
}

export interface RentSummary {
  expected: number;
  collected: number;
  pending: number;
  review: number;
  overdue: number;
}

export interface RentResponse {
  hostel: {
    id: string;
    name: string;
  };
  month: number;
  year: number;
  summary: RentSummary;
  records: RentRecord[];
}

export type GetRentParams = {
  hostelId: string;
  month: number;
  year: number;
  status: RentFilter;
};

export type GetMyRentParams = {
  month: number;
  year: number;
};

export type GetMyRentHistoryParams = {
  year: number;
};

export interface MyRentResponse {
  record: RentRecord | null;
  hostel: {
    id: string;
    name: string;
  };
  month: number;
  year: number;
}

export interface MyRentHistoryResponse {
  year: number;
  records: RentRecord[];
  summary: {
    totalPaid: number;
    monthsPaid: number;
    monthsPending: number;
  };
}

export type SubmitRentPaymentBody = {
  rentId: string;
  paymentProof: string;
  note?: string;
};

export type SubmitRentPaymentResponse = {
  message?: string;
  record: RentRecord;
};

export type UpdateRentStatusBody = {
  status: RentStatus | "approved";
  rejectionReason?: string;
};

export type UpdateRentStatusParams = {
  rentId: string;
  hostelId: string;
} & UpdateRentStatusBody;

export type UpdateRentStatusResponse = {
  message?: string;
  record: RentRecord;
};

export type SendRentAlertBody = {
  message?: string;
};

export type SendRentAlertResponse = {
  message?: string;
  paymentId: string;
};

export type SendResidentRentAlertParams = {
  tenancyId: string;
  message?: string;
};
