/**
 * User API service — /users/* endpoints.
 */
import api from "@/services/api";
import type { User, PaginatedResponse } from "@/types";

interface UpdateProfileData {
  fullName?: string;
  avatarUrl?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  async getMe(): Promise<User> {
    const res = await api.get<User>("/users/me");
    return res.data;
  },

  async getByUsername(username: string): Promise<User> {
    const res = await api.get<User>(`/users/${username}`);
    return res.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const res = await api.patch<User>("/users/me", {
      full_name: data.fullName,
      avatar_url: data.avatarUrl,
    });
    return res.data;
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.post("/users/me/password", {
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
  },

  async listUsers(page = 1, pageSize = 20, search?: string): Promise<PaginatedResponse<User>> {
    const res = await api.get<PaginatedResponse<User>>("/users", {
      params: { page, page_size: pageSize, search },
    });
    return res.data;
  },
};
