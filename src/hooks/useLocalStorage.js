import { useEffect, useState } from 'react'

function resolveInitial(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue
}

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(key, resolveInitial(initialValue)))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage may be unavailable (private mode or quota); keep state in memory.
    }
  }, [key, value])

  return [value, setValue]
}
