// ── Enums ─────────────────────────────────────────────────────────────────────

export type LessonStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE'

// ── Lesson ────────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string
  tutorId: string
  studentId: string
  subject: string
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  durationMinutes: number
  status: LessonStatus
  paymentStatus: PaymentStatus
  price: number
  notes: string | null
  googleEventId: string | null
  createdAt: string
  updatedAt: string
}

export interface LessonWithStudent extends Lesson {
  student: {
    id: string
    name: string
    color: string | null
    user: { avatarUrl: string | null } | null
  }
}

export interface LessonWithTutor extends Lesson {
  student: {
    id: string
    name: string
    color: string | null
    user: { avatarUrl: string | null } | null
  }
  tutor: {
    id: string
    user: { name: string; avatarUrl: string | null }
  }
}

// ── Create / Update ───────────────────────────────────────────────────────────

export interface CreateLessonRequest {
  studentId: string
  subject: string
  startTime: string
  durationMinutes: number
  price: number
  notes?: string
}

export interface UpdateLessonRequest {
  subject?: string
  startTime?: string
  durationMinutes?: number
  status?: LessonStatus
  paymentStatus?: PaymentStatus
  price?: number
  notes?: string
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface LessonFilters {
  date?: string // YYYY-MM-DD
  studentId?: string
  status?: LessonStatus
  paymentStatus?: PaymentStatus
  from?: string
  to?: string
}
