import crypto from 'crypto'

const PRODAMUS_URL = () => process.env.PRODAMUS_URL ?? ''
const PRODAMUS_SECRET = () => process.env.PRODAMUS_SECRET ?? ''

/**
 * Prodamus HMAC-SHA256 signature utility.
 *
 * Algorithm (official docs):
 * 1. Convert all values to strings
 * 2. Sort keys alphabetically, recursively
 * 3. Serialize to JSON
 * 4. Escape forward slashes (/ -> \/)
 * 5. HMAC-SHA256 with the secret key
 */

function sortDeep(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(obj).sort()) {
    const val = obj[key]
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      sorted[key] = sortDeep(val as Record<string, unknown>)
    } else if (Array.isArray(val)) {
      sorted[key] = val.map((item) =>
        item !== null && typeof item === 'object'
          ? sortDeep(item as Record<string, unknown>)
          : String(item ?? ''),
      )
    } else {
      sorted[key] = val === null || val === undefined ? '' : String(val)
    }
  }
  return sorted
}

export function createSignature(
  data: Record<string, unknown>,
  secret?: string,
): string {
  const sorted = sortDeep(data)
  const json = JSON.stringify(sorted).replace(/\//g, '\\/')
  return crypto.createHmac('sha256', secret ?? PRODAMUS_SECRET()).update(json).digest('hex')
}

export function verifySignature(
  data: Record<string, unknown>,
  sign: string,
  secret?: string,
): boolean {
  const expected = createSignature(data, secret ?? PRODAMUS_SECRET())
  if (expected.length !== sign.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sign))
}

// ── Payment link builder ──────────────────────────────────────────────────────

interface PaymentLinkParams {
  orderId: string
  amount: number
  productName: string
  customerEmail: string
  urlSuccess: string
  urlReturn: string
}

export function buildPaymentUrl(params: PaymentLinkParams): string {
  const data: Record<string, unknown> = {
    do: 'link',
    type: 'json',
    callbackType: 'json',
    order_id: params.orderId,
    customer_email: params.customerEmail,
    urlSuccess: params.urlSuccess,
    urlReturn: params.urlReturn,
    products: [
      {
        name: params.productName,
        price: String(params.amount),
        quantity: '1',
      },
    ],
  }

  data.signature = createSignature(data)

  const qs = new URLSearchParams()

  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) {
          for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
            qs.append(`${key}[${i}][${k}]`, String(v))
          }
        }
      })
    } else {
      qs.append(key, String(val))
    }
  }

  return `${PRODAMUS_URL()}?${qs.toString()}`
}
