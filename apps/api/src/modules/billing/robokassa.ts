import crypto from 'crypto'

function md5(str: string): string {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase()
}

const cfg = {
  login: () => process.env.ROBOKASSA_LOGIN ?? '',
  pass1: () => process.env.ROBOKASSA_PASS1 ?? '',
  pass2: () => process.env.ROBOKASSA_PASS2 ?? '',
  isTest: () => process.env.ROBOKASSA_TEST === '1',
}

interface PaymentParams {
  amount: number
  invId: number
  description: string
  email: string
  userId: string
  period: string
  successUrl: string
  failUrl: string
}

// Robokassa signature includes shp_ params sorted alphabetically
function shpString(prefix: 'shp' | 'Shp', userId: string, period: string): string {
  const entries: [string, string][] = [
    [`${prefix}_period`, period],
    [`${prefix}_userId`, userId],
  ]
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(':')
}

export function buildPaymentUrl(params: PaymentParams): string {
  const shp = shpString('shp', params.userId, params.period)
  const sig = md5(`${cfg.login()}:${params.amount.toFixed(2)}:${params.invId}:${cfg.pass1()}:${shp}`)

  const url = new URL('https://auth.robokassa.ru/Merchant/Index.aspx')
  url.searchParams.set('MerchantLogin', cfg.login())
  url.searchParams.set('OutSum', params.amount.toFixed(2))
  url.searchParams.set('InvId', String(params.invId))
  url.searchParams.set('Description', params.description)
  url.searchParams.set('SignatureValue', sig)
  url.searchParams.set('Email', params.email)
  // SuccessURL/FailURL НЕ передаём в ссылке: Robokassa при методе GET запрещает
  // параметры в этих URL, а наш /settings?payment=... их содержит. Берём адреса
  // возврата из настроек магазина (Технические настройки → Success/Fail URL =
  // https://app.lessonify.ru/settings). Robokassa сама допишет InvId/OutSum/SignatureValue.
  url.searchParams.set('Culture', 'ru')
  url.searchParams.set('Encoding', 'utf-8')
  if (cfg.isTest()) url.searchParams.set('IsTest', '1')
  url.searchParams.set('shp_period', params.period)
  url.searchParams.set('shp_userId', params.userId)

  return url.toString()
}

export interface WebhookResult {
  valid: boolean
  userId: string
  period: string
  invId: number
  outSum: number // фактически оплаченная сумма (рубли)
}

export function verifyWebhook(body: Record<string, string>): WebhookResult {
  // Robokassa может присылать ключи в разном регистре — читаем без учёта регистра.
  const get = (name: string): string => {
    const key = Object.keys(body).find((k) => k.toLowerCase() === name.toLowerCase())
    return key ? (body[key] ?? '') : ''
  }
  const outSum = get('OutSum')
  const invId = get('InvId')
  const sign = get('SignatureValue').toUpperCase()
  const userId = get('Shp_userId')
  const period = get('Shp_period')

  // Кастомные shp_-параметры берём ровно как прислала Robokassa (её регистр),
  // сортируем по имени — так же, как она считает подпись для Result URL.
  const shpKeys = Object.keys(body)
    .filter((k) => /^shp_/i.test(k))
    .sort()
  const shp = shpKeys.map((k) => `${k}=${body[k]}`).join(':')
  const base = shp
    ? `${outSum}:${invId}:${cfg.pass2()}:${shp}`
    : `${outSum}:${invId}:${cfg.pass2()}`
  const expected = md5(base)
  const valid = expected === sign

  if (!valid) {
    // Диагностика без утечки пароля: какой алгоритм реально совпадает с подписью.
    const algoMatch = ['md5', 'sha1', 'sha256', 'sha384', 'sha512'].filter(
      (a) => crypto.createHash(a).update(base, 'utf8').digest('hex').toUpperCase() === sign,
    )
    console.error('[robokassa.verify] signature mismatch', {
      got: sign,
      expectedMd5: expected,
      algoThatMatches: algoMatch,
      shpKeys,
      bodyKeys: Object.keys(body),
      outSum,
      invId,
    })
  }

  return {
    valid,
    userId,
    period,
    invId: parseInt(invId, 10),
    outSum: Math.round(parseFloat(outSum)),
  }
}
