'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Users, Wallet, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StudentCard } from '@/components/students/student-card'
import { StudentDetailModal } from '@/components/students/student-detail-modal'
import { AddStudentModal } from '@/components/students/add-student-modal'
import { useStudents } from '@/hooks/use-students'
import { formatRub, pluralize } from '@tutorflow/utils'
import { fadeUp } from '@/lib/motion'

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const { students, loading, refetch } = useStudents()

  const filtered = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.subject ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q),
    )
  }, [students, search])

  const stats = useMemo(() => {
    const debtors = students.filter((s) => s.debtAmount > 0)
    const totalDebt = debtors.reduce((sum, s) => sum + s.debtAmount, 0)
    return { total: students.length, totalDebt, debtorsCount: debtors.length }
  }, [students])

  const hasStudents = students.length > 0

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col lg:p-8">
      {/* ── Заголовок ── */}
      <motion.div
        variants={fadeUp(0)}
        initial="hidden"
        animate="show"
        className="flex items-center justify-between gap-3 px-4 pt-5 pb-3 lg:px-0 lg:pt-0"
      >
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-h1">Ученики</h1>
          {!loading && (
            <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
              {stats.total === 0 ? 'Нет учеников' : pluralize(stats.total, ['ученик', 'ученика', 'учеников'])}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0 gap-1.5 px-4">
          <Plus size={15} />
          Добавить
        </Button>
      </motion.div>

      {/* ── Сводка ── */}
      {!loading && hasStudents && (
        <motion.div variants={fadeUp(0.06)} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5 px-4 pb-3 lg:grid-cols-3 lg:px-0">
          <SummaryTile
            icon={<Users size={16} />}
            label="Всего"
            value={String(stats.total)}
          />
          <SummaryTile
            icon={<Wallet size={16} />}
            label="Долги"
            value={formatRub(stats.totalDebt)}
            tone={stats.totalDebt > 0 ? 'danger' : 'default'}
          />
          <SummaryTile
            icon={<AlertCircle size={16} />}
            label="Должников"
            value={String(stats.debtorsCount)}
            tone={stats.debtorsCount > 0 ? 'warning' : 'default'}
            className="col-span-2 lg:col-span-1"
          />
        </motion.div>
      )}

      {/* ── Поиск ── */}
      <motion.div variants={fadeUp(0.12)} initial="hidden" animate="show" className="px-4 pb-3 lg:px-0">
        <div className="relative lg:max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или предмету..."
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Очистить поиск"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Список ── */}
      <motion.div variants={fadeUp(0.18)} initial="hidden" animate="show" className="flex-1 px-4 pb-6 lg:px-0">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[108px] rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-16 text-muted-foreground">
            {search ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
                  <Search size={24} strokeWidth={1.75} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Ничего не найдено</p>
                  <p className="mt-0.5 text-xs">Попробуйте другой запрос</p>
                </div>
              </>
            ) : (
              <button
                onClick={() => setAddOpen(true)}
                className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border-2 border-dashed border-[var(--border-strong)] py-12 transition-colors hover:border-primary hover:text-primary"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
                  <Users size={22} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Нет учеников</p>
                  <p className="mt-0.5 text-xs">Нажмите, чтобы добавить первого</p>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(0.2 + i * 0.04, 0.6), ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <StudentCard student={student} onClick={() => setSelectedId(student.id)} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <StudentDetailModal
        studentId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        onDeleted={refetch}
      />

      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={refetch} />
    </div>
  )
}

function SummaryTile({
  icon,
  label,
  value,
  tone = 'default',
  className,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'default' | 'warning' | 'danger'
  className?: string
}) {
  const toneClasses =
    tone === 'danger'
      ? 'text-danger'
      : tone === 'warning'
        ? 'text-warning'
        : 'text-foreground'

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-card px-3.5 py-3 shadow-elevation-1',
        className ?? '',
      ].join(' ')}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className={['truncate text-base font-bold leading-tight tnum', toneClasses].join(' ')}>{value}</p>
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}
