'use client'

import { Send, Link2, GraduationCap, BookOpen, Hourglass, TrendingUp, MousePointerClick } from 'lucide-react'
import { useAdminBotStats } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'

function StatCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl p-5">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', color)}>{icon}</div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-xs font-medium text-white/45 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  )
}

export default function AdminBotPage() {
  const { stats, loading } = useAdminBotStats()

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-white/5 rounded-xl mb-8 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    { label: 'Нажали /start', value: stats.botStarted, icon: <MousePointerClick size={18} className="text-pink-400" />, color: 'bg-pink-500/15', sub: `${stats.botStartsTotal} нажатий всего` },
    { label: 'Старт → привязка', value: `${stats.startToLinkedConversion}%`, icon: <TrendingUp size={18} className="text-emerald-400" />, color: 'bg-emerald-500/15', sub: `${stats.linked} из ${stats.botStarted}` },
    { label: 'Подключено', value: stats.linked, icon: <Send size={18} className="text-blue-400" />, color: 'bg-blue-500/15', sub: `из ${stats.total} привязок` },
    { label: 'Конверсия репетиторов', value: `${stats.tutorConversion}%`, icon: <TrendingUp size={18} className="text-primary" />, color: 'bg-primary/15', sub: `${stats.tutorConnections} из ${stats.totalTutors}` },
    { label: 'Репетиторы', value: stats.tutorConnections, icon: <GraduationCap size={18} className="text-violet-400" />, color: 'bg-violet-500/15' },
    { label: 'Ученики', value: stats.studentConnections, icon: <BookOpen size={18} className="text-cyan-400" />, color: 'bg-cyan-500/15' },
    { label: 'Активных привязок', value: stats.linked, icon: <Link2 size={18} className="text-green-400" />, color: 'bg-green-500/15' },
    { label: 'Незавершённых', value: stats.pendingCodes, icon: <Hourglass size={18} className="text-amber-400" />, color: 'bg-amber-500/15', sub: 'код выдан, бот не привязан' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Telegram-бот</h1>
        <p className="text-white/40 text-sm mt-1">Подключения и активность</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Recent connections */}
      <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-bold text-sm">Недавние подключения</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {stats.recent.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                c.target.type === 'tutor' ? 'bg-violet-500/15 text-violet-400' : 'bg-cyan-500/15 text-cyan-400',
              )}>
                {c.target.type === 'tutor' ? <GraduationCap size={15} /> : <BookOpen size={15} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {c.target.name ?? c.firstName ?? 'Без имени'}
                  {c.username && <span className="text-white/35 font-normal ml-1.5">@{c.username}</span>}
                </p>
                <p className="text-white/35 text-xs truncate">
                  {c.target.type === 'tutor' ? 'Репетитор' : 'Ученик'}
                  {c.target.email ? ` · ${c.target.email}` : ''}
                </p>
              </div>
              <span className="text-white/30 text-xs shrink-0">
                {new Date(c.connectedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
          {stats.recent.length === 0 && (
            <p className="px-5 py-6 text-white/30 text-sm text-center">Подключений пока нет</p>
          )}
        </div>
      </div>
    </div>
  )
}
