import type { NewRoom, Room } from "@/types/room";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@vaas/rooms";

export async function getRooms(): Promise<Room[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Room[];
  } catch {
    return [];
  }
}

export async function addRoom(room: NewRoom): Promise<Room> {
  const rooms = await getRooms();
  const newRoom: Room = {
    ...room,
    id: `${Date.now()}`,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...rooms, newRoom]));
  return newRoom;
}
