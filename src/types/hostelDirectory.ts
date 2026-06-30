export interface HostelDirectoryOwner {
  name: string;
  phone?: string;
}

export interface HostelDirectoryItem {
  id: string;
  name: string;
  city: string;
  address: string;
  contactPhone?: string;
  image?: string | null;
  roomsCount: number;
  tenantsCount: number;
  vacantBeds: number;
  vacantRooms: number;
  hasVacancy: boolean;
  owner: (HostelDirectoryOwner & { phone?: string }) | null;
  createdAt: string;
}

export interface HostelDirectoryPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface HostelDirectoryResponse {
  hostels: HostelDirectoryItem[];
  pagination: HostelDirectoryPagination;
}

export type GetDiscoverHostelsParams = {
  search?: string;
  page?: number;
  limit?: number;
};
