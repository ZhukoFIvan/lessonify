'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { GraduationCap, Link2, Loader2, BookOpen } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyTutors, useAcceptInvite } from '@/hooks/use-students'
import { getInitials } from '@tutorflow/utils'
import { useFormatters } from '@/i18n/use-formatters'
import { toast } from '@/components/ui/use-toast'
import { fadeUp, cappedDelay } from '@/lib/motion'

export default function TeachersPage() {
  const t = useTranslations('teachers')
  const f = useFormatters()
  const { tutors, loading, refetch } = useMyTutors()
  const { acceptInvite, loading: accepting } = useAcceptInvite()
  const [inviteInput, setInviteInput] = useState('')
  const [showInput, setShowInput] = useState(false)

  async function handleAccept() {
    if (!inviteInput.trim()) return
    try {
      await acceptInvite(inviteInput.trim())
      toast({ variant: 'success', title: t('toastAdded') })
      setInviteInput('')
      setShowInput(false)
      refetch()
    } catch (err: any) {
      const message = err?.response?.data?.error || t('addError')
      toast({ variant: 'destructive', title: t('error'), description: message })
    }
  }

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      <motion.div variants={fadeUp(0)} initial="hidden" animate="show" className="flex items-center justify-between px-4 lg:px-0 pt-5 lg:pt-0 pb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{t('title')}</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {tutors.length === 0
                ? t('noneConnected')
                : f.count(tutors.length, 'teachers')}
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" className="gap-2" onClick={() => setShowInput((v) => !v)}>
          <Link2 size={15} />
          {t('add')}
        </Button>
      </motion.div>

      {/* Блок добавления по ссылке */}
      {showInput && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 lg:mx-0 mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <p className="text-sm font-semibold text-foreground mb-1">{t('addByLink')}</p>
          <p className="text-xs text-muted-foreground mb-3">
            {t('addByLinkHint')}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://app.lessonify.ru/invite/..."
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAccept()}
              className="flex-1 h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={accepting || !inviteInput.trim()}
              className="px-4"
            >
              {accepting ? <Loader2 size={15} className="animate-spin" /> : t('add')}
            </Button>
          </div>
          <button
            onClick={() => { setShowInput(false); setInviteInput('') }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            {t('cancel')}
          </button>
        </motion.div>
      )}

      {/* Список преподавателей */}
      <div className="px-4 lg:px-0 flex flex-col gap-3">
        {loading ? (
          <>
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </>
        ) : tutors.length === 0 ? (
          <motion.div variants={fadeUp(0.1)} initial="hidden" animate="show">
            <div className="rounded-2xl border-2 border-dashed border-border py-14 flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                <GraduationCap size={26} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{t('emptyTitle')}</p>
                <p className="text-xs mt-1 text-muted-foreground/70">
                  {t('emptyHint')}
                </p>
              </div>
              <Button size="sm" variant="secondary" className="gap-2 mt-1" onClick={() => setShowInput(true)}>
                <Link2 size={14} />
                {t('pasteLink')}
              </Button>
            </div>
          </motion.div>
        ) : (
          tutors.map((item, i) => (
            <motion.div key={item.studentRecordId} variants={fadeUp(cappedDelay(i))} initial="hidden" animate="show">
              <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
                <Avatar className="w-14 h-14 shrink-0">
                  <AvatarImage src={item.tutor.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-base font-bold text-white bg-primary">
                    {getInitials(item.tutor.user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.tutor.user.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.subject && (
                      <Badge variant="secondary" className="text-xs">{item.subject}</Badge>
                    )}
                    {item.tutor.subjects?.length > 0 && !item.subject && (
                      <Badge variant="secondary" className="text-xs">{item.tutor.subjects[0]}</Badge>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">{item.lessonsCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.count(item.lessonsCount, 'lessons')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
