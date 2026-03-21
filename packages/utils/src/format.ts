// ── Currency ──────────────────────────────────────────────────────────────────

export function formatRub(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ₽`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K ₽`
  return `${amount} ₽`
}

// ── String ────────────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return `${n} ${forms[2]}`
  if (mod10 === 1) return `${n} ${forms[0]}`
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${forms[1]}`
  return `${n} ${forms[2]}`
}

// Examples:
// pluralize(1, ['урок', 'урока', 'уроков']) → '1 урок'
// pluralize(3, ['урок', 'урока', 'уроков']) → '3 урока'
// pluralize(11, ['урок', 'урока', 'уроков']) → '11 уроков'

// ── Token ─────────────────────────────────────────────────────────────────────

export function generateInviteUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/invite/${token}`
}

export function generateTelegramDeepLink(botUsername: string, token: string): string {
  return `https://t.me/${botUsername}?start=${token}`
}
