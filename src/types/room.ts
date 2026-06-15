export type RoomStatus =
  | "available"
  | "occupied"
  | "full"
  | "maintenance"
  | string;

export const ROOM_STATUSES: RoomStatus[] = [
  "available",
  "occupied",
  "full",
  "maintenance",
];

export interface UpdateRoomBody {
  roomNumber: string;
  capacity: number;
  rent: number;
  status: RoomStatus;
}

export interface Room {
  _id: string;
  hostel: string;
  roomNumber: string;
  capacity: number;
  rent: number;
  status: RoomStatus;
}

export interface CreateRoomBody {
  roomNumber: string;
  capacity: number;
  rent: number;
}

export interface RoomsResponse {
  rooms: Room[];
}

export interface CreateRoomResponse {
  message: string;
  room: Room;
}
