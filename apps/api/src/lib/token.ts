import crypto from 'crypto'
import type { CookieOptions } from 'express'

export const REFRESH_COOKIE = 'tf_refresh'

export const REFRESH_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_EXPIRES_MS,
  path: '/',
}

export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  ...COOKIE_OPTIONS,
  maxAge: 0,
}

/** Криптографически стойкий случайный токен */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

/** SHA-256 хэш токена для хранения в БД */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getRefreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_EXPIRES_MS)
}
