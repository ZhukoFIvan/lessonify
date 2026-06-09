import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

/**
 * Донор дохода для демо-препода: добавляет оплаченные уроки в ТЕКУЩЕМ месяце,
 * чтобы «Доход за месяц» вышел на целевую сумму (по умолчанию 250 000 ₽).
 *
 * Идемпотентно: помечает свои уроки notes = BOOST_MARKER и при повторном запуске
 * сначала удаляет прошлые донорские уроки (каскадом уходят их payments), затем
 * добивает месяц до цели заново. Реальный сид-набор, должники и ДЗ не трогаются.
 *
 * Запуск:  npx tsx src/scripts/boost-demo-income.ts            # 250000
 *          TARGET_INCOME=300000 npx tsx src/scripts/boost-demo-income.ts
 *          npx tsx src/scripts/boost-demo-income.ts 180000
 */

const prisma = new PrismaClient()
const TUTOR_EMAIL = process.env.DEMO_TUTOR_EMAIL ?? 'tutor@tutorflow.dev'
const BOOST_MARKER = 'demo-income-boost'
const TARGET = Math.max(0, Math.round(Number(process.argv[2] ?? process.env.TARGET_INCOME ?? 250_000)))

// Премиум-сессии — крупный чек, чтобы выйти на ~250к разумным числом уроков (а не сотней)
const PRICES = [4000, 4500, 5000, 5500, 6000]

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TUTOR_EMAIL }, include: { tutor: true } })
  if (!user?.tutor) throw new Error(`Tutor ${TUTOR_EMAIL} not found`)
  const tutorId = user.tutor.id

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  // Раскидываем по уже прошедшим дням месяца (1..вчера), чтобы не было «оплачено в будущем»
  const spanDays = Math.max(1, now.getDate() - 1)

  const students = await prisma.student.findMany({
    where: { tutorId },
    select: { id: true, subject: true, name: true },
  })
  if (students.length === 0) throw new Error('У препода нет учеников — сначала запусти seed-demo')

  // 1) Чистим прошлые донорские уроки (идемпотентность)
  const del = await prisma.lesson.deleteMany({ where: { tutorId, notes: BOOST_MARKER } })

  // 2) Сколько уже реально оплачено в этом месяце (после удаления донорских)
  const existing = await prisma.lesson.aggregate({
    where: { tutorId, paymentStatus: 'PAID', paidAt: { gte: monthStart, lte: monthEnd } },
    _sum: { price: true },
  })
  const existingPaid = existing._sum.price ?? 0

  // 3) Добиваем до цели
  let added = 0
  let count = 0
  let i = 0
  while (existingPaid + added < TARGET) {
    const remaining = TARGET - existingPaid - added
    let price = PRICES[i % PRICES.length]!
    if (price > remaining) price = remaining // последний урок ровно в цель
    if (price < 500) break

    const st = students[i % students.length]!
    const day = 1 + (i % spanDays) // 1..spanDays
    const hour = 9 + (i % 10) // 9..18
    const when = new Date(now.getFullYear(), now.getMonth(), day, hour, 0, 0, 0)

    await prisma.lesson.create({
      data: {
        tutorId,
        studentId: st.id,
        subject: st.subject,
        startTime: when,
        durationMinutes: i % 3 === 0 ? 90 : 60,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        price,
        paidAt: when,
        notes: BOOST_MARKER,
        payment: { create: { amount: price, paidAt: when, note: 'Оплата (демо)' } },
      },
    })
    added += price
    count++
    i++
  }

  const total = existingPaid + added
  console.log(`✅ boost готов для ${TUTOR_EMAIL}`)
  console.log(`   удалено прошлых донорских уроков: ${del.count}`)
  console.log(`   было оплачено в этом месяце: ${existingPaid.toLocaleString('ru-RU')} ₽`)
  console.log(`   добавлено: ${count} уроков на ${added.toLocaleString('ru-RU')} ₽`)
  console.log(`   ИТОГО доход за месяц: ${total.toLocaleString('ru-RU')} ₽ (цель ${TARGET.toLocaleString('ru-RU')} ₽)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
