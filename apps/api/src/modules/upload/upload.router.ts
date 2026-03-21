import { Router } from 'express'
import type { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { randomBytes } from 'crypto'
import { requireAuth } from '../../middleware/auth'

export const uploadRouter = Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'))
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = randomBytes(16).toString('hex')
    cb(null, `${name}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt/
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
    if (ok) cb(null, true)
    else cb(new Error('Недопустимый тип файла'))
  },
})

// POST /upload — загрузить файлы (до 5 штук)
uploadRouter.post(
  '/',
  requireAuth,
  upload.array('files', 5),
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Файлы не переданы' })
      return
    }

    const baseUrl = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`
    const urls = files.map((f) => `${baseUrl}/uploads/${f.filename}`)
    res.json({ data: { urls } })
  },
)
