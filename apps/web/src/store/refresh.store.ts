import { create } from 'zustand'

// Глобальный «тик свежести» данных. Бампается при возврате на вкладку / онлайне /
// по лёгкому интервалу (см. AutoRefresh), и хуки данных тихо перезапрашиваются.
// Позже сюда же можно дёргать bump() из SSE/WebSocket-события — хуки не меняются.
interface RefreshState {
  tick: number
  bump: () => void
}

export const useRefreshStore = create<RefreshState>((set) => ({
  tick: 0,
  bump: () => set((s) => ({ tick: s.tick + 1 })),
}))
