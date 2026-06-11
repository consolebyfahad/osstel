import type { UserRole } from "./role";

export interface AuthUser {
  phone: string;
  name?: string;
  role: UserRole;
  accessToken: string | null;
  isVerified: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}
