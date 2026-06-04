import * as fs from 'fs'
import * as path from 'path'
import { PDFDocument, rgb, type PDFFont, type PDFImage } from 'pdf-lib'
import * as fontkit from '@pdf-lib/fontkit'
import { prisma } from '../../lib/prisma'

const FONT_PATH = path.join(process.cwd(), 'assets', 'fonts', 'OpenSans-Regular.ttf')
const LOGO_PATH = path.join(process.cwd(), 'assets', 'logo.png')

function formatDate(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`
}

const primary = rgb(0.424, 0.388, 1.0) // #6C63FF
const textDark = rgb(0.102, 0.102, 0.18) // #1A1A2E
const textGray = rgb(0.42, 0.447, 0.502) // #6B7280
const lineGray = rgb(0.9, 0.9, 0.92)
const PAGE = { w: 595, h: 842 }
const MARGIN = 50

interface Party {
  name: string
  email: string
}

// Рисует счёт для ОДНОГО ученика на своей странице (с переносом строк таблицы)
function drawStudentInvoice(
  pdfDoc: PDFDocument,
  font: PDFFont,
  logo: PDFImage | undefined,
  tutor: Party,
  student: { name: string; email: string | null; subject: string | null },
  lessons: Array<{ startTime: Date; status: string; durationMinutes: number; price: number; paymentStatus: string }>,
  from: string,
  to: string,
): void {
  const total = lessons.reduce((s, l) => s + l.price, 0)
  const paid = lessons.filter((l) => l.paymentStatus === 'PAID').reduce((s, l) => s + l.price, 0)
  const debt = total - paid

  let page = pdfDoc.addPage([PAGE.w, PAGE.h])
  const { width, height } = page.getSize()
  let y = height - MARGIN

  // ── Шапка: логотип + Lessonify слева, СЧЁТ справа ──
  if (logo) {
    const lh = 28
    const lw = (lh * logo.width) / logo.height
    page.drawImage(logo, { x: MARGIN, y: y - lh + 3, width: lw, height: lh })
    page.drawText('Lessonify', { x: MARGIN + lw + 9, y: y - 20, size: 19, font, color: primary })
  } else {
    page.drawText('Lessonify', { x: MARGIN, y: y - 20, size: 22, font, color: primary })
  }
  page.drawText('СЧЁТ', { x: width - MARGIN - 80, y: y - 20, size: 22, font, color: textDark })
  y -= 34

  page.drawText(`Дата: ${formatDate(new Date())}`, { x: width - MARGIN - 160, y, size: 10, font, color: textGray })
  y -= 8
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: lineGray })
  y -= 24

  // ── Стороны ──
  const col2 = width / 2 + 10
  page.drawText('Репетитор:', { x: MARGIN, y, size: 9, font, color: textGray })
  page.drawText('Ученик:', { x: col2, y, size: 9, font, color: textGray })
  y -= 16
  page.drawText(tutor.name, { x: MARGIN, y, size: 12, font, color: textDark })
  page.drawText(student.name, { x: col2, y, size: 12, font, color: textDark })
  y -= 14
  page.drawText(tutor.email, { x: MARGIN, y, size: 9, font, color: textGray })
  if (student.email) page.drawText(student.email, { x: col2, y, size: 9, font, color: textGray })
  y -= 16

  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: lineGray })
  y -= 20

  // ── Период / Предмет (без наезда — нормальный межстрочный шаг) ──
  page.drawText(`Период: ${formatDate(new Date(from))} — ${formatDate(new Date(to))}`, { x: MARGIN, y, size: 10, font, color: textGray })
  y -= 16
  if (student.subject) {
    page.drawText(`Предмет: ${student.subject}`, { x: MARGIN, y, size: 10, font, color: textGray })
    y -= 16
  }
  y -= 6

  // ── Заголовки таблицы ──
  const COL = { date: MARGIN, status: MARGIN + 95, dur: MARGIN + 220, price: MARGIN + 310, paid: width - MARGIN - 70 }
  const drawTableHeader = () => {
    page.drawRectangle({ x: MARGIN, y: y - 4, width: width - MARGIN * 2, height: 20, color: rgb(0.96, 0.96, 0.98) })
    const headers: [string, number][] = [
      ['Дата', COL.date], ['Статус', COL.status], ['Длит.', COL.dur], ['Стоимость', COL.price], ['Оплата', COL.paid],
    ]
    for (const [text, x] of headers) page.drawText(text, { x, y, size: 9, font, color: textGray })
    y -= 22
  }
  drawTableHeader()

  // ── Строки ──
  for (const lesson of lessons) {
    const isPaid = lesson.paymentStatus === 'PAID'
    page.drawText(formatDate(new Date(lesson.startTime)), { x: COL.date, y, size: 9, font, color: textDark })
    page.drawText(lesson.status === 'COMPLETED' ? 'Проведён' : 'Запланирован', { x: COL.status, y, size: 9, font, color: textGray })
    page.drawText(`${lesson.durationMinutes} мин`, { x: COL.dur, y, size: 9, font, color: textDark })
    page.drawText(formatMoney(lesson.price), { x: COL.price, y, size: 9, font, color: textDark })
    page.drawText(isPaid ? 'Оплачен' : 'Не оплачен', { x: COL.paid, y, size: 9, font, color: isPaid ? rgb(0.063, 0.725, 0.506) : rgb(0.937, 0.369, 0.267) })
    y -= 5
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.3, color: lineGray })
    y -= 14

    if (y < 120) {
      page = pdfDoc.addPage([PAGE.w, PAGE.h]) // перенос на новую страницу (и продолжаем рисовать на НЕЙ)
      y = PAGE.h - MARGIN
      drawTableHeader()
    }
  }

  // ── Итоги ──
  y -= 10
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: lineGray })
  y -= 20
  const totals: [string, string, boolean][] = [
    ['Итого уроков:', `${lessons.length} шт.`, false],
    ['Сумма:', formatMoney(total), false],
    ['Оплачено:', formatMoney(paid), false],
    ['Задолженность:', formatMoney(debt), true],
  ]
  for (const [label, value, bold] of totals) {
    page.drawText(label, { x: width - MARGIN - 200, y, size: bold ? 11 : 10, font, color: textGray })
    page.drawText(value, { x: width - MARGIN - 80, y, size: bold ? 12 : 10, font, color: bold && debt > 0 ? rgb(0.937, 0.369, 0.267) : textDark })
    y -= 18
  }

  page.drawText('Сформировано в Lessonify', { x: MARGIN, y: 40, size: 8, font, color: rgb(0.8, 0.8, 0.82) })
}

export const invoiceService = {
  // studentId не задан → счёт по ВСЕМ ученикам (по странице на каждого с уроками за период)
  async generate(tutorId: string, studentId: string | undefined, from: string, to: string): Promise<Uint8Array> {
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: { user: { select: { name: true, email: true } } },
    })
    if (!tutor) throw new Error('Tutor not found')

    const students = studentId
      ? await prisma.student.findMany({ where: { id: studentId, tutorId } })
      : await prisma.student.findMany({ where: { tutorId }, orderBy: { name: 'asc' } })
    if (studentId && students.length === 0) throw new Error('Student not found')

    const fromDate = new Date(`${from}T00:00:00`)
    const toDate = new Date(`${to}T23:59:59`)

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit((fontkit as any).default ?? fontkit)

    let font: PDFFont
    try {
      font = await pdfDoc.embedFont(fs.readFileSync(FONT_PATH))
    } catch (err) {
      console.error('[invoice] Не удалось встроить шрифт', FONT_PATH, '—', (err as Error).message)
      throw new Error('Не удалось загрузить шрифт для счёта')
    }

    let logo: PDFImage | undefined
    try {
      logo = await pdfDoc.embedPng(fs.readFileSync(LOGO_PATH))
    } catch {
      logo = undefined // без логотипа — не критично
    }

    // Один запрос на уроки ВСЕХ нужных учеников за период (без N+1) → группируем в памяти
    const allLessons = await prisma.lesson.findMany({
      where: {
        tutorId,
        studentId: { in: students.map((s) => s.id) },
        startTime: { gte: fromDate, lte: toDate },
        status: { in: ['COMPLETED', 'SCHEDULED'] },
      },
      orderBy: { startTime: 'asc' },
    })
    const byStudent = new Map<string, typeof allLessons>()
    for (const l of allLessons) {
      const arr = byStudent.get(l.studentId)
      if (arr) arr.push(l)
      else byStudent.set(l.studentId, [l])
    }

    const tutorParty = { name: tutor.user.name, email: tutor.user.email }
    let drawn = 0
    for (const student of students) {
      const lessons = byStudent.get(student.id) ?? []
      // В режиме «все ученики» пропускаем тех, у кого нет уроков за период
      if (!studentId && lessons.length === 0) continue
      drawStudentInvoice(pdfDoc, font, logo, tutorParty, student, lessons, from, to)
      drawn++
    }

    if (drawn === 0) {
      const page = pdfDoc.addPage([PAGE.w, PAGE.h])
      page.drawText('Нет уроков за выбранный период', { x: MARGIN, y: PAGE.h - 80, size: 14, font, color: textGray })
    }

    return pdfDoc.save()
  },
}
