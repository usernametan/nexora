import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_ENVELOPE,
  STORAGE_EXCLUDED_KEYS,
  STORAGE_VERSION,
  applyRemoteValue,
  exportStoredData,
  importStoredData,
  readStoredEnvelope,
  readStoredValue,
  resetStoredData,
  storedKeys,
  writeStoredValue,
} from '../../src/lib/storage'

function createStorage() {
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(this, key) ? this[key] : null
    },
    setItem(key, value) {
      this[key] = String(value)
    },
    removeItem(key) {
      delete this[key]
    },
    clear() {
      Object.keys(this).forEach((key) => delete this[key])
    },
    key(index) {
      return Object.keys(this)[index] ?? null
    },
    get length() {
      return Object.keys(this).length
    },
  }
}

const events = []

beforeEach(() => {
  events.length = 0
  globalThis.window = {
    localStorage: createStorage(),
    dispatchEvent: (event) => {
      events.push(event)
      return true
    },
  }
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type
      this.detail = options.detail
    }
  }
})

describe('storage envelopes', () => {
  it('writes a versioned, timestamped envelope', () => {
    writeStoredValue('personal-cosmos:tasks', [{ id: 1 }])
    const envelope = readStoredEnvelope('personal-cosmos:tasks')
    expect(envelope[STORAGE_ENVELOPE]).toBe(true)
    expect(envelope.version).toBe(STORAGE_VERSION)
    expect(Number.isNaN(Date.parse(envelope.savedAt))).toBe(false)
    expect(envelope.value).toEqual([{ id: 1 }])
  })

  it('reads legacy unwrapped values through a migration', () => {
    window.localStorage.setItem('personal-cosmos:profile', JSON.stringify({ name: 'Ada' }))
    const value = readStoredValue('personal-cosmos:profile', {}, {
      migrate: (stored, version) => ({ ...stored, version }),
    })
    expect(value).toEqual({ name: 'Ada', version: 0 })
  })

  it('falls back when storage holds invalid JSON', () => {
    window.localStorage.setItem('personal-cosmos:broken', '{nope')
    expect(readStoredValue('personal-cosmos:broken', 'fallback')).toBe('fallback')
  })

  it('applies remote values and notifies subscribed hooks', () => {
    applyRemoteValue('personal-cosmos:earth-events', [{ id: 'e1' }], '2026-10-29T10:00:00.000Z')
    expect(readStoredEnvelope('personal-cosmos:earth-events').savedAt).toBe('2026-10-29T10:00:00.000Z')
    expect(events).toHaveLength(1)
    expect(events[0].detail).toEqual({ key: 'personal-cosmos:earth-events', value: [{ id: 'e1' }] })
  })
})

describe('backup export and import', () => {
  it('exports only user data keys with envelopes', () => {
    writeStoredValue('personal-cosmos:earth-tasks', [{ id: 't1' }])
    STORAGE_EXCLUDED_KEYS.forEach((key) => writeStoredValue(key, { secret: true }))
    const backup = exportStoredData()
    expect(backup.app).toBe('personal-cosmos')
    expect(backup.schemaVersion).toBe(STORAGE_VERSION)
    expect(Object.keys(backup.entries)).toEqual(['personal-cosmos:earth-tasks'])
    expect(backup.entries['personal-cosmos:earth-tasks'].value).toEqual([{ id: 't1' }])
  })

  it('imports valid records and ignores non-app keys', () => {
    const imported = importStoredData({
      app: 'personal-cosmos',
      schemaVersion: STORAGE_VERSION,
      entries: {
        'personal-cosmos:mercury-items': { version: 2, savedAt: '2026-10-28T09:00:00.000Z', value: [{ id: 'm1' }] },
        'other-app:data': { value: { nope: true } },
        'personal-cosmos:auth': { value: { token: 'should-not-import' } },
      },
    })
    expect(imported).toBe(1)
    expect(readStoredValue('personal-cosmos:mercury-items', [])).toEqual([{ id: 'm1' }])
    expect(window.localStorage.getItem('other-app:data')).toBe(null)
    expect(readStoredEnvelope('personal-cosmos:auth')).toBe(null)
  })

  it('rejects foreign and future backups', () => {
    expect(() => importStoredData({ app: 'something-else', entries: {} })).toThrow(/not a Personal Cosmos backup/i)
    expect(() => importStoredData({
      app: 'personal-cosmos',
      schemaVersion: STORAGE_VERSION + 1,
      entries: {},
    })).toThrow(/newer version/i)
  })

  it('resets every stored key', () => {
    writeStoredValue('personal-cosmos:earth-tasks', [])
    writeStoredValue('personal-cosmos:profile', { name: 'Ada' })
    expect(storedKeys()).toHaveLength(2)
    resetStoredData()
    expect(storedKeys()).toHaveLength(0)
  })
})
