import api from './api'

export interface SystemStats {
  total_users: number
  active_users: number
  total_sessions: number
  total_languages: number
  total_lessons: number
  total_achievements_awarded: number
}

export interface AdminUser {
  id: string
  username: string
  email: string
  full_name: string | null
  role: 'user' | 'admin' | 'moderator'
  is_active: boolean
  is_verified: boolean
  total_xp: number
  level: number
  current_streak: number
  created_at: string
}

export interface PaginatedAdminUsers {
  items: AdminUser[]
  total: number
  page: number
  page_size: number
  pages: number
}

const adminService = {
  getStats: () =>
    api.get<SystemStats>('/admin/stats').then(r => r.data),

  getUsers: (params?: { search?: string; role?: string; page?: number; page_size?: number }) =>
    api.get<PaginatedAdminUsers>('/admin/users', { params }).then(r => r.data),

  updateRole: (userId: string, role: string) =>
    api.patch<AdminUser>(`/admin/users/${userId}/role`, { role }).then(r => r.data),

  updateActive: (userId: string, is_active: boolean) =>
    api.patch<AdminUser>(`/admin/users/${userId}/active`, { is_active }).then(r => r.data),
}

export default adminService
