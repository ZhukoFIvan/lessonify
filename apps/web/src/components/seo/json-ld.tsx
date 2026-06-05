/**
 * Minimal, dependency-free JSON-LD typing.
 * (Avoids pulling in `schema-dts`; values below are validated against
 * schema.org / Google's SoftwareApplication & Organization specs.)
 */
type JsonLdValue = string | number | boolean | null | JsonLdObject | JsonLdValue[]
interface JsonLdObject {
  [key: string]: JsonLdValue
}

/**
 * Renders a JSON-LD <script> tag. Server-component friendly (no client JS).
 */
export function JsonLd({ data }: { data: JsonLdObject }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; no user input is interpolated.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export const organizationLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://lessonify.ru/#organization',
  name: 'Lessonify',
  alternateName: 'Лессонифай',
  url: 'https://lessonify.ru/',
  logo: 'https://lessonify.ru/logo.png',
  email: 'jukov0411200303@gmail.com',
  telephone: '+7-925-457-12-10',
  founder: {
    '@type': 'Person',
    name: 'Жуков Иван Андреевич',
  },
}

export const softwareApplicationLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Lessonify',
  alternateName: 'Лессонифай',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'CRM для репетиторов',
  operatingSystem: 'Web, Android, iOS',
  url: 'https://lessonify.ru/',
  description:
    'CRM для частных репетиторов: расписание, учёт учеников и оплат, домашние задания, финансовая аналитика, Telegram-напоминания, голосовое добавление уроков, синхронизация с Google Calendar.',
  inLanguage: 'ru-RU',
  featureList: [
    'Расписание занятий',
    'Ученики и CRM',
    'Учёт оплат и долгов',
    'Домашние задания',
    'Финансовая аналитика',
    'Telegram-напоминания',
    'Голосовое добавление уроков (AI)',
    'Синхронизация с Google Calendar',
    'Студенческий портал',
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'RUB',
      description: 'До 5 учеников бесплатно',
    },
    {
      '@type': 'Offer',
      name: 'PRO (месяц)',
      price: '499',
      priceCurrency: 'RUB',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '499',
        priceCurrency: 'RUB',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitCode: 'MON',
        },
      },
    },
    {
      '@type': 'Offer',
      name: 'PRO (год)',
      price: '3990',
      priceCurrency: 'RUB',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '3990',
        priceCurrency: 'RUB',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitCode: 'ANN',
        },
      },
    },
  ],
}
