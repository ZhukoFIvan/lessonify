import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('tf_refresh')?.value

    if (refreshToken) {
      // Отзываем refresh token на бэкенде
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `tf_refresh=${refreshToken}`,
        },
      })
    }

    // Удаляем cookie из браузера
    const response = NextResponse.json({ data: { message: 'Выход выполнен' } })
    response.cookies.delete('tf_refresh')

    return response
  } catch {
    // Даже если бэкенд недоступен, чистим cookie
    const response = NextResponse.json({ data: { message: 'Выход выполнен' } })
    response.cookies.delete('tf_refresh')
    return response
  }
}
