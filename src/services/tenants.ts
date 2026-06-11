import type { NewTenant, Tenant } from "@/types/tenant";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@vaas/tenants";

export async function getTenants(): Promise<Tenant[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Tenant[];
  } catch {
    return [];
  }
}

export async function addTenant(tenant: NewTenant): Promise<Tenant> {
  const tenants = await getTenants();
  const newTenant: Tenant = {
    ...tenant,
    id: `${Date.now()}`,
  };
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...tenants, newTenant]),
  );
  return newTenant;
}
