export const STORAGE_PREFIX = 'personal-cosmos:'
export const STORAGE_VERSION = 3
export const STORAGE_ENVELOPE = '__cosmos'
export const STORAGE_SYNC_EVENT = 'personal-cosmos:remote-state'
export const STORAGE_EXCLUDED_KEYS = new Set([
  `${STORAGE_PREFIX}auth`,
  `${STORAGE_PREFIX}sidebar-open`,
  `${STORAGE_PREFIX}saturn-seconds`,
  `${STORAGE_PREFIX}saturn-end-at`,
])

export function isEnvelope(value) {
  return Boolean(value && typeof value === 'object' && value[STORAGE_ENVELOPE] === true)
}

export function readStoredEnvelope(key) {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    const parsed = JSON.parse(raw)
    return isEnvelope(parsed) ? parsed : { value: parsed, version: 0, savedAt: null }
  } catch {
    return null
  }
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
      [STORAGE_ENVELOPE]: true,
      version: options.version ?? STORAGE_VERSION,
      savedAt: options.savedAt ?? new Date().toISOString(),
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
    if (STORAGE_EXCLUDED_KEYS.has(key)) return
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

export function importStoredData(payload) {
  if (!payload || payload.app !== 'personal-cosmos' || !payload.entries || typeof payload.entries !== 'object') {
    throw new Error('This file is not a Personal Cosmos backup.')
  }
  if (Number(payload.schemaVersion) > STORAGE_VERSION) {
    throw new Error('This backup was created by a newer version of Personal Cosmos.')
  }

  let imported = 0
  Object.entries(payload.entries).forEach(([key, entry]) => {
    if (!key.startsWith(STORAGE_PREFIX) || STORAGE_EXCLUDED_KEYS.has(key)) return
    if (!entry || entry.value === undefined || entry.value === null) return
    writeStoredValue(key, entry.value, {
      version: Number(entry.version) || STORAGE_VERSION,
      savedAt: entry.savedAt ?? undefined,
    })
    imported += 1
  })
  return imported
}

export function resetStoredData() {
  storedKeys().forEach((key) => removeStoredValue(key))
}

export function applyRemoteValue(key, value, savedAt) {
  writeStoredValue(key, value, { savedAt })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key, value } }))
  }
}
