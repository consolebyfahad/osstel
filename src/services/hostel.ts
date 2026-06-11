import type { HostelDetails } from "@/types/hostel";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@vaas/hostel";

export async function getHostelDetails(): Promise<HostelDetails | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HostelDetails;
  } catch {
    return null;
  }
}

export async function saveHostelDetails(
  details: HostelDetails,
): Promise<HostelDetails> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(details));
  return details;
}
