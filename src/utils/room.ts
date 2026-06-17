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

/** Effective monthly rent for one resident (custom or room default). */
export function getResidentMonthlyRent(
  resident: Pick<Resident, "monthlyRent" | "roomRent">,
  roomDefaultRent?: number,
): number {
  if (resident.monthlyRent != null && resident.monthlyRent >= 0) {
    return resident.monthlyRent;
  }
  if (resident.roomRent != null && resident.roomRent >= 0) {
    return resident.roomRent;
  }
  return roomDefaultRent ?? 0;
}

/** Sum of all active residents' agreed rents in a room. */
export function getRoomTotalMonthlyRent(room: Room, residents: Resident[]) {
  const roomResidents = residents.filter(
    (resident) =>
      resident.roomId === room._id ||
      (resident.hostelId === room.hostel &&
        resident.roomNumber === room.roomNumber),
  );

  const existingTotal = roomResidents.reduce(
    (sum, resident) => sum + getResidentMonthlyRent(resident, room.rent),
    0,
  );

  return existingTotal;
}

/** Project room total after adding a resident at the given rent. */
export function getRoomTotalWithNewRent(
  room: Room,
  residents: Resident[],
  newResidentRent: number,
) {
  return getRoomTotalMonthlyRent(room, residents) + newResidentRent;
}
