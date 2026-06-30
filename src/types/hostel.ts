export interface HostelManager {
  name: string;
  phone: string;
  role: string;
}

export interface Hostel {
  _id: string;
  name: string;
  address: string;
  city: string;
  contactPhone: string;
  hostelCode?: string;
  image?: string | null;
  manager: string | HostelManager;
}

export interface CreateHostelBody {
  name: string;
  address: string;
  city: string;
  contactPhone: string;
  image?: string | null;
}

export interface HostelsResponse {
  hostels: Hostel[];
}

export interface HostelResponse {
  hostel: Hostel;
}

export interface CreateHostelResponse {
  message: string;
  hostel: Hostel;
}

export type HostelForm = CreateHostelBody;

export type UpdateHostelBody = CreateHostelBody;
