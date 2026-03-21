'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface TutorProfile {
  id: string
  subjects: string[]
  hourlyRate?: number
  user: { name: string; avatarUrl?: string }
}

export function useMyTutor() {
  const [tutor, setTutor] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/students/my-tutor')
      .then(({ data }) => setTutor(data.data))
      .catch(() => setTutor(null))
      .finally(() => setLoading(false))
  }, [])

  return { tutor, loading }
}
