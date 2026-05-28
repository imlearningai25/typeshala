/**
 * Auth API service — thin wrapper around the backend /auth/* endpoints.
 * All functions throw AxiosError on failure (caught by React Query / callers).
 *
 * NOTE: The backend returns snake_case JSON; we map to the camelCase types the
 * rest of the frontend expects right here so nothing else has to care.
 */
import api from "@/services/api";
import type { AuthTokens, RegisterData, LoginCredentials, User } from "@/types";

// ── Raw shapes that the backend actually sends ────────────────────────────────

interface RawTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface RawUser {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

interface RawAuthResponse {
  user: RawUser;
  tokens: RawTokens;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapTokens(raw: RawTokens): AuthTokens {
  return {
    accessToken:  raw.access_token,
    refreshToken: raw.refresh_token,
    tokenType:    raw.token_type,
  };
}

export function mapUser(raw: RawUser): User {
  return {
    id:         raw.id,
    username:   raw.username,
    email:      raw.email,
    fullName:   raw.full_name,
    avatarUrl:  raw.avatar_url,
    role:       raw.role as User["role"],
    isActive:   raw.is_active,
    isVerified: raw.is_verified,
    xp:         raw.total_xp,
    level:      raw.level,
    streakDays:    raw.current_streak,
    longestStreak: raw.longest_streak,
    createdAt:     raw.created_at,
    updatedAt:  raw.updated_at,
  };
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await api.post<RawAuthResponse>("/auth/register", {
      username:  data.username,
      email:     data.email,
      password:  data.password,
      full_name: data.fullName,
    });
    return { user: mapUser(res.data.user), tokens: mapTokens(res.data.tokens) };
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await api.post<RawAuthResponse>("/auth/login", credentials);
    return { user: mapUser(res.data.user), tokens: mapTokens(res.data.tokens) };
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await api.post<RawTokens>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return mapTokens(res.data);
  },

  async getMe(): Promise<User> {
    const res = await api.get<RawUser>("/auth/me");
    return mapUser(res.data);
  },
};
