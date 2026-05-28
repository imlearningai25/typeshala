// ── Domain types ───────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin" | "moderator";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  xp: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type TypingMode = "free" | "quote" | "code" | "numbers" | "punctuation";

export interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  description: string | null;
  flag_emoji: string | null;
  keyboard_layout: string;
  is_active: boolean;
  direction: "ltr" | "rtl";
  lesson_count: number;
}

export interface Lesson {
  id: string;
  language_id: string;
  title: string;
  description: string | null;
  content: string;
  difficulty: DifficultyLevel;
  order_index: number;
  time_limit_seconds: number | null;
  is_active: boolean;
  language_code: string | null;
  language_name: string | null;
}

export interface TypingSession {
  id: string;
  user_id: string;
  lesson_id: string | null;
  wpm: number;
  accuracy: number;
  consistency: number;
  characters_per_minute: number;
  duration_seconds: number;
  characters_typed: number;
  errors: number;
  xp_earned: number;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface UserStats {
  total_sessions: number;
  total_time_seconds: number;
  average_wpm: number;
  best_wpm: number;
  average_accuracy: number;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  level: number;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  isActive: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  wpm: number;
  accuracy: number;
  sessions: number;
}

// ── API response shapes ────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
  error: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}
