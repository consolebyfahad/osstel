export type UserRole = "tenant" | "business_owner";

export const USER_ROLES: Record<
  UserRole,
  { label: string; description: string }
> = {
  tenant: {
    label: "Tenant",
    description: "Access your room, payments, and hostel services.",
  },
  business_owner: {
    label: "Business Owner",
    description: "Manage properties, tenants, and daily operations.",
  },
};

export function isUserRole(value: string | undefined): value is UserRole {
  return value === "tenant" || value === "business_owner";
}
