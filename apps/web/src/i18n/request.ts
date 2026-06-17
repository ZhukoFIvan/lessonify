import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE } from './config'
import { resolveLocale } from './resolve-locale'

// Конфигурация next-intl в режиме «без i18n-роутинга»: локаль не зашита в URL,
// а вычисляется на каждый запрос из куки и Accept-Language (см. resolveLocale).
// Чтение cookies()/headers() делает страницы динамическими — для авторизованного
// PWA это и так норма.
export default getRequestConfig(async () => {
  const locale = resolveLocale({
    cookie: cookies().get(LOCALE_COOKIE)?.value,
    acceptLanguage: headers().get('accept-language'),
  })

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // Не валим рендер из-за случайно отсутствующего ключа — показываем сам ключ.
    getMessageFallback: ({ key }) => key,
  }
})
