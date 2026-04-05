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
function timeWindow(target: Date): { gte: Date; lte: Date } {
  return {
    gte: startOfMinute(target),
    lte: addMinutes(startOfMinute(target), 1),
  }
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

    // Ученику
    const studentTg = lesson.student.telegramConnection?.telegramId
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

// ── Напоминание за 5 минут до урока (репетитор + ученик) ─────────────────────

async function remind5min(): Promise<void> {
  const target = addMinutes(new Date(), 5)
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
          telegramConnection: { select: { telegramId: true } },
        },
      },
    },
  })

  for (const lesson of lessons) {
    const tutorTg = lesson.tutor.telegramConnection?.telegramId
    if (tutorTg) {
      await sendLessonReminder(tutorTg, {
        studentName: lesson.student.name,
        subject: lesson.subject,
        startTime: lesson.startTime,
        timeLabel: '5 минут',
      })
    }

    const studentTg = lesson.student.telegramConnection?.telegramId
    if (studentTg) {
      await sendStudentLessonReminder(studentTg, {
        tutorName: lesson.tutor.user.name,
        subject: lesson.subject,
        startTime: lesson.startTime,
        timeLabel: '5 минут',
      })
    }
  }

  if (lessons.length > 0) {
    console.log(`[cron 5min] Отправлено напоминаний: ${lessons.length}`)
  }
}

// ── Напоминание за 1 час до урока (репетитор + ученик) ───────────────────────

async function remind1h(): Promise<void> {
  const target = addHours(new Date(), 1)
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
          telegramConnection: { select: { telegramId: true } },
        },
      },
    },
  })

  for (const lesson of lessons) {
    const tutorTg = lesson.tutor.telegramConnection?.telegramId
    if (tutorTg && lesson.tutor.reminderBeforeLesson <= 60) {
      await sendLessonReminder(tutorTg, {
        studentName: lesson.student.name,
        subject: lesson.subject,
        startTime: lesson.startTime,
        timeLabel: '1 час',
      })
    }

    const studentTg = lesson.student.telegramConnection?.telegramId
    if (studentTg) {
      await sendStudentLessonReminder(studentTg, {
        tutorName: lesson.tutor.user.name,
        subject: lesson.subject,
        startTime: lesson.startTime,
        timeLabel: '1 час',
      })
    }
  }

  if (lessons.length > 0) {
    console.log(`[cron 1h] Отправлено напоминаний: ${lessons.length}`)
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
  // Каждую минуту — проверяем уроки через 5мин, 1ч и 24ч, оплаты
  cron.schedule('* * * * *', async () => {
    await Promise.allSettled([remind5min(), remind1h(), remind24h(), remindPayment()])
  })

  // Раз в день в 03:00 — помечаем просроченные, чистим токены, проверяем планы
  cron.schedule('0 3 * * *', async () => {
    await Promise.allSettled([markOverdue(), cleanupTokens(), checkPlanExpiry()])
  })

  console.log('[cron] Jobs started')
}
