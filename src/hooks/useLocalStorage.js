import { useCallback, useEffect, useRef, useState } from 'react'
import { dateKey } from '../utils/format'
import { queueCloudWrite } from '../lib/cloudSync'
import {
  STORAGE_EXCLUDED_KEYS,
  STORAGE_SYNC_EVENT,
  readStoredValue,
  writeStoredValue,
} from '../lib/storage'

export {
  STORAGE_EXCLUDED_KEYS,
  STORAGE_PREFIX,
  STORAGE_SYNC_EVENT,
  STORAGE_VERSION,
  dailyStorageKey,
  exportStoredData,
  importStoredData,
  readStoredEnvelope,
  readStoredValue,
  removeStoredValue,
  resetStoredData,
  storedKeys,
  writeStoredValue,
} from '../lib/storage'

function resolveInitial(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue
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

export function useLocalStorage(key, initialValue, options = {}) {
  const initialRef = useRef(initialValue)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [entry, setEntry] = useState(() => ({
    key,
    value: readStoredValue(key, resolveInitial(initialRef.current), optionsRef.current),
  }))
  const skipWriteRef = useRef(false)

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
    setEntry((current) => {
      if (current.key === key) return current
      return {
        key,
        value: readStoredValue(key, resolveInitial(initialRef.current), optionsRef.current),
      }
    })
  }, [key])

  useEffect(() => {
    if (skipWriteRef.current) {
      // Remote values are already persisted (with the server timestamp) by applyRemoteValue.
      skipWriteRef.current = false
      return
    }
    writeStoredValue(key, value, optionsRef.current)
    if (!STORAGE_EXCLUDED_KEYS.has(key)) queueCloudWrite(key, value)
  }, [key, value])

  useEffect(() => {
    const handleRemote = (event) => {
      if (event.detail?.key !== key) return
      skipWriteRef.current = true
      setEntry({ key, value: event.detail.value })
    }
    window.addEventListener(STORAGE_SYNC_EVENT, handleRemote)
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, handleRemote)
  }, [key])

  return [value, setValue]
}
