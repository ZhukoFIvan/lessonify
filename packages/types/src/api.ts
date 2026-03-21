// ── Generic API response wrappers ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  details?: Record<string, string[]>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ── Push notifications ────────────────────────────────────────────────────────

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  url?: string
}
