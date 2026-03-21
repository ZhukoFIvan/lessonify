import * as fs from 'fs'
import * as path from 'path'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as fontkit from '@pdf-lib/fontkit'
import { prisma } from '../../lib/prisma'

const FONT_PATH = path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Regular.ttf')

function formatDate(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} \u20BD`
}

export const invoiceService = {
  async generate(tutorId: string, studentId: string, from: string, to: string): Promise<Uint8Array> {
    // Загружаем данные
    const [tutor, student, lessons] = await Promise.all([
      prisma.tutor.findUnique({
        where: { id: tutorId },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.student.findFirst({
        where: { id: studentId, tutorId },
      }),
      prisma.lesson.findMany({
        where: {
          tutorId,
          studentId,
          startTime: {
            gte: new Date(`${from}T00:00:00`),
            lte: new Date(`${to}T23:59:59`),
          },
          status: { in: ['COMPLETED', 'SCHEDULED'] },
        },
        orderBy: { startTime: 'asc' },
      }),
    ])

    if (!tutor) throw new Error('Tutor not found')
    if (!student) throw new Error('Student not found')

    const total = lessons.reduce((sum, l) => sum + l.price, 0)
    const paid = lessons.filter((l) => l.paymentStatus === 'PAID').reduce((s, l) => s + l.price, 0)
    const debt = total - paid

    // Создаём PDF
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    // Загружаем Roboto с Кириллицей
    let font
    try {
      const fontBytes = fs.readFileSync(FONT_PATH)
      font = await pdfDoc.embedFont(fontBytes)
    } catch {
      // Fallback на стандартный шрифт (без кириллицы)
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    }

    const page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()
    const margin = 50

    const primary = rgb(0.424, 0.388, 1.0) // #6C63FF
    const textDark = rgb(0.102, 0.102, 0.18) // #1A1A2E
    const textGray = rgb(0.42, 0.447, 0.502) // #6B7280
    const lineGray = rgb(0.9, 0.9, 0.92)

    let y = height - margin

    // ── Заголовок ──────────────────────────────────────────────────────────────
    page.drawText('TutorFlow', { x: margin, y, size: 22, font, color: primary })
    page.drawText('СЧЁТ', { x: width - margin - 80, y, size: 22, font, color: textDark })
    y -= 28

    page.drawText(`Дата: ${formatDate(new Date())}`, {
      x: width - margin - 160, y, size: 10, font, color: textGray,
    })
    y -= 6

    // Горизонтальная линия
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lineGray })
    y -= 24

    // ── Стороны ────────────────────────────────────────────────────────────────
    const col2 = width / 2 + 10

    page.drawText('Репетитор:', { x: margin, y, size: 9, font, color: textGray })
    page.drawText('Ученик:', { x: col2, y, size: 9, font, color: textGray })
    y -= 16

    page.drawText(tutor.user.name, { x: margin, y, size: 12, font, color: textDark })
    page.drawText(student.name, { x: col2, y, size: 12, font, color: textDark })
    y -= 14

    page.drawText(tutor.user.email, { x: margin, y, size: 9, font, color: textGray })
    if (student.email) {
      page.drawText(student.email, { x: col2, y, size: 9, font, color: textGray })
    }
    y -= 8

    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: lineGray })
    y -= 20

    // ── Период ─────────────────────────────────────────────────────────────────
    page.drawText(
      `Период: ${formatDate(new Date(from))} — ${formatDate(new Date(to))}`,
      { x: margin, y, size: 10, font, color: textGray },
    )
    y -= 6

    if (student.subject) {
      page.drawText(`Предмет: ${student.subject}`, { x: margin, y, size: 10, font, color: textGray })
    }
    y -= 20

    // ── Заголовки таблицы ──────────────────────────────────────────────────────
    const COL = { date: margin, status: margin + 95, dur: margin + 220, price: margin + 310, paid: width - margin - 70 }

    page.drawRectangle({
      x: margin, y: y - 4,
      width: width - margin * 2, height: 20,
      color: rgb(0.96, 0.96, 0.98),
    })

    const headers = [
      ['Дата', COL.date],
      ['Статус', COL.status],
      ['Длит.', COL.dur],
      ['Стоимость', COL.price],
      ['Оплата', COL.paid],
    ] as [string, number][]

    for (const [text, x] of headers) {
      page.drawText(text, { x, y, size: 9, font, color: textGray })
    }
    y -= 22

    // ── Строки уроков ──────────────────────────────────────────────────────────
    for (const lesson of lessons) {
      const isPaid = lesson.paymentStatus === 'PAID'

      page.drawText(formatDate(new Date(lesson.startTime)), { x: COL.date, y, size: 9, font, color: textDark })
      page.drawText(lesson.status === 'COMPLETED' ? 'Проведён' : 'Запланирован', { x: COL.status, y, size: 9, font, color: textGray })
      page.drawText(`${lesson.durationMinutes} мин`, { x: COL.dur, y, size: 9, font, color: textDark })
      page.drawText(formatMoney(lesson.price), { x: COL.price, y, size: 9, font, color: textDark })
      page.drawText(isPaid ? 'Оплачен' : 'Не оплачен', {
        x: COL.paid, y, size: 9, font,
        color: isPaid ? rgb(0.063, 0.725, 0.506) : rgb(0.937, 0.369, 0.267),
      })

      y -= 5
      page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.3, color: lineGray })
      y -= 14

      // Новая страница если места мало
      if (y < 120) {
        pdfDoc.addPage([595, 842])
        y = 842 - margin
      }
    }

    // ── Итоги ──────────────────────────────────────────────────────────────────
    y -= 10
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lineGray })
    y -= 20

    const totals: [string, string, boolean][] = [
      ['Итого уроков:', `${lessons.length} шт.`, false],
      ['Сумма:', formatMoney(total), false],
      ['Оплачено:', formatMoney(paid), false],
      ['Задолженность:', formatMoney(debt), true],
    ]

    for (const [label, value, bold] of totals) {
      page.drawText(label, { x: width - margin - 200, y, size: bold ? 11 : 10, font, color: textGray })
      page.drawText(value, {
        x: width - margin - 80, y, size: bold ? 12 : 10, font,
        color: bold && debt > 0 ? rgb(0.937, 0.369, 0.267) : textDark,
      })
      y -= 18
    }

    y -= 10
    page.drawText('Сформировано в TutorFlow', { x: margin, y: 40, size: 8, font, color: rgb(0.8, 0.8, 0.82) })

    return pdfDoc.save()
  },
}
