'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Users, CalendarDays, ChevronRight as ArrowRight } from 'lucide-react'
import { useAdminTutors, type AdminTutorListItem } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'

function PlanBadge({ plan }: { plan: string }) {
  return plan === 'PRO'
    ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">PRO</span>
    : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/8 text-white/35">FREE</span>
}

export default function AdminTutorsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading } = useAdminTutors(search, page)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Репетиторы</h1>
        <p className="text-white/40 text-sm mt-1">{data ? `${data.total} репетиторов` : '—'}</p>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Поиск по имени или email"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-9 pr-4 py-2.5 bg-[#0d0c1d] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-semibold text-white/35 uppercase tracking-wider">
          <span>Репетитор</span>
          <span>Тариф</span>
          <span>Ученики</span>
          <span>Уроки</span>
          <span></span>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {data?.tutors.map((t: AdminTutorListItem) => (
              <Link
                key={t.id}
                href={`/admin/tutors/${t.id}`}
                className={cn(
                  'grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors',
                  t.isBlocked && 'opacity-50',
                )}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                    {t.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.name}</p>
                    <p className="text-white/30 text-xs truncate">
                      {t.email}
                      {t.subjects.length > 0 && <span className="ml-2 text-white/25">· {t.subjects.join(', ')}</span>}
                    </p>
                  </div>
                </div>

                {/* Plan */}
                <PlanBadge plan={t.plan} />

                {/* Students */}
                <span className="flex items-center gap-1.5 text-white/60 text-sm">
                  <Users size={14} className="text-white/30" /> {t.studentsCount}
                </span>

                {/* Lessons */}
                <span className="flex items-center gap-1.5 text-white/60 text-sm">
                  <CalendarDays size={14} className="text-white/30" /> {t.lessonsCount}
                </span>

                <ArrowRight size={16} className="text-white/25" />
              </Link>
            ))}

            {data?.tutors.length === 0 && (
              <p className="text-white/30 text-sm text-center py-10">Репетиторы не найдены</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-white/35 text-sm">Страница {data.page} из {data.pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="w-9 h-9 rounded-xl border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
