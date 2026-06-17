'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Users, CalendarDays, CheckCircle, DollarSign, BookOpen } from 'lucide-react'
import { useAdminTutor } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl p-5">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', color)}>{icon}</div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-xs font-medium text-white/45 uppercase tracking-wider">{label}</div>
    </div>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  return plan === 'PRO'
    ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">PRO</span>
    : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/8 text-white/35">FREE</span>
}

export default function AdminTutorDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('admin')
  const { tutor, loading } = useAdminTutor(params.id)

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-white/5 rounded-xl mb-8 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="p-8">
        <Link href="/admin/tutors" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft size={16} /> {t('tutorDetail.back')}
        </Link>
        <p className="text-white/30 text-sm">{t('tutorDetail.notFound')}</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/admin/tutors" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
        <ArrowLeft size={16} /> {t('tutorDetail.back')}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400 text-xl font-black shrink-0">
          {tutor.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white truncate">{tutor.name}</h1>
            <PlanBadge plan={tutor.plan} />
            {tutor.isBlocked && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">{t('blockedShort')}</span>
            )}
          </div>
          <p className="text-white/40 text-sm mt-0.5">
            {tutor.email}
            {tutor.subjects.length > 0 && <span className="ml-2 text-white/30">· {tutor.subjects.join(', ')}</span>}
          </p>
          <p className="text-white/25 text-xs mt-0.5">
            {t('tutorDetail.registered', { date: new Date(tutor.createdAt).toLocaleDateString('ru') })}
            {tutor.plan === 'PRO' && tutor.planExpiresAt && (
              <span className="ml-2">· {t('tutorDetail.proUntil', { date: new Date(tutor.planExpiresAt).toLocaleDateString('ru') })}</span>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('tutorDetail.stats.students')} value={tutor.students.length} icon={<Users size={18} className="text-cyan-400" />} color="bg-cyan-500/15" />
        <StatCard label={t('tutorDetail.stats.lessons')} value={tutor.lessonsCount} icon={<CalendarDays size={18} className="text-sky-400" />} color="bg-sky-500/15" />
        <StatCard label={t('tutorDetail.stats.completed')} value={tutor.completedCount} icon={<CheckCircle size={18} className="text-green-400" />} color="bg-green-500/15" />
        <StatCard label={t('tutorDetail.stats.revenue')} value={`${Number(tutor.revenue).toLocaleString('ru')} ₽`} icon={<DollarSign size={18} className="text-emerald-400" />} color="bg-emerald-500/15" />
      </div>

      {/* Students */}
      <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-bold text-sm">{t('tutorDetail.studentsHeading', { count: tutor.students.length })}</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {tutor.students.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {s.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{s.name}</p>
                <p className="text-white/35 text-xs truncate">
                  {s.email ?? t('tutorDetail.noEmail')}
                  {s.subject && <span className="ml-2">· {s.subject}</span>}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-white/50 text-sm shrink-0">
                <BookOpen size={14} className="text-white/30" /> {t('tutorDetail.lessonsCount', { count: s.lessonsCount })}
              </span>
            </div>
          ))}
          {tutor.students.length === 0 && (
            <p className="px-5 py-8 text-white/30 text-sm text-center">{t('tutorDetail.noStudents')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
