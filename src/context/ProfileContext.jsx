import { useCallback, useMemo } from 'react'
import { detectedTimeZone } from '../data/timezones'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from './auth'
import { PROFILE_KEY, ProfileContext } from './profile'

const defaultProfile = {
  name: '',
  timezone: detectedTimeZone,
  currency: 'USD',
  onboarded: false,
}

const normalizeProfile = (value) => ({
  ...defaultProfile,
  ...(value && typeof value === 'object' ? value : {}),
  currency: value?.currency || defaultProfile.currency,
})

export function ProfileProvider({ children }) {
  const [storedProfile, setStoredProfile] = useLocalStorage(PROFILE_KEY, defaultProfile, { migrate: normalizeProfile })
  const { signedIn, updateAccount } = useAuth()
  const profile = useMemo(() => normalizeProfile(storedProfile), [storedProfile])

  const updateProfile = useCallback((patch) => {
    setStoredProfile((current) => normalizeProfile({ ...normalizeProfile(current), ...patch }))
    if (signedIn) {
      const accountPatch = {}
      if (patch.name !== undefined) accountPatch.name = patch.name
      if (patch.timezone !== undefined) accountPatch.timezone = patch.timezone
      if (patch.currency !== undefined) accountPatch.currency = patch.currency
      if (Object.keys(accountPatch).length) {
        updateAccount(accountPatch).catch(() => {
          // Local profile is still saved; the next sync will retry the state.
        })
      }
    }
  }, [setStoredProfile, signedIn, updateAccount])

  const value = useMemo(() => ({ profile, updateProfile }), [profile, updateProfile])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
