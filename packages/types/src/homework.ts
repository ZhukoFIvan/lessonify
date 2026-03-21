// ── Enums ─────────────────────────────────────────────────────────────────────

export type HomeworkStatus = 'ASSIGNED' | 'SUBMITTED' | 'REVIEWED'

// ── Homework ──────────────────────────────────────────────────────────────────

export interface Homework {
  id: string
  lessonId: string
  tutorId: string
  studentId: string
  description: string
  deadline: string | null // ISO 8601
  status: HomeworkStatus
  feedback: string | null
  submissionText: string | null
  fileUrls: string[]
  attachmentUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface HomeworkWithDetails extends Homework {
  lesson: {
    id: string
    subject: string
    startTime: string
  }
  student: {
    id: string
    name: string
    color: string | null
    user: { avatarUrl: string | null } | null
  }
  isOverdue?: boolean
}

// Homework item as seen by a student (includes tutor info)
export interface StudentHomeworkItem extends Omit<HomeworkWithDetails, 'student'> {
  tutor: {
    id: string
    user: { name: string; avatarUrl: string | null }
  }
  isOverdue: boolean
}

// ── Create / Update ───────────────────────────────────────────────────────────

export interface CreateHomeworkRequest {
  description: string
  deadline?: string
  attachmentUrls?: string[]
}

export interface UpdateHomeworkRequest {
  description?: string
  deadline?: string
  status?: HomeworkStatus
  feedback?: string
}

export interface SubmitHomeworkRequest {
  submissionText?: string
  fileUrls?: string[]
}
