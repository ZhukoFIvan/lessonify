// Общий список часовых поясов (РФ + СНГ) для выбора репетитором.
// value — IANA-идентификатор (как хранит API), label — русское название с UTC-смещением.

export interface TimezoneOption {
  value: string
  label: string
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
  { value: 'Asia/Krasnoyarsk', label: 'Красноярск (UTC+7)' },
  { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
  { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
  { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
  { value: 'Asia/Magadan', label: 'Магадан (UTC+11)' },
  { value: 'Asia/Kamchatka', label: 'Камчатка (UTC+12)' },
  { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
  { value: 'Europe/Kyiv', label: 'Киев (UTC+2/+3)' },
  { value: 'Asia/Almaty', label: 'Алматы / Астана (UTC+5)' },
  { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
  { value: 'Asia/Tbilisi', label: 'Тбилиси (UTC+4)' },
  { value: 'Asia/Yerevan', label: 'Ереван (UTC+4)' },
  { value: 'Asia/Baku', label: 'Баку (UTC+4)' },
]

export const DEFAULT_TIMEZONE = 'Europe/Moscow'

/** IANA-зона из браузера, либо дефолт если определить не удалось. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
  } catch {
    return DEFAULT_TIMEZONE
  }
}

/** Человекочитаемая подпись для зоны (или сам IANA-id, если её нет в списке). */
export function timezoneLabel(value: string): string {
  return TIMEZONE_OPTIONS.find((tz) => tz.value === value)?.label ?? value
}

/**
 * Список опций, гарантированно содержащий `selected`.
 * Если выбранной/определённой зоны нет в списке — добавляем её в начало,
 * чтобы её всё равно можно было выбрать.
 */
export function timezoneOptionsWith(selected: string): TimezoneOption[] {
  if (!selected || TIMEZONE_OPTIONS.some((tz) => tz.value === selected)) {
    return TIMEZONE_OPTIONS
  }
  return [{ value: selected, label: selected }, ...TIMEZONE_OPTIONS]
}
