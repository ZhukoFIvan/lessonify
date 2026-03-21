import { google } from 'googleapis'
import { prisma } from '../../lib/prisma'
import { encrypt, decrypt } from '../../lib/crypto'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI,
  )
}

export const calendarService = {
  getAuthUrl(tutorId: string): string {
    const oauth2Client = getOAuthClient()
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: tutorId,
      prompt: 'consent',
    })
  },

  async handleCallback(code: string, tutorId: string): Promise<void> {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Создаём или находим календарь "TutorFlow"
    let calendarId = 'primary'
    try {
      const listRes = await calendar.calendarList.list()
      const existing = listRes.data.items?.find((c) => c.summary === 'TutorFlow')
      if (existing?.id) {
        calendarId = existing.id
      } else {
        const created = await calendar.calendars.insert({
          requestBody: {
            summary: 'TutorFlow',
            description: 'Уроки репетитора, синхронизированные через TutorFlow',
            timeZone: 'Europe/Moscow',
          },
        })
        calendarId = created.data.id ?? 'primary'
      }
    } catch {
      calendarId = 'primary'
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000)

    await prisma.calendarSync.upsert({
      where: { tutorId },
      create: {
        tutorId,
        googleCalendarId: calendarId,
        accessToken: encrypt(tokens.access_token ?? ''),
        refreshToken: encrypt(tokens.refresh_token ?? ''),
        tokenExpiresAt: expiresAt,
        syncEnabled: true,
      },
      update: {
        googleCalendarId: calendarId,
        accessToken: encrypt(tokens.access_token ?? ''),
        ...(tokens.refresh_token ? { refreshToken: encrypt(tokens.refresh_token) } : {}),
        tokenExpiresAt: expiresAt,
        syncEnabled: true,
      },
    })
  },

  async getStatus(tutorId: string) {
    const sync = await prisma.calendarSync.findUnique({ where: { tutorId } })
    if (!sync) return { connected: false }
    return {
      connected: true,
      syncEnabled: sync.syncEnabled,
      lastSyncAt: sync.lastSyncAt,
      googleCalendarId: sync.googleCalendarId,
    }
  },

  async toggleSync(tutorId: string): Promise<boolean> {
    const sync = await prisma.calendarSync.findUnique({ where: { tutorId } })
    if (!sync) throw new Error('Google Calendar не подключён')
    const updated = await prisma.calendarSync.update({
      where: { tutorId },
      data: { syncEnabled: !sync.syncEnabled },
    })
    return updated.syncEnabled
  },

  async disconnect(tutorId: string): Promise<void> {
    await prisma.calendarSync.deleteMany({ where: { tutorId } })
  },

  async syncLesson(tutorId: string, lessonId: string): Promise<void> {
    const sync = await prisma.calendarSync.findUnique({ where: { tutorId } })
    if (!sync || !sync.syncEnabled) return

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { student: { select: { name: true } } },
    })
    if (!lesson) return

    try {
      const auth = await getAuthenticatedClient(sync)
      const calendar = google.calendar({ version: 'v3', auth })

      const startTime = new Date(lesson.startTime)
      const endTime = new Date(startTime.getTime() + lesson.durationMinutes * 60000)

      const event = {
        summary: `${lesson.subject} — ${lesson.student.name}`,
        description: lesson.notes ?? '',
        start: { dateTime: startTime.toISOString(), timeZone: 'Europe/Moscow' },
        end: { dateTime: endTime.toISOString(), timeZone: 'Europe/Moscow' },
        colorId: lesson.status === 'CANCELLED' ? '11' : '7',
      }

      let googleEventId = lesson.googleEventId

      if (googleEventId) {
        await calendar.events.update({
          calendarId: sync.googleCalendarId,
          eventId: googleEventId,
          requestBody: event,
        })
      } else {
        const created = await calendar.events.insert({
          calendarId: sync.googleCalendarId,
          requestBody: event,
        })
        googleEventId = created.data.id ?? null
        await prisma.lesson.update({ where: { id: lessonId }, data: { googleEventId } })
      }

      await prisma.calendarSync.update({ where: { tutorId }, data: { lastSyncAt: new Date() } })
    } catch (err) {
      console.error('[calendar] sync error:', err)
    }
  },

  async deleteEvent(tutorId: string, googleEventId: string): Promise<void> {
    const sync = await prisma.calendarSync.findUnique({ where: { tutorId } })
    if (!sync || !sync.syncEnabled) return

    try {
      const auth = await getAuthenticatedClient(sync)
      const calendar = google.calendar({ version: 'v3', auth })
      await calendar.events.delete({ calendarId: sync.googleCalendarId, eventId: googleEventId })
    } catch (err) {
      console.error('[calendar] delete event error:', err)
    }
  },

  async syncAll(tutorId: string): Promise<number> {
    const lessons = await prisma.lesson.findMany({
      where: {
        tutorId,
        startTime: { gte: new Date() },
        status: { not: 'CANCELLED' },
      },
      select: { id: true },
    })

    for (const lesson of lessons) {
      await calendarService.syncLesson(tutorId, lesson.id)
    }

    return lessons.length
  },
}

async function getAuthenticatedClient(sync: { accessToken: string; refreshToken: string; tokenExpiresAt: Date }) {
  const oauth2Client = getOAuthClient()
  const accessToken = decrypt(sync.accessToken)
  const refreshToken = decrypt(sync.refreshToken)

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: sync.tokenExpiresAt.getTime(),
  })

  // Обновляем токен если скоро истекает (5 мин)
  if (sync.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    await prisma.calendarSync.updateMany({
      where: { accessToken: encrypt(accessToken) },
      data: {
        accessToken: encrypt(credentials.access_token ?? ''),
        tokenExpiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 3600000),
      },
    })
  }

  return oauth2Client
}
