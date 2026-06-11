export type RentStatus = "review" | "paid" | "pending";

export type RentFilter = "all" | RentStatus;

export interface RentRecord {
  id: string;
  tenantName: string;
  roomNumber: string;
  amount: number;
  status: RentStatus;
  month: string;
}
