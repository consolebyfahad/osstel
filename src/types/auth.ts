import type { UserRole } from "./role";
import type { SubscriptionPlanId, TrialInfo } from "./subscription";
import type { SubscriptionUsage } from "@/utils/subscription";
import { unwrapApiResponse } from "@/utils/api";

export interface UserHostel {
  id: string;
  name: string;
  address: string;
  city: string;
  contactPhone: string;
}

export interface UserRoom {
  id: string;
  roomNumber: string;
  rent: number;
}

export type GoogleAuthBody = {
  idToken: string;
};

export type AuthProvider = "local" | "google";

export interface AuthUser {
  id?: string;
  userId?: string;
  phone?: string;
  name?: string;
  cnic?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  profileImage?: string | null;
  role: UserRole;
  accessToken: string | null;
  refreshToken: string | null;
  isVerified: boolean;
  authProvider?: AuthProvider;
  googleId?: string;
  subscriptionPlan?: SubscriptionPlanId;
  baseSubscriptionPlan?: SubscriptionPlanId;
  trial?: TrialInfo | null;
  subscriptionUsage?: SubscriptionUsage;
  hostels?: UserHostel[];
  hostel?: UserHostel | null;
  room?: UserRoom | null;
}

export interface MeResponse {
  user: {
    id: string;
    userId?: string;
    name: string;
    phone?: string | null;
    cnic?: string;
    email?: string;
    address?: string;
    dateOfBirth?: string;
    profileImage?: string | null;
    role: UserRole;
    authProvider?: AuthProvider;
    googleId?: string | null;
    subscriptionPlan: SubscriptionPlanId;
    baseSubscriptionPlan?: SubscriptionPlanId;
    trial?: TrialInfo | null;
    subscriptionUsage?: SubscriptionUsage;
    hostels: UserHostel[];
    hostel: UserHostel | null;
    room: UserRoom | null;
  };
}

export type UpdateProfileBody = {
  name?: string;
  cnic?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  profileImage?: string | null;
};

export type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  hasSeenWelcome: boolean;
}

export type ResidentLoginBody = {
  userId: string;
  password: string;
};

export type ManagerLoginBody = {
  phone: string;
  password: string;
  role: UserRole;
};

export type LoginBody = ResidentLoginBody | ManagerLoginBody;

export function isLegacyGooglePhone(phone?: string | null) {
  return typeof phone === "string" && phone.startsWith("google_");
}

export function isGoogleAuthUser(
  user:
    | {
        authProvider?: AuthProvider;
        phone?: string | null;
      }
    | null
    | undefined,
) {
  if (!user) return false;
  if (user.authProvider === "google") return true;
  return isLegacyGooglePhone(user.phone);
}

export function normalizeAuthPhone(
  phone: unknown,
  authProvider?: AuthProvider,
): string {
  const value = String(phone ?? "");
  if (authProvider === "google" || isLegacyGooglePhone(value)) return "";
  return value;
}

export function parseAuthTokens(response: unknown): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const record = unwrapApiResponse(response) as Record<string, unknown>;
  const accessToken =
    String(record.accessToken ?? record.token ?? "") || null;
  const refreshToken = String(record.refreshToken ?? "") || null;
  return { accessToken, refreshToken };
}

export function toAuthUser(response: unknown): AuthUser {
  const payload = unwrapApiResponse(response) as Record<string, unknown>;
  const user =
    payload.user && typeof payload.user === "object"
      ? (payload.user as Record<string, unknown>)
      : payload;
  const tokens = parseAuthTokens(payload);
  const authProvider = user.authProvider as AuthProvider | undefined;

  return {
    id: user.id ? String(user.id) : undefined,
    userId: user.userId ? String(user.userId) : undefined,
    phone: normalizeAuthPhone(user.phone, authProvider),
    name: user.name ? String(user.name) : undefined,
    cnic: user.cnic ? String(user.cnic) : undefined,
    email: user.email ? String(user.email) : undefined,
    address: user.address ? String(user.address) : undefined,
    dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth) : undefined,
    profileImage: user.profileImage ? String(user.profileImage) : undefined,
    role: user.role as UserRole,
    authProvider:
      authProvider ??
      (isLegacyGooglePhone(
        typeof user.phone === "string" ? user.phone : undefined,
      )
        ? "google"
        : "local"),
    googleId: user.googleId ? String(user.googleId) : undefined,
    accessToken:
      tokens.accessToken ??
      (String(user.accessToken ?? "") || null),
    refreshToken:
      tokens.refreshToken ??
      (String(user.refreshToken ?? "") || null),
    isVerified: Boolean(user.isVerified ?? true),
    subscriptionPlan: isSubscriptionPlan(user.subscriptionPlan)
      ? user.subscriptionPlan
      : undefined,
    baseSubscriptionPlan: isSubscriptionPlan(user.baseSubscriptionPlan)
      ? user.baseSubscriptionPlan
      : undefined,
    trial:
      user.trial && typeof user.trial === "object"
        ? (user.trial as TrialInfo)
        : null,
    hostels: Array.isArray(user.hostels)
      ? (user.hostels as UserHostel[])
      : undefined,
    hostel: (user.hostel as UserHostel | null) ?? undefined,
    room: (user.room as UserRoom | null) ?? undefined,
  };
}

export function meToAuthProfile(me: MeResponse["user"]): Partial<AuthUser> {
  return {
    id: me.id,
    userId: me.userId,
    name: me.name,
    phone: normalizeAuthPhone(me.phone, me.authProvider),
    cnic: me.cnic,
    email: me.email,
    address: me.address,
    dateOfBirth: me.dateOfBirth,
    profileImage: me.profileImage,
    role: me.role,
    authProvider: me.authProvider ?? (isLegacyGooglePhone(me.phone) ? "google" : "local"),
    googleId: me.googleId ?? undefined,
    subscriptionPlan: me.subscriptionPlan,
    baseSubscriptionPlan: me.baseSubscriptionPlan,
    trial: me.trial ?? null,
    subscriptionUsage: me.subscriptionUsage,
    hostels: me.hostels,
    hostel: me.hostel,
    room: me.room,
  };
}

export function formatDateOfBirth(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function toIsoDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSubscriptionPlan(value: unknown): value is SubscriptionPlanId {
  return value === "free" || value === "standard" || value === "premium";
}
