import api from './api'
import type { TypingSession, UserStats, PaginatedResponse } from '@/types'

export interface SubmitSessionPayload {
  lesson_id: string
  duration_seconds: number
  characters_typed: number
  errors: number
  raw_keystrokes?: Array<{
    timestamp_ms: number
    expected: string
    actual: string
    correct: boolean
  }>
}

const sessionService = {
  submit: (payload: SubmitSessionPayload) =>
    api.post<TypingSession>('/sessions', payload).then(r => r.data),

  getMySessions: (params?: { lesson_id?: string; page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<TypingSession>>('/sessions/me', { params }).then(r => r.data),

  getMyStats: () =>
    api.get<UserStats>('/sessions/me/stats').then(r => r.data),
}

export default sessionService
