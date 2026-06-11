export interface Tenant {
  id: string;
  name: string;
  phone: string;
  roomId: string;
  roomNumber: string;
  cnic?: string;
  moveInDate?: string;
}

export type NewTenant = Omit<Tenant, "id">;
