import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

export function countResidentsInRoom(room: Room, residents: Resident[]) {
  return residents.filter(
    (resident) =>
      resident.roomId === room._id ||
      (resident.hostelId === room.hostel &&
        resident.roomNumber === room.roomNumber),
  ).length;
}

export function getVacantBeds(room: Room, residents: Resident[]) {
  const occupied = countResidentsInRoom(room, residents);
  return Math.max(room.capacity - occupied, 0);
}

export function roomHasVacancy(room: Room, residents: Resident[]) {
  if (room.status === "maintenance") return false;
  return getVacantBeds(room, residents) > 0;
}

export function filterVacantRooms(rooms: Room[], residents: Resident[]) {
  return rooms.filter((room) => roomHasVacancy(room, residents));
}

export function buildVacancyMap(rooms: Room[], residents: Resident[]) {
  return Object.fromEntries(
    rooms.map((room) => [room._id, getVacantBeds(room, residents)]),
  );
}
