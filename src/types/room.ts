export interface Room {
  id: string;
  roomNumber: string;
  totalBeds: number;
  monthlyRentPerBed: number;
}

export type NewRoom = Omit<Room, "id">;
