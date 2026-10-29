import { ApiError, api, setApiToken } from './api'
import {
  STORAGE_EXCLUDED_KEYS,
  applyRemoteValue,
  readStoredEnvelope,
  storedKeys,
} from './storage'

export const SYNC_STATUS_EVENT = 'personal-cosmos:sync-status'

const FLUSH_DELAY = 450
const pending = new Map()
const versions = new Map()
let enabled = false
let flushTimer = null
let flushing = false
let listenersAttached = false
let status = { state: 'offline', message: 'Saved on this device', pending: 0, at: null }

function emitStatus(next) {
  status = { ...status, ...next, pending: pending.size, at: new Date().toISOString() }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: status }))
  }
}

export function getSyncStatus() {
  return status
}

export function isCloudSyncEnabled() {
  return enabled
}

function attachListeners() {
  if (listenersAttached || typeof window === 'undefined') return
  listenersAttached = true
  window.addEventListener('online', () => {
    if (!enabled) return
    emitStatus({ state: 'syncing', message: 'Back online — syncing' })
    flushCloudWrites()
  })
  window.addEventListener('beforeunload', () => {
    if (enabled && pending.size) flushCloudWrites({ keepalive: true })
  })
}

export function startCloudSync(token) {
  enabled = true
  setApiToken(token)
  attachListeners()
  emitStatus({ state: 'syncing', message: 'Connecting to cloud' })
}

export function stopCloudSync() {
  enabled = false
  setApiToken(null)
  pending.clear()
  versions.clear()
  if (flushTimer) window.clearTimeout(flushTimer)
  flushTimer = null
  emitStatus({ state: 'offline', message: 'Signed out — saved on this device' })
}

export function queueCloudWrite(key, value) {
  if (!enabled || STORAGE_EXCLUDED_KEYS.has(key)) return
  pending.set(key, { value, baseVersion: versions.get(key) })
  emitStatus({ state: 'syncing', message: 'Syncing changes' })
  if (flushTimer) window.clearTimeout(flushTimer)
  flushTimer = window.setTimeout(() => flushCloudWrites(), FLUSH_DELAY)
}

function entryPath(key) {
  return `/state/${encodeURIComponent(key)}`
}

export async function flushCloudWrites({ keepalive = false } = {}) {
  if (!enabled || flushing || !pending.size) return
  flushing = true
  if (flushTimer) window.clearTimeout(flushTimer)
  flushTimer = null
  const batch = [...pending.entries()]
  pending.clear()

  try {
    for (const [key, item] of batch) {
      await pushEntry(key, item, keepalive)
    }
    emitStatus({ state: 'synced', message: 'Synced to cloud' })
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      batch.forEach(([key, item]) => pending.set(key, item))
      emitStatus({ state: 'offline', message: 'Offline — changes will sync' })
    } else if (error instanceof ApiError && error.status === 401) {
      enabled = false
      setApiToken(null)
      emitStatus({ state: 'error', message: 'Session expired — sign in again' })
    } else {
      emitStatus({ state: 'error', message: error.message || 'Sync failed' })
    }
  } finally {
    flushing = false
  }
}

async function pushEntry(key, item, keepalive, retried = false) {
  try {
    const saved = await api.put(entryPath(key), {
      value: item.value,
      baseVersion: item.baseVersion,
    }, { keepalive })
    versions.set(key, saved.version)
    return saved
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && !retried) {
      const remote = await api.get(entryPath(key))
      const local = readStoredEnvelope(key)
      const localSavedAt = local?.savedAt ? Date.parse(local.savedAt) : 0
      const remoteSavedAt = remote?.updatedAt ? Date.parse(remote.updatedAt) : 0
      versions.set(key, remote.version)
      if (localSavedAt > remoteSavedAt) {
        return pushEntry(key, { value: local.value, baseVersion: remote.version }, keepalive, true)
      }
      applyRemoteValue(key, remote.value, remote.updatedAt)
      return remote
    }
    throw error
  }
}

export async function fetchCloudState() {
  return api.get('/state')
}

function localEntries() {
  return storedKeys()
    .filter((key) => !STORAGE_EXCLUDED_KEYS.has(key))
    .map((key) => {
      const envelope = readStoredEnvelope(key)
      return envelope ? { key, value: envelope.value, savedAt: envelope.savedAt } : null
    })
    .filter(Boolean)
}

export async function uploadLocalState() {
  const entries = localEntries().map(({ key, value }) => ({
    key,
    value,
    baseVersion: versions.get(key),
  }))
  if (!entries.length) return 0
  const saved = await api.put('/state', { entries })
  saved.forEach((entry) => versions.set(entry.key, entry.version))
  emitStatus({ state: 'synced', message: `Uploaded ${saved.length} local records` })
  return saved.length
}

export async function downloadCloudState() {
  const cloud = await fetchCloudState()
  cloud.forEach((entry) => {
    versions.set(entry.key, entry.version)
    applyRemoteValue(entry.key, entry.value, entry.updatedAt)
  })
  emitStatus({ state: 'synced', message: `Downloaded ${cloud.length} records` })
  return cloud.length
}

export async function clearCloudState() {
  await api.delete('/state')
  versions.clear()
  pending.clear()
  emitStatus({ state: 'synced', message: 'Cloud data cleared' })
}

export async function mergeCloudState() {
  if (!enabled) return { downloaded: 0, uploaded: 0 }
  emitStatus({ state: 'syncing', message: 'Merging cloud and local data' })
  const cloud = await fetchCloudState()
  const cloudKeys = new Set(cloud.map((entry) => entry.key))
  let downloaded = 0

  cloud.forEach((entry) => {
    versions.set(entry.key, entry.version)
    const local = readStoredEnvelope(entry.key)
    const localSavedAt = local?.savedAt ? Date.parse(local.savedAt) : 0
    const remoteSavedAt = entry.updatedAt ? Date.parse(entry.updatedAt) : 0
    if (!local || localSavedAt <= remoteSavedAt) {
      applyRemoteValue(entry.key, entry.value, entry.updatedAt)
      downloaded += 1
    } else {
      pending.set(entry.key, { value: local.value, baseVersion: entry.version })
    }
  })

  localEntries().forEach(({ key, value }) => {
    if (!cloudKeys.has(key)) pending.set(key, { value, baseVersion: versions.get(key) })
  })

  const uploadCount = pending.size
  if (uploadCount) await flushCloudWrites()
  emitStatus({ state: 'synced', message: 'Cloud and local data are in sync' })
  return { downloaded, uploaded: uploadCount }
}

export async function syncNow() {
  if (!enabled) throw new Error('Sign in to sync.')
  await flushCloudWrites()
  return mergeCloudState()
}
