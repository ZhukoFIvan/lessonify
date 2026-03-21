'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { AvailabilitySlot, BookingRequest } from '@tutorflow/types'

// ── Репетитор: управление слотами ────────────────────────────────────────────

export function useAvailabilitySlots() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/availability/slots')
      setSlots(data.data)
    } catch {
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function createSlot(payload: {
    dayOfWeek: number
    startHour: number
    startMinute: number
    durationMinutes: number
  }): Promise<AvailabilitySlot> {
    const { data } = await api.post('/availability/slots', payload)
    await fetch()
    return data.data
  }

  async function updateSlot(slotId: string, payload: Partial<AvailabilitySlot>): Promise<void> {
    await api.patch(`/availability/slots/${slotId}`, payload)
    await fetch()
  }

  async function deleteSlot(slotId: string): Promise<void> {
    await api.delete(`/availability/slots/${slotId}`)
    await fetch()
  }

  return { slots, loading, refetch: fetch, createSlot, updateSlot, deleteSlot }
}

// ── Репетитор: запросы на запись ─────────────────────────────────────────────

export function useBookingRequests(status?: string) {
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = status ? { status } : {}
      const { data } = await api.get('/availability/bookings', { params })
      setBookings(data.data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetch() }, [fetch])

  async function respond(bookingId: string, status: 'CONFIRMED' | 'REJECTED', price?: number) {
    await api.patch(`/availability/bookings/${bookingId}/respond`, { status, price })
    await fetch()
  }

  return { bookings, loading, refetch: fetch, respond }
}

// ── Ученик: слоты репетитора ─────────────────────────────────────────────────

export function useTutorPublicSlots(tutorId: string | null) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tutorId) return
    setLoading(true)
    api.get(`/availability/tutor/${tutorId}/slots`)
      .then(({ data }) => setSlots(data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [tutorId])

  return { slots, loading }
}

// ── Ученик: свои запросы ─────────────────────────────────────────────────────

export function useMyBookings() {
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/availability/bookings/my')
      setBookings(data.data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function requestBooking(payload: { slotId: string; requestedAt: string; note?: string }) {
    const { data } = await api.post('/availability/bookings', payload)
    await fetch()
    return data.data
  }

  return { bookings, loading, refetch: fetch, requestBooking }
}
