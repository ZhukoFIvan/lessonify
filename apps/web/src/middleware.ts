import { NextRequest, NextResponse } from 'next/server'

// Защищённые роуты — требуют авторизации
const PROTECTED = [
  '/dashboard',
  '/calendar',
  '/students',
  '/finances',
  '/settings',
  '/onboarding',
  '/my',
  '/admin',
]

// Роуты только для гостей — авторизованных редиректим на dashboard
const GUEST_ONLY = ['/auth/login', '/auth/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Проверяем наличие refresh token cookie
  // Если tf_refresh есть — пользователь авторизован (токен может обновиться на клиенте)
  const hasRefreshToken = !!req.cookies.get('tf_refresh')?.value

  const isProtected = PROTECTED.some((path) => pathname.startsWith(path))
  const isGuestOnly = GUEST_ONLY.some((path) => pathname.startsWith(path))

  // Защищённый роут без авторизации → на логин
  if (isProtected && !hasRefreshToken) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Авторизованный пользователь идёт на логин → на dashboard
  if (isGuestOnly && hasRefreshToken) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/calendar/:path*',
    '/students/:path*',
    '/finances/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/my/:path*',
    '/admin/:path*',
    '/auth/login',
    '/auth/register',
  ],
}
