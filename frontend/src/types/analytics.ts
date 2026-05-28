export interface WpmDataPoint {
  date: string
  avg_wpm: number
  best_wpm: number
  sessions: number
}

export interface WpmHistoryResponse {
  data: WpmDataPoint[]
  period_days: number
}

export interface ActivityDay {
  date: string
  sessions: number
  total_minutes: number
}

export interface ActivityHeatmapResponse {
  data: ActivityDay[]
  period_days: number
}

export interface AchievementResponse {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  xp_reward: number
  earned: boolean
  earned_at: string | null
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  level: number
  avg_wpm: number
  best_wpm: number
  avg_accuracy: number
  total_sessions: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  total: number
  language_code: string | null
  period: string
}
