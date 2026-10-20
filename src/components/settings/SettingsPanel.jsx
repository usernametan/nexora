import { useState } from 'react'
import { useProfile } from '../../context/profile'
import { timeZones } from '../../data/timezones'
import {
  STORAGE_VERSION,
  exportStoredData,
  resetStoredData,
  storedKeys,
} from '../../hooks/useLocalStorage'
import { dateKey } from '../../utils/format'
import { CloseIcon, ResetIcon } from '../ui/Icons'

export function SettingsPanel({ onClose }) {
  const { profile, updateProfile } = useProfile()
  const [name, setName] = useState(profile.name)
  const [timezone, setTimezone] = useState(profile.timezone)
  const [status, setStatus] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const keyCount = storedKeys().length

  const saveProfile = (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setStatus('A name is required.')
      return
    }
    updateProfile({ name: trimmedName, timezone })
    setStatus('Profile saved.')
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
    setStatus('Export downloaded.')
  }

  const resetData = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      setStatus('')
      return
    }
    resetStoredData()
    window.location.reload()
  }

  return (
    <div className="settings-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="profile-card settings-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="locked-close" type="button" onClick={onClose} aria-label="Close settings">
          <CloseIcon />
        </button>
        <p className="profile-kicker">System settings</p>
        <h2 id="settings-title">Personal orbit</h2>
        <p className="profile-intro">Control how the cosmos greets you and what stays on this device.</p>

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
                  setStatus('')
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
                  setStatus('')
                }}
              >
                {timeZones.map((zone) => <option value={zone} key={zone}>{zone.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
          </div>
          {status && <p className="profile-status" role="status">{status}</p>}
          <div className="profile-actions">
            <button className="primary-action" type="submit">SAVE PROFILE</button>
            <button className="secondary-action" type="button" onClick={onClose}>CLOSE</button>
          </div>
        </form>

        <div className="settings-data">
          <div>
            <p className="section-kicker">Local data</p>
            <h3>Export or reset</h3>
            <p>Schema v{STORAGE_VERSION} · {keyCount} {keyCount === 1 ? 'key' : 'keys'} stored in this browser.</p>
          </div>
          <div className="settings-data__actions">
            <button className="secondary-action" type="button" onClick={exportData}>EXPORT DATA</button>
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
          {confirmReset && <p className="settings-warning">This clears your profile and every local record. It cannot be undone.</p>}
        </div>
      </section>
    </div>
  )
}
