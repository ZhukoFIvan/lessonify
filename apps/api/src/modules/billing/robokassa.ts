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
  url.searchParams.set('SuccessURL', params.successUrl)
  url.searchParams.set('FailURL', params.failUrl)
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
}

export function verifyWebhook(body: Record<string, string>): WebhookResult {
  const outSum = body['OutSum'] ?? ''
  const invId = body['InvId'] ?? ''
  const sign = (body['SignatureValue'] ?? '').toUpperCase()
  const userId = body['Shp_userId'] ?? ''
  const period = body['Shp_period'] ?? ''

  const shp = shpString('Shp', userId, period)
  const expected = md5(`${outSum}:${invId}:${cfg.pass2()}:${shp}`)

  return { valid: expected === sign, userId, period, invId: parseInt(invId, 10) }
}
