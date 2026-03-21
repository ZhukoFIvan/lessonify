'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { StudentHomeworkItem, HomeworkWithDetails, HomeworkStatus, CreateHomeworkRequest } from '@tutorflow/types'

// ── Домашние задания ученика ──────────────────────────────────────────────────

export function useStudentHomework(status?: HomeworkStatus) {
  const [items, setItems] = useState<StudentHomeworkItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (status) params.set('status', status)
      const { data } = await api.get(`/homework/my?${params}`)
      setItems(data.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetch() }, [fetch])

  return { items, loading, refetch: fetch }
}

// ── Список ДЗ репетитора ──────────────────────────────────────────────────────

export function useTutorHomework(status?: HomeworkStatus) {
  const [items, setItems] = useState<HomeworkWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (status) params.set('status', status)
      const { data } = await api.get(`/homework?${params}`)
      setItems(data.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetch() }, [fetch])

  return { items, loading, refetch: fetch }
}

// ── Оставить отзыв на ДЗ (репетитор) ─────────────────────────────────────────

export function useReviewHomework() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function reviewHomework(homeworkId: string, feedback: string): Promise<void> {
    setLoadingId(homeworkId)
    try {
      await api.patch(`/homework/${homeworkId}`, { status: 'REVIEWED', feedback })
    } finally {
      setLoadingId(null)
    }
  }

  return { reviewHomework, loadingId }
}

// ── Создать домашнее задание (репетитор) ──────────────────────────────────────

export function useCreateHomework() {
  const [loading, setLoading] = useState(false)

  async function createHomework(lessonId: string, data: CreateHomeworkRequest): Promise<void> {
    setLoading(true)
    try {
      await api.post(`/homework/lessons/${lessonId}`, data)
    } finally {
      setLoading(false)
    }
  }

  return { createHomework, loading }
}

// ── Сдать домашнее задание ────────────────────────────────────────────────────

export function useSubmitHomework() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function submit(homeworkId: string, submissionText?: string, fileUrls?: string[]): Promise<void> {
    setLoadingId(homeworkId)
    try {
      await api.patch(`/homework/${homeworkId}/submit`, { submissionText, fileUrls })
    } finally {
      setLoadingId(null)
    }
  }

  return { submit, loadingId }
}

// ── Загрузка файлов ───────────────────────────────────────────────────────────

export async function uploadFiles(files: File[]): Promise<string[]> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data.urls as string[]
}
