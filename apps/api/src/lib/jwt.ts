import jwt from 'jsonwebtoken'
import type { AuthTokenPayload } from '@tutorflow/types'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret'
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES ?? '15m'

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload
}
