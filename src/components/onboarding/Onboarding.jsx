import { useState } from 'react'
import { useProfile } from '../../context/profile'
import { timeZones } from '../../data/timezones'
import { OrbitIcon, SparkIcon } from '../ui/Icons'

export function Onboarding() {
  const { profile, updateProfile } = useProfile()
  const [name, setName] = useState(profile.name)
  const [timezone, setTimezone] = useState(profile.timezone)
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Add a name to personalize your cosmos.')
      return
    }
    updateProfile({ name: trimmedName, timezone, onboarded: true })
  }

  return (
    <div className="onboarding-overlay">
      <section className="profile-card onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="onboarding-mark"><OrbitIcon size={30} /></div>
        <p className="profile-kicker"><SparkIcon size={13} /> First orbit</p>
        <h2 id="onboarding-title">Make this cosmos yours</h2>
        <p className="profile-intro">
          Your name and time zone shape the greeting, dates, and daily reset. Everything stays on this device.
        </p>
        <form className="profile-form" onSubmit={submit}>
          <label className="profile-field">
            <span>Your name</span>
            <input
              className="field-input"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError('')
              }}
              placeholder="How should we greet you?"
              autoComplete="given-name"
              autoFocus
            />
          </label>
          <label className="profile-field">
            <span>Time zone</span>
            <select
              className="field-input field-select profile-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {timeZones.map((zone) => <option value={zone} key={zone}>{zone.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          {error && <p className="profile-error" role="alert">{error}</p>}
          <button className="primary-action profile-submit" type="submit">ENTER THE COSMOS</button>
        </form>
        <p className="profile-footnote">You can change this later in system settings.</p>
      </section>
    </div>
  )
}
