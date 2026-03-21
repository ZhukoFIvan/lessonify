import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function POST(req: NextRequest) {
  try {
    // Cookie называется tf_refresh (как задано в бэкенде)
    const refreshToken = req.cookies.get('tf_refresh')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    // Вызываем бэкенд, передавая cookie с правильным именем
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `tf_refresh=${refreshToken}`,
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Refresh failed' }, { status: res.status })
    }

    const data = await res.json()

    // Получаем новый Set-Cookie header от бэкенда (обновлённый tf_refresh)
    const setCookie = res.headers.get('set-cookie')
    const response = NextResponse.json(data)

    if (setCookie) {
      response.headers.set('Set-Cookie', setCookie)
    }

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
