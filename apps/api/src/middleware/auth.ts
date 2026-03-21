import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import type { AuthTokenPayload } from '@tutorflow/types'

// Расширяем типы Express
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    req.user = verifyAccessToken(authHeader.slice(7))
    next()
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' })
  }
}

export function requireTutor(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'TUTOR') {
    res.status(403).json({ error: 'Forbidden: tutor role required' })
    return
  }
  next()
}

export function requireStudent(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'STUDENT') {
    res.status(403).json({ error: 'Forbidden: student role required' })
    return
  }
  next()
}
