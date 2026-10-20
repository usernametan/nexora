import { useCallback, useEffect, useRef, useState } from 'react'
import { dateKey } from '../utils/format'

export const STORAGE_PREFIX = 'personal-cosmos:'
export const STORAGE_VERSION = 2

const ENVELOPE_MARK = '__cosmos'

function resolveInitial(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue
}

function isEnvelope(value) {
  return Boolean(value && typeof value === 'object' && value[ENVELOPE_MARK] === true)
}

export function readStoredValue(key, fallback, options = {}) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    const stored = isEnvelope(parsed) ? parsed.value : parsed
    const storedVersion = isEnvelope(parsed) ? Number(parsed.version) || 0 : 0
    const migrated = typeof options.migrate === 'function'
      ? options.migrate(stored, storedVersion)
      : stored
    return migrated ?? fallback
  } catch {
    return fallback
  }
}

export function writeStoredValue(key, value, options = {}) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify({
      [ENVELOPE_MARK]: true,
      version: options.version ?? STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      value,
    }))
  } catch {
    // Storage may be unavailable (private mode or quota); keep state in memory.
  }
}

export function removeStoredValue(key) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures in restricted browsing modes.
  }
}

export function dailyStorageKey(baseKey, day) {
  return `${baseKey}:${day}`
}

export function useCurrentDay(timeZone) {
  const [day, setDay] = useState(() => dateKey(new Date(), timeZone))
  useEffect(() => {
    const update = () => setDay((current) => {
      const next = dateKey(new Date(), timeZone)
      return next === current ? current : next
    })
    update()
    const timer = window.setInterval(update, 30000)
    return () => window.clearInterval(timer)
  }, [timeZone])
  return day
}

export function storedKeys() {
  if (typeof window === 'undefined') return []
  try {
    return Object.keys(window.localStorage).filter((key) => key.startsWith(STORAGE_PREFIX))
  } catch {
    return []
  }
}

export function exportStoredData() {
  const entries = {}
  storedKeys().forEach((key) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key))
      entries[key] = isEnvelope(parsed)
        ? { version: Number(parsed.version) || 0, savedAt: parsed.savedAt ?? null, value: parsed.value }
        : { version: 0, savedAt: null, value: parsed }
    } catch {
      entries[key] = { version: 0, savedAt: null, value: null, unreadable: true }
    }
  })
  return {
    app: 'personal-cosmos',
    schemaVersion: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  }
}

export function resetStoredData() {
  storedKeys().forEach((key) => removeStoredValue(key))
}

export function useLocalStorage(key, initialValue, options = {}) {
  const initialRef = useRef(initialValue)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [entry, setEntry] = useState(() => ({
    key,
    value: readStoredValue(key, resolveInitial(initialRef.current), optionsRef.current),
  }))

  const value = entry.key === key
    ? entry.value
    : readStoredValue(key, resolveInitial(initialRef.current), optionsRef.current)

  const setValue = useCallback((update) => {
    setEntry((current) => {
      const base = current.key === key
        ? current.value
        : readStoredValue(key, resolveInitial(initialRef.current), optionsRef.current)
      const next = typeof update === 'function' ? update(base) : update
      return { key, value: next }
    })
  }, [key])

  useEffect(() => {
    writeStoredValue(key, value, optionsRef.current)
  }, [key, value])

  return [value, setValue]
}
