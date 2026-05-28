import api from './api'
import type { WpmHistoryResponse, ActivityHeatmapResponse, AchievementResponse, LeaderboardResponse } from '@/types/analytics'

const analyticsService = {
  getWpmHistory: (days = 30) =>
    api.get<WpmHistoryResponse>('/analytics/me/wpm-history', { params: { days } }).then(r => r.data),

  getActivity: (days = 90) =>
    api.get<ActivityHeatmapResponse>('/analytics/me/activity', { params: { days } }).then(r => r.data),

  getAchievements: () =>
    api.get<AchievementResponse[]>('/analytics/me/achievements').then(r => r.data),

  getLeaderboard: (params?: { language?: string; period?: string; limit?: number }) =>
    api.get<LeaderboardResponse>('/leaderboard', { params }).then(r => r.data),
}

export default analyticsService
