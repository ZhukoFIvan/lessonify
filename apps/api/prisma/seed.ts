import { PrismaClient, UserRole, Gender, LessonStatus, PaymentStatus, HomeworkStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Репетитор ────────────────────────────────────────────────────────────────
  const tutorUser = await prisma.user.upsert({
    where: { email: 'tutor@tutorflow.dev' },
    update: {},
    create: {
      email: 'tutor@tutorflow.dev',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Анна Сергеевна',
      role: UserRole.TUTOR,
      gender: Gender.FEMALE,
      avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Anna',
      tutor: {
        create: {
          subjects: ['Математика', 'Физика'],
          hourlyRate: 2000,
          timezone: 'Europe/Moscow',
        },
      },
    },
    include: { tutor: true },
  })

  const tutorId = tutorUser.tutor!.id

  // ── Ученики ───────────────────────────────────────────────────────────────────
  const student1 = await prisma.student.upsert({
    where: { inviteToken: 'demo-token-1' },
    update: {},
    create: {
      tutorId,
      name: 'Иван Петров',
      email: 'ivan@example.com',
      subject: 'Математика',
      hourlyRate: 2000,
      inviteToken: 'demo-token-1',
      color: '#6C63FF',
    },
  })

  const student2 = await prisma.student.upsert({
    where: { inviteToken: 'demo-token-2' },
    update: {},
    create: {
      tutorId,
      name: 'Мария Кузнецова',
      email: 'maria@example.com',
      subject: 'Физика',
      hourlyRate: 2000,
      inviteToken: 'demo-token-2',
      color: '#10B981',
    },
  })

  // ── Уроки ─────────────────────────────────────────────────────────────────────
  const now = new Date()
  const today9 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0)
  const today11 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0)
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0)

  const lesson1 = await prisma.lesson.create({
    data: {
      tutorId,
      studentId: student1.id,
      subject: 'Математика',
      startTime: today9,
      durationMinutes: 60,
      price: 2000,
      status: LessonStatus.SCHEDULED,
      paymentStatus: PaymentStatus.PENDING,
    },
  })

  const lesson2 = await prisma.lesson.create({
    data: {
      tutorId,
      studentId: student2.id,
      subject: 'Физика',
      startTime: today11,
      durationMinutes: 90,
      price: 3000,
      status: LessonStatus.SCHEDULED,
      paymentStatus: PaymentStatus.PENDING,
    },
  })

  // Вчерашний урок — завершён и оплачен
  const lesson3 = await prisma.lesson.create({
    data: {
      tutorId,
      studentId: student1.id,
      subject: 'Математика',
      startTime: yesterday,
      durationMinutes: 60,
      price: 2000,
      status: LessonStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date(),
      payment: {
        create: { amount: 2000 },
      },
    },
  })

  // Завтрашний урок
  await prisma.lesson.create({
    data: {
      tutorId,
      studentId: student2.id,
      subject: 'Физика',
      startTime: tomorrow,
      durationMinutes: 60,
      price: 2000,
      status: LessonStatus.SCHEDULED,
      paymentStatus: PaymentStatus.PENDING,
    },
  })

  // ── Домашнее задание ─────────────────────────────────────────────────────────
  await prisma.homework.create({
    data: {
      lessonId: lesson1.id,
      tutorId,
      studentId: student1.id,
      description: 'Решить задачи из сборника: §12, упражнения 1–10',
      deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
      status: HomeworkStatus.ASSIGNED,
    },
  })

  await prisma.homework.create({
    data: {
      lessonId: lesson3.id,
      tutorId,
      studentId: student1.id,
      description: 'Повторить тему «Производная», решить вариант 5',
      deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      status: HomeworkStatus.SUBMITTED,
    },
  })

  console.log('✅ Seed complete')
  console.log(`   Репетитор: tutor@tutorflow.dev / password123`)
  console.log(`   Ученики: ${student1.name}, ${student2.name}`)
  console.log(`   Уроки: ${lesson1.id}, ${lesson2.id}, ${lesson3.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
