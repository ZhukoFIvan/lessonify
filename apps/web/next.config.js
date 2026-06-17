const withPWA = require('next-pwa')
const createNextIntlPlugin = require('next-intl/plugin')

// Локаль вычисляется на запрос из куки/Accept-Language — i18n-роутинга (/ru, /en) нет.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Удалять устаревшие precache от прошлых сборок при активации нового SW —
  // иначе на устройстве копятся старые манифесты и приложение «зависает» на
  // ссылках на удалённые чанки (классический баг застрявшего PWA).
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/students/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-students',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /\/api\/lessons/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-lessons',
        expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 5,
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Оптимизированный Docker-образ
  transpilePackages: ['@tutorflow/types', '@tutorflow/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.lessonify.ru' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  experimental: {},
}

module.exports = withNextIntl(pwaConfig(nextConfig))
