'use client'

import NextImage from 'next/image'
import { Check, Upload, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

function AvatarImg({ src, alt, size }: { src: string; alt: string; size: number }) {
  const isSvg = src.includes('.svg') || src.includes('dicebear')
  if (isSvg) {
    return <img src={src} alt={alt} width={size} height={size} className="w-full h-full object-cover" />
  }
  return <NextImage src={src} alt={alt} width={size} height={size} className="w-full h-full object-cover" />
}

// 4 варианта аватарок DiceBear (avataaars стиль)
const DICEBEAR_PRESETS = [
  'Felix',
  'Mia',
  'Zara',
  'Leo',
] as const

function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/8.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc&radius=50`
}

interface AvatarPickerProps {
  value: string
  onChange: (url: string) => void
  userName?: string
}

export function AvatarPicker({ value, onChange, userName }: AvatarPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Генерируем 4 варианта: 3 preset + 1 на основе имени пользователя
  const presets = [
    ...DICEBEAR_PRESETS.slice(0, 3).map(dicebearUrl),
    dicebearUrl(userName ?? 'User'),
  ]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('files', file)
      const { data } = await api.post<{ data: { urls: string[] } }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(data.data.urls[0]!)
    } catch {
      // ignore upload error
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-foreground">Выберите аватарку</p>

      {/* Текущий выбор — большой preview */}
      {value && (
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-card">
            <AvatarImg src={value} alt="Аватарка" size={96} />
          </div>
        </div>
      )}

      {/* 4 варианта */}
      <div className="grid grid-cols-4 gap-3">
        {presets.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(url)}
            className={cn(
              'relative rounded-full overflow-hidden border-3 transition-all duration-150',
              value === url ? 'border-primary scale-105' : 'border-transparent',
            )}
          >
            <AvatarImg src={url} alt={`Вариант ${i + 1}`} size={64} />
            {value === url && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Загрузить свою */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading ? 'Загрузка...' : 'Загрузить свою фото'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
