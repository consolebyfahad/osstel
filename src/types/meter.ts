export interface RoomMeter {
  id: string;
  roomId: string;
  hostelId: string;
  name: string;
  unitLabel: string;
  ratePerUnit: number;
  lastReading: number;
  isActive: boolean;
  createdAt?: string;
  reading?: MeterReading | null;
}

export interface MeterReading {
  id: string;
  meterId: string;
  meterName?: string | null;
  unitLabel: string;
  month: number;
  year: number;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  totalAmount: number;
  recordedAt?: string;
}

export interface RoomMetersResponse {
  meters: RoomMeter[];
}

export interface CreateRoomMeterBody {
  name: string;
  unitLabel?: string;
  ratePerUnit: number;
  lastReading?: number;
}

export interface UpdateRoomMeterBody {
  name?: string;
  unitLabel?: string;
  ratePerUnit?: number;
  lastReading?: number;
  isActive?: boolean;
}

export interface RecordMeterReadingsBody {
  month: number;
  year: number;
  readings: { meterId: string; currentReading: number }[];
}

export interface RoomMeterReadingsResponse {
  month: number;
  year: number;
  residentCount: number;
  meters: RoomMeter[];
  readings: MeterReading[];
}

export interface FinalizeRoomBillsBody {
  month: number;
  year: number;
  extraChargesByResident?: Record<
    string,
    { label: string; amount: number }[]
  >;
}

export interface FinalizeRoomBillsResponse {
  finalized: {
    paymentId: string;
    residentId: string;
    residentName: string;
    amount: number;
  }[];
  skipped: { residentId: string; reason: string }[];
  readings: MeterReading[];
}

export interface RentBillPreviewResponse {
  paymentId: string;
  month: number;
  year: number;
  status: string;
  baseAmount: number;
  meterCharges: RentBillCharge[];
  currentCharges: RentBillCharge[];
  billFinalizedAt: string | null;
  residentCount: number;
  readings: MeterReading[];
}

export interface RentBillCharge {
  type: "meter" | "extra";
  label: string;
  units?: number | null;
  rate?: number | null;
  amount: number;
  meterReadingId?: string | null;
}

export interface FinalizeRentBillBody {
  extraCharges?: { label: string; amount: number }[];
}
