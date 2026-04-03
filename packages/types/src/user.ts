// ── Enums ─────────────────────────────────────────────────────────────────────

export type UserRole = 'TUTOR' | 'STUDENT' | 'ADMIN'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

// ── Base user ─────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  gender: Gender | null
  role: UserRole
  isBlocked: boolean
  plan: 'FREE' | 'PRO'
  planExpiresAt: string | null
  trialUsed: boolean
  referralCode: string | null
  createdAt: string
  updatedAt: string
}

// ── Tutor ─────────────────────────────────────────────────────────────────────

export interface Tutor {
  id: string
  userId: string
  subjects: string[]
  hourlyRate: number | null
  timezone: string
  reminderBeforeLesson: number // minutes
  reminderAfterLesson: number // minutes
}

export interface TutorWithUser extends Tutor {
  user: User
}

// ── Student ───────────────────────────────────────────────────────────────────

export interface Student {
  id: string
  userId: string | null
  tutorId: string
  name: string
  email: string | null
  phone: string | null
  subject: string | null
  hourlyRate: number | null
  color: string | null
  notes: string | null
  inviteToken: string | null
  telegramConnected: boolean
  createdAt: string
}

export interface StudentWithUser extends Student {
  user: User | null
}

// Enriched list item returned by GET /students
export interface StudentListItem extends Student {
  user: { id: string; avatarUrl: string | null; gender: string | null } | null
  telegramUsername: string | null
  debtAmount: number
  lessonsCount: number
}

// Detailed view returned by GET /students/:id
export interface StudentDetail extends StudentListItem {
  lessons: Array<{
    id: string
    subject: string
    startTime: string
    durationMinutes: number
    status: string
    paymentStatus: string
    price: number
  }>
}

export interface CreateStudentRequest {
  name: string
  email?: string
  phone?: string
  subject?: string
  hourlyRate?: number
  color?: string
  notes?: string
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  sub: string // userId
  role: UserRole
  tutorId?: string
  studentId?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role: UserRole
}

export interface AuthResponse {
  user: User
  accessToken: string
}
