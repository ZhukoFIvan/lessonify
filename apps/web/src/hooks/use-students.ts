'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { StudentListItem, StudentDetail, CreateStudentRequest } from '@tutorflow/types'

// ── Список учеников ───────────────────────────────────────────────────────────

export function useStudents(search?: string) {
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (search) params.set('search', search)
      const { data } = await api.get(`/students?${params}`)
      setStudents(data.data)
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetch() }, [fetch])

  return { students, loading, refetch: fetch }
}

// ── Детальный просмотр ученика ────────────────────────────────────────────────

export function useStudentDetail(studentId: string | null) {
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!studentId) { setStudent(null); return }
    setLoading(true)
    try {
      const { data } = await api.get(`/students/${studentId}`)
      setStudent(data.data)
    } catch {
      setStudent(null)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { fetch() }, [fetch])

  return { student, loading, refetch: fetch }
}

// ── Создать ученика ───────────────────────────────────────────────────────────

export function useCreateStudent() {
  const [loading, setLoading] = useState(false)

  async function createStudent(payload: CreateStudentRequest): Promise<StudentListItem> {
    setLoading(true)
    try {
      const { data } = await api.post('/students', payload)
      return data.data
    } finally {
      setLoading(false)
    }
  }

  return { createStudent, loading }
}

// ── Удалить ученика ───────────────────────────────────────────────────────────

export function useDeleteStudent() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function deleteStudent(studentId: string) {
    setLoadingId(studentId)
    try {
      await api.delete(`/students/${studentId}`)
    } finally {
      setLoadingId(null)
    }
  }

  return { deleteStudent, loadingId }
}

// ── Все преподаватели студента ────────────────────────────────────────────────

export interface MyTutor {
  studentRecordId: string
  subject: string | null
  lessonsCount: number
  tutor: {
    id: string
    subjects: string[]
    hourlyRate: number | null
    user: { name: string; avatarUrl: string | null }
  }
}

export function useMyTutors() {
  const [tutors, setTutors] = useState<MyTutor[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/students/my-tutors')
      setTutors(data.data)
    } catch {
      setTutors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { tutors, loading, refetch: fetch }
}

// ── Принять приглашение от преподавателя (уже зарегистрированный студент) ─────

export function useAcceptInvite() {
  const [loading, setLoading] = useState(false)

  async function acceptInvite(tokenOrUrl: string): Promise<void> {
    // Извлекаем токен из URL если передали полную ссылку
    let token = tokenOrUrl.trim()
    try {
      const url = new URL(token)
      const parts = url.pathname.split('/')
      token = parts[parts.length - 1] ?? token
    } catch {
      // Не URL — используем как есть
    }

    setLoading(true)
    try {
      await api.post('/students/accept-invite', { token })
    } finally {
      setLoading(false)
    }
  }

  return { acceptInvite, loading }
}

// ── Сгенерировать ссылку-приглашение ─────────────────────────────────────────

export function useGenerateInvite() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function generateInvite(studentId: string): Promise<string> {
    setLoadingId(studentId)
    try {
      const { data } = await api.post(`/students/${studentId}/invite`)
      return data.data.inviteUrl as string
    } finally {
      setLoadingId(null)
    }
  }

  return { generateInvite, loadingId }
}
