// ── Payment summary ───────────────────────────────────────────────────────────

export interface PaymentSummary {
  month: string // YYYY-MM
  totalEarned: number
  totalPending: number
  lessonsCount: number
  paidLessonsCount: number
}

export interface DebtorStudent {
  studentId: string
  studentName: string
  avatarUrl: string | null
  debtAmount: number
  unpaidLessonsCount: number
  lastLessonDate: string
}

export interface MonthlyIncome {
  month: string // YYYY-MM
  earned: number
  pending: number
}
