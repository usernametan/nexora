import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/auth'
import { useProfile } from '../../context/profile'
import { timeZones } from '../../data/timezones'
import {
  STORAGE_VERSION,
  exportStoredData,
  importStoredData,
  resetStoredData,
  storedKeys,
} from '../../hooks/useLocalStorage'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { dateKey } from '../../utils/format'
import { CloseIcon, ResetIcon } from '../ui/Icons'

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD', 'AED', 'BRL']

export function SettingsPanel({ onClose }) {
  const { profile, updateProfile } = useProfile()
  const {
    user,
    signedIn,
    busy,
    status: syncStatus,
    register,
    login,
    signOut,
    syncNow,
    uploadLocal,
    downloadCloud,
    clearCloud,
  } = useAuth()
  const [name, setName] = useState(profile.name)
  const [timezone, setTimezone] = useState(profile.timezone)
  const [currency, setCurrency] = useState(profile.currency)
  const [status, setStatus] = useState('')
  const [statusError, setStatusError] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const importRef = useRef(null)
  const cardRef = useRef(null)
  const keyCount = storedKeys().length
  useFocusTrap(cardRef, true)

  useEffect(() => {
    setName(profile.name)
    setTimezone(profile.timezone)
    setCurrency(profile.currency)
  }, [profile.name, profile.timezone, profile.currency])

  const say = (message, isError = false) => {
    setStatus(message)
    setStatusError(isError)
  }

  const saveProfile = (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      say('A name is required.', true)
      return
    }
    updateProfile({ name: trimmedName, timezone, currency })
    say('Profile saved.')
  }

  const exportData = () => {
    const payload = exportStoredData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `personal-cosmos-${dateKey()}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    say('Backup downloaded.')
  }

  const importData = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const payload = JSON.parse(await file.text())
      const imported = importStoredData(payload)
      const importedProfile = payload?.entries?.['personal-cosmos:profile']?.value
      if (importedProfile?.name) setName(importedProfile.name)
      if (importedProfile?.timezone) setTimezone(importedProfile.timezone)
      if (importedProfile?.currency) setCurrency(importedProfile.currency)
      if (signedIn) await uploadLocal()
      say(`${imported} records imported. Reloading…`)
      window.setTimeout(() => window.location.reload(), 700)
    } catch (error) {
      say(error.message || 'That backup could not be imported.', true)
    }
  }

  const resetData = async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      say('')
      return
    }
    try {
      if (signedIn) await clearCloud()
      resetStoredData()
      window.location.reload()
    } catch (error) {
      say(error.message || 'Cloud data could not be cleared. Nothing was deleted.', true)
    }
  }

  const submitAccount = async (event) => {
    event.preventDefault()
    setAuthError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setAuthError('Email and password are required.')
      return
    }
    if (authMode === 'register' && password.length < 8) {
      setAuthError('Use at least 8 characters for your password.')
      return
    }
    try {
      if (authMode === 'register') {
        await register({
          email: cleanEmail,
          password,
          name: profile.name || 'Cosmos user',
          timezone: profile.timezone,
          currency: profile.currency,
        })
        say('Account created. Local records were uploaded.')
      } else {
        await login({ email: cleanEmail, password })
        say('Signed in. Cloud and local records were merged.')
      }
      setPassword('')
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.')
    }
  }

  const runCloudAction = async (action, label) => {
    try {
      await action()
      say(label)
    } catch (error) {
      say(error.message || 'Cloud action failed.', true)
    }
  }

  return (
    <div className="settings-overlay" role="presentation" onMouseDown={onClose}>
      <section
        ref={cardRef}
        className="profile-card settings-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="locked-close" type="button" onClick={onClose} aria-label="Close settings">
          <CloseIcon />
        </button>
        <p className="profile-kicker">System settings</p>
        <h2 id="settings-title">Personal orbit</h2>
        <p className="profile-intro">Control how the cosmos greets you, where your data lives, and how it stays in sync.</p>

        <form className="profile-form" onSubmit={saveProfile}>
          <div className="profile-grid">
            <label className="profile-field">
              <span>Your name</span>
              <input
                className="field-input"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  say('')
                }}
                autoComplete="given-name"
              />
            </label>
            <label className="profile-field">
              <span>Time zone</span>
              <select
                className="field-input field-select profile-timezone"
                value={timezone}
                onChange={(event) => {
                  setTimezone(event.target.value)
                  say('')
                }}
              >
                {timeZones.map((zone) => <option value={zone} key={zone}>{zone.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            <label className="profile-field">
              <span>Currency</span>
              <select
                className="field-input field-select profile-timezone"
                value={currency}
                onChange={(event) => {
                  setCurrency(event.target.value)
                  say('')
                }}
              >
                {currencies.map((code) => <option value={code} key={code}>{code}</option>)}
              </select>
            </label>
          </div>
          {status && <p className={statusError ? 'profile-error' : 'profile-status'} role="status">{status}</p>}
          <div className="profile-actions">
            <button className="primary-action" type="submit">SAVE PROFILE</button>
            <button className="secondary-action" type="button" onClick={onClose}>CLOSE</button>
          </div>
        </form>

        <div className="settings-data settings-account">
          <div>
            <p className="section-kicker">Account &amp; sync</p>
            <h3>{signedIn ? user?.email ?? 'Signed in' : 'Connect this device'}</h3>
            <p>
              {signedIn
                ? `${syncStatus.message} · ${syncStatus.pending} pending change${syncStatus.pending === 1 ? '' : 's'}.`
                : 'Optional. Create an account to sync your cosmos across devices. Local data keeps working without one.'}
            </p>
          </div>

          {signedIn ? (
            <div className="settings-data__actions">
              <button className="secondary-action" type="button" disabled={busy} onClick={() => runCloudAction(syncNow, 'Sync complete.')}>
                SYNC NOW
              </button>
              <button className="secondary-action" type="button" disabled={busy} onClick={() => runCloudAction(uploadLocal, 'Local records uploaded.')}>
                UPLOAD LOCAL
              </button>
              <button className="secondary-action" type="button" disabled={busy} onClick={() => runCloudAction(downloadCloud, 'Cloud records downloaded.')}>
                DOWNLOAD CLOUD
              </button>
              <button className="secondary-action" type="button" disabled={busy} onClick={() => { signOut(); say('Signed out. Local data remains on this device.') }}>
                SIGN OUT
              </button>
            </div>
          ) : (
            <form className="account-form" onSubmit={submitAccount}>
              <div className="account-mode" role="group" aria-label="Account action">
                <button
                  className={authMode === 'login' ? 'is-active' : ''}
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError('') }}
                  aria-pressed={authMode === 'login'}
                >
                  SIGN IN
                </button>
                <button
                  className={authMode === 'register' ? 'is-active' : ''}
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError('') }}
                  aria-pressed={authMode === 'register'}
                >
                  CREATE ACCOUNT
                </button>
              </div>
              <label className="profile-field">
                <span>Email</span>
                <input
                  className="field-input"
                  type="email"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setAuthError('') }}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="profile-field">
                <span>Password</span>
                <input
                  className="field-input"
                  type="password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setAuthError('') }}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  minLength={authMode === 'register' ? 8 : undefined}
                  required
                />
              </label>
              {authError && <p className="profile-error" role="alert">{authError}</p>}
              <button className="primary-action" type="submit" disabled={busy}>
                {busy ? 'WORKING…' : authMode === 'register' ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </button>
            </form>
          )}
        </div>

        <div className="settings-data">
          <div>
            <p className="section-kicker">Local data</p>
            <h3>Back up, restore, or reset</h3>
            <p>Schema v{STORAGE_VERSION} · {keyCount} {keyCount === 1 ? 'key' : 'keys'} stored in this browser.</p>
          </div>
          <div className="settings-data__actions">
            <button className="secondary-action" type="button" onClick={exportData}>EXPORT DATA</button>
            <button className="secondary-action" type="button" onClick={() => importRef.current?.click()}>IMPORT DATA</button>
            <input
              ref={importRef}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={importData}
              aria-label="Import a Personal Cosmos backup"
            />
            <button
              className={`secondary-action settings-reset ${confirmReset ? 'is-confirming' : ''}`}
              type="button"
              onClick={resetData}
              onBlur={() => setConfirmReset(false)}
            >
              <ResetIcon size={13} />
              {confirmReset ? 'CONFIRM RESET' : 'RESET ALL DATA'}
            </button>
          </div>
          {confirmReset && (
            <p className="settings-warning">
              This clears your profile, every local record{signedIn ? ', and your cloud records' : ''}. It cannot be undone.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
