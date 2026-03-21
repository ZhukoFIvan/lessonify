'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Pencil, Trash2, Plus, Check, X, NotebookPen, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLessonNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/use-lesson-notes'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/components/ui/use-toast'
import type { LessonNote } from '@tutorflow/types'

interface LessonNotesPanelProps {
  lessonId: string
}

export function LessonNotesPanel({ lessonId }: LessonNotesPanelProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newText, setNewText] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  const role = useAuthStore((s) => s.user?.role)
  const isTutor = role === 'TUTOR'

  const { notes, loading, refetch } = useLessonNotes(open ? lessonId : null)
  const { createNote, loading: creating } = useCreateNote()
  const { updateNote, loading: updating } = useUpdateNote()
  const { deleteNote, loading: deleting } = useDeleteNote()

  async function handleCreate() {
    if (!newText.trim()) return
    try {
      await createNote(lessonId, newText.trim())
      setNewText('')
      setAddingNew(false)
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить заметку' })
    }
  }

  async function handleUpdate(noteId: string) {
    if (!editText.trim()) return
    try {
      await updateNote(noteId, editText.trim())
      setEditingId(null)
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить заметку' })
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteNote(noteId)
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить заметку' })
    }
  }

  function startEdit(note: LessonNote) {
    setEditingId(note.id)
    setEditText(note.content)
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-1"
      >
        <span className="flex items-center gap-1.5">
          <NotebookPen size={13} />
          Журнал урока
          {notes.length > 0 && (
            <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
              {notes.length}
            </span>
          )}
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              {notes.map((note) => (
                <div key={note.id} className="rounded-xl bg-secondary/50 p-3">
                  {editingId === note.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-xs bg-background border border-border rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-1.5 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>
                          <X size={12} />
                        </Button>
                        <Button size="sm" className="h-7 px-2" onClick={() => handleUpdate(note.id)} disabled={updating}>
                          <Check size={12} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground whitespace-pre-wrap break-words">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(note.createdAt), 'd MMM, HH:mm', { locale: ru })}
                        </p>
                      </div>
                      {isTutor && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(note)}
                            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={deleting}
                            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {notes.length === 0 && !isTutor && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Репетитор ещё не добавил заметки
                </p>
              )}

              {isTutor && (
                addingNew ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Что прошли на уроке..."
                      className="w-full text-xs bg-background border border-border rounded-xl p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-1.5 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setAddingNew(false); setNewText('') }}>
                        <X size={12} />
                      </Button>
                      <Button size="sm" className="h-7 px-3 gap-1" onClick={handleCreate} disabled={creating || !newText.trim()}>
                        <Check size={12} />
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingNew(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    <Plus size={13} />
                    Добавить заметку
                  </button>
                )
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
