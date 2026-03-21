import { create } from 'zustand'

type NavTab = 'dashboard' | 'calendar' | 'students' | 'finances' | 'settings'

interface UiState {
  // Bottom navigation
  activeTab: NavTab
  setActiveTab: (tab: NavTab) => void

  // Модальное окно добавления урока
  addLessonOpen: boolean
  openAddLesson: () => void
  closeAddLesson: () => void

  // Выбранная дата в календаре
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (activeTab) => set({ activeTab }),

  addLessonOpen: false,
  openAddLesson: () => set({ addLessonOpen: true }),
  closeAddLesson: () => set({ addLessonOpen: false }),

  selectedDate: new Date(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}))
