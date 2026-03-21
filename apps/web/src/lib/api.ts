import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
})

// ── Token refresh queue ───────────────────────────────────────────────────────
// Очередь запросов, ожидающих обновления токена.
// Решает race condition когда несколько запросов 401 идут одновременно.

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
  failedQueue = []
}

// ── Request interceptor — подставляем access token ────────────────────────────

api.interceptors.request.use((config) => {
  // Импорт store делаем лениво чтобы избежать circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('@/store/auth.store') as typeof import('@/store/auth.store')
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — refresh on 401 ────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    const status = error.response?.status

    // Не пытаемся рефрешить сам запрос на refresh и на логин
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/login')

    if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Ставим запрос в очередь — он продолжится после получения нового токена
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest!)
          })
          .catch(Promise.reject)
      }

      originalRequest!._retry = true
      isRefreshing = true

      try {
        // Вызываем Next.js API route который читает tf_refresh cookie и проксирует на бэкенд
        const { data } = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true,
        })
        const newToken: string = data.data.accessToken

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require('@/store/auth.store') as typeof import('@/store/auth.store')
        useAuthStore.getState().setAccessToken(newToken)

        processQueue(null, newToken)

        if (originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return api(originalRequest!)
      } catch (refreshError) {
        processQueue(refreshError, null)

        // Refresh провалился — разлогиниваем
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require('@/store/auth.store') as typeof import('@/store/auth.store')
        useAuthStore.getState().logout()

        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
