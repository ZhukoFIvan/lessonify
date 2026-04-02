'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StudentCard } from '@/components/students/student-card'
import { StudentDetailModal } from '@/components/students/student-detail-modal'
import { AddStudentModal } from '@/components/students/add-student-modal'
import { useStudents } from '@/hooks/use-students'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
})

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

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between px-4 lg:px-0 pt-5 lg:pt-0 pb-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Ученики</h1>
          {!loading && (
            <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
              {students.length === 0 ? 'Нет учеников' : `${students.length} чел.`}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 px-4">
          <Plus size={15} />
          Добавить
        </Button>
      </motion.div>

      <motion.div {...fadeUp(0.08)} className="px-4 lg:px-0 pb-3">
        <div className="relative lg:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или предмету..."
            className="pl-9"
          />
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.16)} className="flex-1 px-4 lg:px-0 pb-4">
        {loading ? (
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[72px] rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-4 text-muted-foreground">
            {search ? (
              <>
                <Search size={40} strokeWidth={1.5} />
                <div className="text-center">
                  <p className="font-medium text-sm">Ничего не найдено</p>
                  <p className="text-xs mt-0.5">Попробуйте другой запрос</p>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAddOpen(true)}
                  className="w-full max-w-md rounded-2xl border-2 border-dashed border-border py-10 flex flex-col items-center gap-3 transition-colors hover:border-primary hover:text-primary"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Users size={22} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Нет учеников</p>
                    <p className="text-xs mt-0.5">Нажмите, чтобы добавить</p>
                  </div>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 + i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <StudentCard
                  student={student}
                  onClick={() => setSelectedId(student.id)}
                />
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

      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={refetch}
      />
    </div>
  )
}
