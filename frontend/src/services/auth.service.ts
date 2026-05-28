/**
 * Auth API service — thin wrapper around the backend /auth/* endpoints.
 * All functions throw AxiosError on failure (caught by React Query / callers).
 */
import api from "@/services/api";
import type { AuthTokens, RegisterData, LoginCredentials, User } from "@/types";

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/register", {
      username: data.username,
      email: data.email,
      password: data.password,
      full_name: data.fullName,
    });
    return res.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/login", credentials);
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await api.post<AuthTokens>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>("/auth/me");
    return res.data;
  },
};
