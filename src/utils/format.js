const pad = (value) => String(value).padStart(2, '0')

export const getZonedParts = (date = new Date(), timeZone) => {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    }
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date)
    const pick = (type) => Number(parts.find((part) => part.type === type)?.value)
    return {
      year: pick('year'),
      month: pick('month'),
      day: pick('day'),
      hour: pick('hour'),
      minute: pick('minute'),
    }
  } catch {
    return getZonedParts(date)
  }
}

export const dateKey = (date = new Date(), timeZone) => {
  const parts = getZonedParts(date, timeZone)
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export const isoDay = (offset = 0, timeZone) => {
  const parts = getZonedParts(new Date(), timeZone)
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  date.setUTCDate(date.getUTCDate() - offset)
  return date.toISOString().slice(0, 10)
}

export const todayIso = (timeZone) => isoDay(0, timeZone)

export const createId = (prefix = 'item') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const formatMinutes = (minutes) => {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0))
  const hours = Math.floor(safeMinutes / 60)
  const rest = safeMinutes % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

export const sessionMinutes = (session) => {
  if (typeof session?.minutes === 'number') return Math.max(0, session.minutes)
  const duration = String(session?.duration ?? '0')
  const hours = Number(duration.match(/(\d+)\s*h/)?.[1] ?? 0)
  const minutes = Number(duration.match(/(\d+)\s*m/)?.[1] ?? 0)
  return hours * 60 + minutes
}

export const formatMoney = (value, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0)
  } catch {
    return `${currency} ${(Number(value) || 0).toFixed(2)}`
  }
}

const dateFromKey = (isoDate) => {
  if (!isoDate) return null
  const [year, month, day] = String(isoDate).split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day, 12)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatLongDate = (isoDate, locale = 'en-US') => {
  const date = dateFromKey(isoDate)
  if (!date) return 'Today'
  return date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
}

export const formatMonthYear = (isoDate, locale = 'en-US') => {
  const date = dateFromKey(isoDate?.length === 7 ? `${isoDate}-01` : isoDate)
  if (!date) return ''
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

export const daysBetween = (startIso, endIso) => {
  const start = dateFromKey(startIso)
  const end = dateFromKey(endIso)
  if (!start || !end) return 0
  return Math.round((end.getTime() - start.getTime()) / 86400000)
}

export const formatShortDate = (isoDate) => {
  if (!isoDate) return 'No date'
  const date = dateFromKey(isoDate)
  if (!date) return isoDate
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const greetingFor = (date = new Date(), timeZone) => {
  const { hour } = getZonedParts(date, timeZone)
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const monthGrid = (isoDate) => {
  const [year, month] = String(isoDate).split('-').map(Number)
  if (!year || !month) return []
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export const hostFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
