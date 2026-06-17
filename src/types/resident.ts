export interface Resident {
  id: string;
  tenancyId: string;
  name: string;
  phone: string;
  userId?: string;
  cnic?: string;
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
  hostelId: string;
  checkInDate: string;
  createdAt: string;
  status: string;
}

export interface CreateResidentBody {
  hostelId: string;
  name: string;
  phone: string;
  cnic?: string;
  roomNumber: string;
  monthlyRent?: number;
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
  roomNumber: string;
  monthlyRent?: number;
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
  resident: Resident;
  loginCredentials?: ResidentLoginCredentials;
}
