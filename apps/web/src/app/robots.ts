import type { MetadataRoute } from 'next'

const BASE_URL = 'https://app.lessonify.ru'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Public, indexable surfaces of the app.
      allow: ['/', '/auth/login', '/offer', '/privacy'],
      // Authenticated application area + API — never crawl.
      disallow: [
        '/dashboard',
        '/students',
        '/teachers',
        '/finances',
        '/homework',
        '/settings',
        '/calendar',
        '/admin',
        '/onboarding',
        '/my',
        '/invite',
        '/api/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
