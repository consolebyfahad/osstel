export type UserRole = "manager" | "resident";

export const USER_ROLES: Record<
  UserRole,
  { label: string; description: string }
> = {
  manager: {
    label: "Manager",
    description: "Manage properties, residents, and daily operations.",
  },
  resident: {
    label: "Resident",
    description: "Access your room, payments, and hostel services.",
  },
};

export function isUserRole(value: string | undefined): value is UserRole {
  return value === "manager" || value === "resident";
}
