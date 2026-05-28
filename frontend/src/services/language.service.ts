import api from './api'
import type { Language, Lesson, PaginatedResponse } from '@/types'

const languageService = {
  getAll: () =>
    api.get<Language[]>('/languages').then(r => r.data),

  getOne: (code: string) =>
    api.get<Language>(`/languages/${code}`).then(r => r.data),

  getLessons: (params?: {
    language?: string
    difficulty?: string
    page?: number
    page_size?: number
  }) =>
    api.get<PaginatedResponse<Lesson>>('/lessons', { params }).then(r => r.data),

  getLesson: (id: string) =>
    api.get<Lesson>(`/lessons/${id}`).then(r => r.data),
}

export default languageService
