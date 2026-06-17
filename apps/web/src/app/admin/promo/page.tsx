'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Tag, ToggleLeft, ToggleRight, Copy } from 'lucide-react'
import api from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface PromoCode {
  id: string
  code: string
  description: string | null
  daysToAdd: number
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('admin')
  const [form, setForm] = useState({ code: '', description: '', daysToAdd: '30', maxUses: '', expiresAt: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.code || !form.daysToAdd) return
    setLoading(true)
    try {
      await api.post('/admin/promo', {
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        daysToAdd: Number(form.daysToAdd),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      })
      toast({ variant: 'success', title: t('promo.created') })
      onCreated()
      onClose()
    } catch (e: any) {
      toast({ variant: 'destructive', title: e.response?.data?.error ?? t('promo.error') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0d0c1d] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-bold text-white text-lg">{t('promo.newTitle')}</h3>
        {(
          [
            { label: t('promo.fields.code'), key: 'code' as const, placeholder: 'BLOGGER2024', type: 'text', upper: true },
            { label: t('promo.fields.description'), key: 'description' as const, placeholder: t('promo.fields.descriptionPlaceholder'), type: 'text', upper: false },
            { label: t('promo.fields.daysToAdd'), key: 'daysToAdd' as const, placeholder: '30', type: 'number', upper: false },
            { label: t('promo.fields.maxUses'), key: 'maxUses' as const, placeholder: t('promo.fields.maxUsesPlaceholder'), type: 'number', upper: false },
            { label: t('promo.fields.expiresAt'), key: 'expiresAt' as const, placeholder: '', type: 'date', upper: false },
          ]
        ).map(({ label, key, placeholder, type, upper }) => (
          <div key={key}>
            <label className="text-xs text-gray-400 block mb-1">{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: upper ? e.target.value.toUpperCase() : e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50"
            />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading || !form.code || !form.daysToAdd} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? t('promo.creating') : t('promo.create')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PromoPage() {
  const t = useTranslations('admin')
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const refetch = useCallback(() => {
    setLoading(true)
    api.get('/admin/promo').then(r => setCodes(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const toggle = async (id: string, isActive: boolean) => {
    await api.patch(`/admin/promo/${id}/toggle`, { isActive: !isActive })
    refetch()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: t('promo.copied') })
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">{t('promo.title')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t('promo.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={16} /> {t('promo.create')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
      ) : codes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Tag size={32} className="mx-auto mb-3 opacity-30" />
          <p>{t('promo.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map(promo => (
            <div key={promo.id} className={cn('flex items-center gap-4 px-4 py-3 rounded-xl border transition-opacity', promo.isActive ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">{promo.code}</span>
                  <button onClick={() => copyCode(promo.code)} className="text-gray-500 hover:text-gray-300 transition-colors">
                    <Copy size={12} />
                  </button>
                  {!promo.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{t('promo.inactive')}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('promo.daysProPlus', { count: promo.daysToAdd })} · {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ''} {t('promo.usesLabel', { count: promo.usedCount })}
                  {promo.description ? ` · ${promo.description}` : ''}
                  {promo.expiresAt ? ` · ${t('promo.until', { date: new Date(promo.expiresAt).toLocaleDateString('ru') })}` : ''}
                </p>
              </div>
              <button onClick={() => toggle(promo.id, promo.isActive)} className="text-gray-400 hover:text-white transition-colors">
                {promo.isActive ? <ToggleRight size={22} className="text-primary" /> : <ToggleLeft size={22} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={refetch} />}
    </div>
  )
}
