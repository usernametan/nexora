import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, api, setApiToken } from '../lib/api'
import {
  SYNC_STATUS_EVENT,
  clearCloudState,
  downloadCloudState,
  getSyncStatus,
  mergeCloudState,
  startCloudSync,
  stopCloudSync,
  syncNow as syncNowWithCloud,
  uploadLocalState,
} from '../lib/cloudSync'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { AUTH_KEY, AuthContext } from './auth'

const normalizeSession = (value) => (
  value && typeof value === 'object' && typeof value.token === 'string'
    ? { token: value.token, user: value.user ?? null }
    : null
)

export function AuthProvider({ children }) {
  const [session, setSession] = useLocalStorage(AUTH_KEY, null, { migrate: normalizeSession })
  const [booting, setBooting] = useState(Boolean(normalizeSession(session)?.token))
  const [status, setStatus] = useState(() => getSyncStatus())
  const [busy, setBusy] = useState(false)
  const bootstrapped = useRef(false)
  const safeSession = normalizeSession(session)

  useEffect(() => {
    const handleStatus = (event) => setStatus(event.detail)
    window.addEventListener(SYNC_STATUS_EVENT, handleStatus)
    return () => window.removeEventListener(SYNC_STATUS_EVENT, handleStatus)
  }, [])

  const signOut = useCallback(() => {
    stopCloudSync()
    setApiToken(null)
    setSession(null)
    setBooting(false)
  }, [setSession])

  useEffect(() => {
    const token = safeSession?.token
    if (!token) {
      stopCloudSync()
      setBooting(false)
      return undefined
    }

    let cancelled = false
    setApiToken(token)
    startCloudSync(token)
    setBooting(true)

    ;(async () => {
      try {
        const user = await api.get('/auth/me')
        if (cancelled) return
        setSession((current) => (current ? { ...current, user } : current))
        if (!bootstrapped.current) {
          bootstrapped.current = true
          await mergeCloudState()
        }
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          signOut()
          return
        }
        setStatus((current) => ({
          ...current,
          state: 'offline',
          message: 'Cloud unavailable — working locally',
        }))
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [safeSession?.token, setSession, signOut])

  const authenticate = useCallback(async (path, credentials) => {
    setBusy(true)
    try {
      const result = await api.post(path, credentials)
      bootstrapped.current = true
      setApiToken(result.token)
      setSession({ token: result.token, user: result.user })
      startCloudSync(result.token)
      await mergeCloudState()
      return result.user
    } finally {
      setBusy(false)
    }
  }, [setSession])

  const register = useCallback((credentials) => authenticate('/auth/register', credentials), [authenticate])
  const login = useCallback((credentials) => authenticate('/auth/login', credentials), [authenticate])

  const updateAccount = useCallback(async (patch) => {
    const user = await api.patch('/profile', patch)
    setSession((current) => (current ? { ...current, user } : current))
    return user
  }, [setSession])

  const syncNow = useCallback(async () => {
    setBusy(true)
    try {
      return await syncNowWithCloud()
    } finally {
      setBusy(false)
    }
  }, [])

  const uploadLocal = useCallback(async () => {
    setBusy(true)
    try {
      return await uploadLocalState()
    } finally {
      setBusy(false)
    }
  }, [])

  const downloadCloud = useCallback(async () => {
    setBusy(true)
    try {
      return await downloadCloudState()
    } finally {
      setBusy(false)
    }
  }, [])

  const clearCloud = useCallback(async () => {
    setBusy(true)
    try {
      return await clearCloudState()
    } finally {
      setBusy(false)
    }
  }, [])

  const value = useMemo(() => ({
    user: safeSession?.user ?? null,
    token: safeSession?.token ?? null,
    signedIn: Boolean(safeSession?.token),
    booting,
    busy,
    status,
    register,
    login,
    signOut,
    updateAccount,
    syncNow,
    uploadLocal,
    downloadCloud,
    clearCloud,
  }), [
    safeSession,
    booting,
    busy,
    status,
    register,
    login,
    signOut,
    updateAccount,
    syncNow,
    uploadLocal,
    downloadCloud,
    clearCloud,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
