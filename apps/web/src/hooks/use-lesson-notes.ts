'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { LessonNote } from '@tutorflow/types'

export function useLessonNotes(lessonId: string | null) {
  const [notes, setNotes] = useState<LessonNote[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!lessonId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/lesson-notes/lessons/${lessonId}`)
      setNotes(data.data)
    } catch {
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => { fetch() }, [fetch])

  return { notes, loading, refetch: fetch }
}

export function useCreateNote() {
  const [loading, setLoading] = useState(false)

  async function createNote(lessonId: string, content: string): Promise<LessonNote> {
    setLoading(true)
    try {
      const { data } = await api.post(`/lesson-notes/lessons/${lessonId}`, { content })
      return data.data
    } finally {
      setLoading(false)
    }
  }

  return { createNote, loading }
}

export function useUpdateNote() {
  const [loading, setLoading] = useState(false)

  async function updateNote(noteId: string, content: string): Promise<LessonNote> {
    setLoading(true)
    try {
      const { data } = await api.patch(`/lesson-notes/${noteId}`, { content })
      return data.data
    } finally {
      setLoading(false)
    }
  }

  return { updateNote, loading }
}

export function useDeleteNote() {
  const [loading, setLoading] = useState(false)

  async function deleteNote(noteId: string): Promise<void> {
    setLoading(true)
    try {
      await api.delete(`/lesson-notes/${noteId}`)
    } finally {
      setLoading(false)
    }
  }

  return { deleteNote, loading }
}
