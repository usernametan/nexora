import { useCallback, useMemo } from 'react'
import { detectedTimeZone } from '../data/timezones'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { PROFILE_KEY, ProfileContext } from './profile'

const defaultProfile = {
  name: '',
  timezone: detectedTimeZone,
  onboarded: false,
}

const normalizeProfile = (value) => ({
  ...defaultProfile,
  ...(value && typeof value === 'object' ? value : {}),
})

export function ProfileProvider({ children }) {
  const [storedProfile, setStoredProfile] = useLocalStorage(PROFILE_KEY, defaultProfile)
  const profile = useMemo(() => normalizeProfile(storedProfile), [storedProfile])

  const updateProfile = useCallback((patch) => {
    setStoredProfile((current) => normalizeProfile({ ...normalizeProfile(current), ...patch }))
  }, [setStoredProfile])

  const value = useMemo(() => ({ profile, updateProfile }), [profile, updateProfile])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
