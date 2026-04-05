import cron from 'node-cron'
import { addHours, addMinutes, subHours, startOfMinute } from 'date-fns'
import { prisma } from '../lib/prisma'
import {
  sendLessonReminder,
  sendPaymentReminder,
  sendStudentLessonReminder,
} from '../modules/telegram/telegram.bot'
import { authService } from '../modules/auth/auth.service'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Окно поиска: ±1 минута от целевого времени (cron запускается каждую минуту)
function timeWindow(target: Date): { gte: Date; lt: Date } {
  return {
    gte: startOfMinute(target),
    lt: addMinutes(startOfMinute(target), 1),
  }
}

// TelegramConnection привязан к Student-записи, а не к User.
// Студент мог подключить Telegram через другого репетитора —
// ищем его telegramId по userId если прямая связь отсутствует.
async function resolveStudentTelegramId(
  directTelegramId: string | null | undefined,
  userId: string | null | undefined,
): Promise<string | null> {
  if (directTelegramId) return directTelegramId
  if (!userId) return null
  const conn = await prisma.telegramConnection.findFirst({
    where: { student: { userId } },
    select: { telegramId: true },
  })
  return conn?.telegramId ?? null
}

// ── Напоминание за 24 часа до урока (репетитор + ученик) ─────────────────────

async function remind24h(): Promise<void> {
  const target = addHours(new Date(), 24)
  const window = timeWindow(target)

  const lessons = await prisma.lesson.findMany({
    where: {
      startTime: window,
      status: 'SCHEDULED',
    },
    select: {
      id: true,
      subject: true,
      startTime: true,
      price: true,
      tutor: {
        select: {
          reminderBeforeLesson: true,
          user: { select: { name: true } },
          telegramConnection: { select: { telegramId: true } },
        },
      },
      student: {
        select: {
          name: true,
          userId: true,
          telegramConnection: { select: { telegramId: true } },
        },
      },
    },
  })

  for (const lesson of lessons) {
    // Репетитору — если включены 24ч напоминания
    const tutorTg = lesson.tutor.telegramConnection?.telegramId
    if (tutorTg && lesson.tutor.reminderBeforeLesson <= 1440) {
      await sendLessonReminder(tutorTg, {
        studentName: lesson.student.name,
        subject: lesson.subject,
        startTime: lesson.startTime,
        timeLabel: '24 часа',
      })
    }

    // Ученику — ищем telegram через userId если прямой связи нет
    const studentTg = await resolveStudentTelegramId(
      lesson.student.telegramConnection?.telegramId,
      lesson.student.userId,
    )
    if (studentTg) {
      await sendStudentLessonReminder(studentTg, {
        tutorName: lesson.tutor.user.name,
        subject: lesson.subject,
        startTime: lesson.startTime,
        timeLabel: '24 часа',
      })
    }
  }

  if (lessons.length > 0) {
    console.log(`[cron 24h] Отправлено напоминаний: ${lessons.length}`)
  }
}

// ── Напоминание до урока — все значения из настроек (репетитор + ученик) ──────
// Поддерживаемые значения reminderBeforeLesson: 5, 10, 15, 30, 60, 120 минут.
// Каждую минуту проверяем каждое значение — репетитору отправляем только если
// его настройка точно совпадает с окном. Ученику — при тех же окнах.

const REMINDER_OPTIONS = [5, 10, 15, 30, 60, 120]

function timeLabelFromMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`
  const h = minutes / 60
  if (h === 1) return '1 час'
  if (h === 2) return '2 часа'
  return `${h} часа`
}

async function remindBeforeLesson(): Promise<void> {
  const now = new Date()
  let totalSent = 0

  for (const minutes of REMINDER_OPTIONS) {
    const window = timeWindow(addMinutes(now, minutes))

    const lessons = await prisma.lesson.findMany({
      where: {
        startTime: window,
        status: 'SCHEDULED',
        tutor: { reminderBeforeLesson: minutes }, // точное совпадение с настройкой
      },
      select: {
        id: true,
        subject: true,
        startTime: true,
        tutor: {
          select: {
            user: { select: { name: true } },
            telegramConnection: { select: { telegramId: true } },
          },
        },
        student: {
          select: {
            name: true,
            userId: true,
            telegramConnection: { select: { telegramId: true } },
          },
        },
      },
    })

    const timeLabel = timeLabelFromMinutes(minutes)

    for (const lesson of lessons) {
      const tutorTg = lesson.tutor.telegramConnection?.telegramId
      if (tutorTg) {
        await sendLessonReminder(tutorTg, {
          studentName: lesson.student.name,
          subject: lesson.subject,
          startTime: lesson.startTime,
          timeLabel,
        })
      }

      const studentTg = await resolveStudentTelegramId(
        lesson.student.telegramConnection?.telegramId,
        lesson.student.userId,
      )
      if (studentTg) {
        await sendStudentLessonReminder(studentTg, {
          tutorName: lesson.tutor.user.name,
          subject: lesson.subject,
          startTime: lesson.startTime,
          timeLabel,
        })
      }

      totalSent++
    }
  }

  if (totalSent > 0) {
    console.log(`[cron remind] Отправлено напоминаний: ${totalSent}`)
  }
}

// ── Напоминание об оплате через 2 часа после урока ───────────────────────────

async function remindPayment(): Promise<void> {
  const target = subHours(new Date(), 2)
  const window = timeWindow(target)

  const lessons = await prisma.lesson.findMany({
    where: {
      startTime: window,
      status: 'COMPLETED',
      paymentStatus: 'PENDING',
    },
    select: {
      id: true,
      subject: true,
      price: true,
      tutor: {
        select: {
          reminderAfterLesson: true,
          telegramConnection: { select: { telegramId: true } },
        },
      },
      student: {
        select: { name: true },
      },
    },
  })

  for (const lesson of lessons) {
    const tutorTg = lesson.tutor.telegramConnection?.telegramId
    if (tutorTg) {
      await sendPaymentReminder(tutorTg, {
        studentName: lesson.student.name,
        subject: lesson.subject,
        amount: lesson.price,
      })
    }
  }

  if (lessons.length > 0) {
    console.log(`[cron payment] Отправлено напоминаний об оплате: ${lessons.length}`)
  }
}

// ── Пометить просроченные уроки как OVERDUE ───────────────────────────────────
// Уроки, которые не отмечены оплаченными > 7 дней после завершения

async function markOverdue(): Promise<void> {
  const sevenDaysAgo = subHours(new Date(), 7 * 24)

  const { count } = await prisma.lesson.updateMany({
    where: {
      status: 'COMPLETED',
      paymentStatus: 'PENDING',
      startTime: { lt: sevenDaysAgo },
    },
    data: { paymentStatus: 'OVERDUE' },
  })

  if (count > 0) {
    console.log(`[cron overdue] Помечено просроченных: ${count}`)
  }
}

// ── Очистка истёкших refresh токенов ─────────────────────────────────────────

async function cleanupTokens(): Promise<void> {
  const count = await authService.cleanupExpiredTokens()
  if (count > 0) {
    console.log(`[cron cleanup] Удалено истёкших токенов: ${count}`)
  }
}

// ── Уведомления об истечении Pro-плана ───────────────────────────────────────

async function checkPlanExpiry(): Promise<void> {
  const now = new Date()
  const in3days = new Date(now)
  in3days.setDate(in3days.getDate() + 3)

  // Уведомить за 3 дня до конца
  const expiringSoon = await prisma.user.findMany({
    where: {
      plan: 'PRO',
      planExpiresAt: { gte: now, lte: in3days },
    },
    include: { tutor: { include: { telegramConnection: true } } },
  })

  for (const user of expiringSoon) {
    const tg = user.tutor?.telegramConnection
    if (!tg) continue
    const daysLeft = Math.ceil((user.planExpiresAt!.getTime() - now.getTime()) / 86400000)
    try {
      const { bot } = await import('../modules/telegram/telegram.bot')
      await bot.telegram.sendMessage(
        tg.telegramId,
        `⚠️ Ваш Pro-план заканчивается через ${daysLeft} дн. Продлите его, чтобы не потерять доступ к функциям.\n\nПромокод или продление: https://t.me/lessonify_bot`,
      )
    } catch {}
  }

  // Понизить истёкшие планы
  await prisma.user.updateMany({
    where: { plan: 'PRO', planExpiresAt: { lt: now } },
    data: { plan: 'FREE', planExpiresAt: null },
  })
}

// ── Регистрация всех задач ────────────────────────────────────────────────────

export function startCronJobs(): void {
  // Каждую минуту — напоминания до урока (по настройке препода) и оплаты
  cron.schedule('* * * * *', async () => {
    await Promise.allSettled([remindBeforeLesson(), remind24h(), remindPayment()])
  })

  // Раз в день в 03:00 — помечаем просроченные, чистим токены, проверяем планы
  cron.schedule('0 3 * * *', async () => {
    await Promise.allSettled([markOverdue(), cleanupTokens(), checkPlanExpiry()])
  })

  console.log('[cron] Jobs started')
}
