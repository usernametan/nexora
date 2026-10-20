export const isoDay = (offset = 0) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - offset)
  return date.toISOString().slice(0, 10)
}

export const todayIso = () => isoDay(0)

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

export const formatMoney = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(Number(value) || 0)

export const formatShortDate = (isoDate) => {
  if (!isoDate) return 'No date'
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const hostFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
