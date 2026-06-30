export interface Resident {
  id: string;
  tenancyId: string;
  name: string;
  phone: string;
  userId?: string;
  cnic?: string;
  email?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  profileImage?: string | null;
  cnicFront?: string | null;
  cnicBack?: string | null;
  emergencyNumber?: string;
  fatherName?: string;
  fatherPhone?: string;
  roomNumber: string;
  roomId: string;
  roomRent?: number | null;
  monthlyRent?: number | null;
  securityDeposit?: number | null;
  hostelId: string;
  checkInDate: string;
  createdAt: string;
  status: string;
}

export interface ResidentLookup {
  userId: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  cnic?: string | null;
  profileImage?: string | null;
  cnicFront?: string | null;
  cnicBack?: string | null;
  emergencyNumber?: string | null;
  fatherName?: string | null;
  fatherPhone?: string | null;
  hostelConnectionStatus?: "not_connected" | "pending" | "active";
  canLink: boolean;
  connectedHostelName?: string | null;
}

export interface ResidentLookupResponse {
  resident: ResidentLookup;
}

export interface CreateResidentBody {
  hostelId: string;
  name: string;
  phone: string;
  cnic?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  residentUserId?: string;
  roomNumber: string;
  monthlyRent?: number;
  securityDeposit?: number;
  profileImage?: string;
  cnicFront?: string;
  cnicBack?: string;
  emergencyNumber?: string;
  fatherName?: string;
  fatherPhone?: string;
}

export interface UpdateResidentBody {
  name: string;
  phone: string;
  cnic?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  roomNumber: string;
  monthlyRent?: number;
  securityDeposit?: number;
  profileImage?: string;
  cnicFront?: string;
  cnicBack?: string;
  emergencyNumber?: string;
  fatherName?: string;
  fatherPhone?: string;
}

export type GetResidentsParams = {
  hostelId: string;
  roomNumber?: string;
  roomId?: string;
};

export interface ResidentsResponse {
  residents: Resident[];
}

export interface ResidentLoginCredentials {
  userId: string;
  password: string;
  shareMessage: string;
}

export interface CreateResidentResponse {
  message: string;
  linked?: boolean;
  resident: Resident;
  loginCredentials?: ResidentLoginCredentials;
}
