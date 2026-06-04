import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TUTOR_EMAIL = 'tutor@tutorflow.dev'

function dateInMonth(monthsAgo: number, day: number, hour: number) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, hour, 0, 0, 0)
}
function daysAgo(days: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d
}
function daysAhead(days: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TUTOR_EMAIL }, include: { tutor: true } })
  if (!user?.tutor) throw new Error(`Tutor ${TUTOR_EMAIL} not found`)
  const tutorId = user.tutor.id

  const defs = [
    { token: 'demo-token-1', name: 'Иван Петров',     subject: 'Математика',     rate: 2000, color: '#6C63FF' },
    { token: 'demo-token-2', name: 'Мария Кузнецова', subject: 'Физика',         rate: 2000, color: '#10B981' },
    { token: 'demo-token-3', name: 'Дарья Соколова',  subject: 'Английский',     rate: 1800, color: '#3B82F6' },
    { token: 'demo-token-4', name: 'Артём Волков',    subject: 'Химия',          rate: 2200, color: '#F59E0B' },
    { token: 'demo-token-5', name: 'София Морозова',  subject: 'Обществознание', rate: 1500, color: '#EC4899' },
  ]

  const students: Array<{ id: string; name: string; subject: string; rate: number }> = []
  for (const s of defs) {
    const st = await prisma.student.upsert({
      where: { inviteToken: s.token },
      update: { name: s.name, subject: s.subject, hourlyRate: s.rate, color: s.color, tutorId },
      create: { tutorId, name: s.name, email: `${s.token}@example.com`, subject: s.subject, hourlyRate: s.rate, color: s.color, inviteToken: s.token },
    })
    students.push({ id: st.id, name: s.name, subject: s.subject, rate: s.rate })
  }

  // Сброс — удаляем уроки этого репетитора (каскадом уходят payments + homework)
  const del = await prisma.lesson.deleteMany({ where: { tutorId } })
  console.log(`reset: deleted ${del.count} lessons`)

  const created: Record<string, any[]> = {}
  let totalLessons = 0
  let totalIncome = 0

  async function mk(
    st: { id: string; subject: string; rate: number },
    when: Date,
    status: 'COMPLETED' | 'SCHEDULED',
    pay: 'PAID' | 'PENDING' | 'OVERDUE',
    opts: { price?: number; duration?: number } = {},
  ) {
    const price = opts.price ?? st.rate
    const data: any = {
      tutorId, studentId: st.id, subject: st.subject,
      startTime: when, durationMinutes: opts.duration ?? 60,
      status, paymentStatus: pay, price,
    }
    if (pay === 'PAID') {
      data.paidAt = when
      data.payment = { create: { amount: price, paidAt: when, note: 'Перевод на карту' } }
      totalIncome += price
    }
    const lesson = await prisma.lesson.create({ data })
    totalLessons++
    if (!created[st.id]) created[st.id] = []
    created[st.id].push(lesson)
    return lesson
  }

  // ── Прошлые 6 месяцев: оплаченные уроки (график «доходы за 6 месяцев») ──
  const dayPool = [4, 9, 14, 18, 23, 27]
  for (let m = 6; m >= 1; m--) {
    for (const st of students) {
      const n = 2 + ((m + st.rate) % 3) // 2..4 уроков/мес
      for (let i = 0; i < n; i++) {
        const day = dayPool[(i + m) % dayPool.length]
        const hour = 10 + ((i * 2 + m) % 9)
        const long = i % 3 === 0
        await mk(st, dateInMonth(m, day, hour), 'COMPLETED', 'PAID', {
          duration: long ? 90 : 60,
          price: long ? Math.round(st.rate * 1.5) : st.rate,
        })
      }
    }
  }

  // ── Текущий месяц: оплаченные (доход за месяц) ──
  for (const st of students) {
    await mk(st, daysAgo(1, 12), 'COMPLETED', 'PAID')
    await mk(st, daysAgo(3, 15), 'COMPLETED', 'PAID')
  }

  const find = (n: string) => students.find((s) => s.name.startsWith(n))!
  const ivan = find('Иван'), maria = find('Мария'), darya = find('Дарья'), artem = find('Артём'), sofia = find('София')

  // ── Должники: завершённые, но не оплаченные ──
  await mk(artem, daysAgo(8, 15), 'COMPLETED', 'OVERDUE')
  await mk(artem, daysAgo(4, 16), 'COMPLETED', 'OVERDUE')
  await mk(sofia, daysAgo(6, 14), 'COMPLETED', 'OVERDUE')
  await mk(ivan,  daysAgo(2, 17), 'COMPLETED', 'PENDING')

  // ── Предстоящие уроки (календарь + дашборд) ──
  for (let i = 0; i < students.length; i++) {
    await mk(students[i], daysAhead(i, 12 + (i % 6)), 'SCHEDULED', 'PENDING')
    await mk(students[i], daysAhead(i + 3, 13 + (i % 5)), 'SCHEDULED', 'PENDING')
  }
  await mk(ivan, daysAhead(0, 18), 'SCHEDULED', 'PENDING')
  await mk(maria, daysAhead(0, 20), 'SCHEDULED', 'PENDING')

  // ── Домашние задания во всех статусах ──
  function completedOf(st: { id: string }) {
    return (created[st.id] ?? []).filter((l) => l.status === 'COMPLETED')
  }
  async function hw(st: { id: string }, fromEnd: number, data: any) {
    const ls = completedOf(st)
    const lesson = ls[ls.length - 1 - fromEnd]
    if (!lesson) return
    await prisma.homework.create({ data: { lessonId: lesson.id, tutorId, studentId: st.id, ...data } })
  }

  await hw(ivan, 0, { description: 'Решить задачи №12–18 из сборника Сканави', status: 'REVIEWED', feedback: 'Отлично! Все задачи решены верно, аккуратное оформление 👍', submissionText: 'Готово, прикрепил фото решения', deadline: daysAgo(5, 20) })
  await hw(ivan, 1, { description: 'Производная: вариант 5', status: 'REVIEWED', feedback: 'Молодец, только в №3 арифметическая ошибка', deadline: daysAgo(9, 20) })
  await hw(ivan, 2, { description: 'Тригонометрия §14, упражнения 1–10', status: 'SUBMITTED', submissionText: 'Сделал, есть вопрос по №7', deadline: daysAhead(2, 20) })
  await hw(maria, 0, { description: 'Законы Ньютона: задачи 3–9', status: 'SUBMITTED', submissionText: 'Решила всё', deadline: daysAhead(1, 20) })
  await hw(artem, 0, { description: 'Окислительно-восстановительные реакции, §22', status: 'ASSIGNED', deadline: daysAgo(3, 20) })
  await hw(darya, 0, { description: 'Essay: My future profession (180–200 слов)', status: 'ASSIGNED', deadline: daysAhead(4, 20) })
  await hw(sofia, 0, { description: 'Конспект по теме «Политические режимы»', status: 'REVIEWED', feedback: 'Хороший конспект, добавь примеры из новостей', deadline: daysAgo(6, 20) })
  await hw(sofia, 1, { description: 'Эссе по обществознанию (план + аргументы)', status: 'ASSIGNED', deadline: daysAgo(2, 20) })

  console.log(`✅ demo data ready for ${TUTOR_EMAIL}`)
  console.log(`   students: ${students.length}, lessons: ${totalLessons}, income(paid): ${totalIncome} ₽`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
