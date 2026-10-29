import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '../../context/profile'
import { moonCycle, moonEnergy, moonSleep } from '../../data/mockData'
import { dailyStorageKey, useCurrentDay, useLocalStorage } from '../../hooks/useLocalStorage'
import { daysBetween, formatLongDate } from '../../utils/format'
import { CheckIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const sleepQualityScore = { poor: 45, fair: 65, good: 78, restorative: 90 }
const qualityOptions = ['poor', 'fair', 'good', 'restorative']

const phaseLabels = {
  period: 'Menstrual',
  'phase-one': 'Follicular',
  fertile: 'Fertile',
  'phase-two': 'Ovulation',
  luteal: 'Luteal',
  rest: 'Rest',
}

const getCyclePhase = (day) => {
  if (day <= 5) return 'period'
  if (day <= 9) return 'phase-one'
  if (day <= 14) return 'fertile'
  if (day <= 18) return 'phase-two'
  if (day <= 22) return 'luteal'
  return 'rest'
}

export function MoonDashboard() {
  const { profile } = useProfile()
  const today = useCurrentDay(profile.timezone)
  const [glasses, setGlasses] = useLocalStorage(dailyStorageKey('personal-cosmos:moon-hydration', today), 0)
  const [sleep, setSleep] = useLocalStorage(dailyStorageKey('personal-cosmos:moon-sleep', today), moonSleep)
  const [energy, setEnergy] = useLocalStorage(dailyStorageKey('personal-cosmos:moon-energy', today), moonEnergy)
  const [cycle, setCycle] = useLocalStorage('personal-cosmos:moon-cycle', moonCycle)
  const [sleepDraft, setSleepDraft] = useState(sleep ?? moonSleep)
  const hydration = Math.min(8, Math.max(0, Number(glasses) || 0))
  const waterLevel = `${(hydration / 8) * 100}%`
  const energyValue = Math.min(100, Math.max(0, Number(energy) || 0))
  const safeCycle = {
    startDate: cycle?.startDate ?? moonCycle.startDate,
    length: Math.min(45, Math.max(20, Number(cycle?.length) || 28)),
  }
  const cycleDay = useMemo(() => {
    const elapsed = Math.max(0, daysBetween(safeCycle.startDate, today))
    return (elapsed % safeCycle.length) + 1
  }, [safeCycle.length, safeCycle.startDate, today])
  const phase = getCyclePhase(cycleDay)
  const sleepScore = sleep
    ? Math.min(100, Math.round(((Number(sleep.hours) || 0) * 60 + (Number(sleep.minutes) || 0)) / 480 * 100))
    : 0
  const sleepQuality = sleepQualityScore[sleep?.quality] ?? 0
  const cycleDays = Array.from({ length: safeCycle.length }, (_, index) => index + 1)
  const metrics = [
    {
      label: 'Sleep',
      value: sleep ? `${Number(sleep.hours) || 0}h ${String(Number(sleep.minutes) || 0).padStart(2, '0')}m` : 'Not logged',
      score: sleepScore,
      color: '#b9c9e8',
    },
    {
      label: 'Hydration',
      value: `${hydration} / 8`,
      score: Math.round((hydration / 8) * 100),
      color: '#74b8df',
    },
    {
      label: 'Energy',
      value: energyValue >= 70 ? 'Steady' : energyValue >= 40 ? 'Low' : 'Rest needed',
      score: energyValue,
      color: '#9f8fd8',
    },
  ]

  useEffect(() => {
    setSleepDraft(sleep ?? moonSleep)
  }, [sleep])

  const saveSleep = (event) => {
    event.preventDefault()
    setSleep({
      hours: Math.min(24, Math.max(0, Number(sleepDraft.hours) || 0)),
      minutes: Math.min(59, Math.max(0, Number(sleepDraft.minutes) || 0)),
      quality: sleepDraft.quality,
      bedTime: sleepDraft.bedTime || '23:00',
      wakeTime: sleepDraft.wakeTime || '07:00',
    })
  }

  const saveCycle = (event) => {
    event.preventDefault()
    setCycle({
      startDate: event.target.startDate.value || today,
      length: Math.min(45, Math.max(20, Number(event.target.length.value) || 28)),
    })
  }

  return (
    <div className="dashboard-page moon-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span /> Moon · Personal wellbeing</p>
          <h1>A quieter kind of progress</h1>
          <p className="dashboard-date">Your body, gently observed.</p>
        </div>
        <span className="soft-badge">{formatLongDate(today)}</span>
      </header>

      <div className="wellness-hero">
        <GlassPanel className="sleep-card">
          <div className="metric-label">Last night’s sleep</div>
          <div className="sleep-value">
            {sleep ? Number(sleep.hours) || 0 : '—'}<span>h</span> {sleep ? String(Number(sleep.minutes) || 0).padStart(2, '0') : '—'}<span>m</span>
          </div>
          <div className="sleep-quality"><span /> {sleep ? `${sleep.quality ?? 'good'} · ${sleepScore}%` : 'Not logged yet'}</div>
          <div className="sleep-wave" aria-hidden="true">
            {[18, 28, 22, 42, 31, 52, 39, 63, 48, 34, 55, 28, 44, 24, 36, 18].map((height, index) => (
              <i key={`${height}-${index}`} style={{ height: `${sleep ? height : 8}%` }} />
            ))}
          </div>
          <div className="metric-footer"><span>{sleep?.bedTime ?? '—'}</span><span>{sleep?.wakeTime ?? '—'}</span></div>
          <form className="wellness-form" onSubmit={saveSleep}>
            <div className="field-row">
              <input
                className="field-input compact-number"
                type="number"
                min="0"
                max="24"
                value={sleepDraft.hours}
                onChange={(event) => setSleepDraft((current) => ({ ...current, hours: event.target.value }))}
                aria-label="Sleep hours"
              />
              <span className="compact-unit">h</span>
              <input
                className="field-input compact-number"
                type="number"
                min="0"
                max="59"
                value={sleepDraft.minutes}
                onChange={(event) => setSleepDraft((current) => ({ ...current, minutes: event.target.value }))}
                aria-label="Sleep minutes"
              />
              <span className="compact-unit">m</span>
              <select
                className="field-input field-select compact-select"
                value={sleepDraft.quality}
                onChange={(event) => setSleepDraft((current) => ({ ...current, quality: event.target.value }))}
                aria-label="Sleep quality"
              >
                {qualityOptions.map((quality) => <option value={quality} key={quality}>{quality}</option>)}
              </select>
              <button className="mini-action" type="submit"><CheckIcon /></button>
            </div>
          </form>
        </GlassPanel>

        <GlassPanel className="water-card">
          <div className="metric-label">Hydration</div>
          <div className="water-gauge" style={{ '--water-level': waterLevel }}>
            <div>
              <strong>{hydration}</strong>
              <span>/ 8 glasses</span>
            </div>
          </div>
          <div className="water-controls">
            <button
              type="button"
              onClick={() => setGlasses((current) => Math.max(0, Number(current) - 1))}
              disabled={hydration === 0}
              aria-label="Remove a glass of water"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setGlasses((current) => Math.min(8, Number(current) + 1))}
              disabled={hydration === 8}
              aria-label="Log a glass of water"
            >
              +
            </button>
          </div>
          <p>
            {hydration === 8
              ? 'Daily hydration complete. Beautifully in rhythm.'
              : `${8 - hydration} more ${8 - hydration === 1 ? 'glass' : 'glasses'} of water to reach your daily rhythm.`}
          </p>
        </GlassPanel>
      </div>

      <div className="wellness-grid">
        <GlassPanel className="status-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{formatLongDate(today)}</p>
              <h2>Daily status</h2>
            </div>
            <span className="section-count">{sleepQuality ? `Sleep ${sleepQuality}%` : 'New day'}</span>
          </div>
          <div className="status-list">
            {metrics.map((metric) => (
              <div className="status-row" key={metric.label}>
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
                <div className="status-track">
                  <span style={{ width: `${metric.score}%`, background: metric.color }} />
                </div>
                <small>{metric.score}%</small>
              </div>
            ))}
          </div>
          <label className="energy-control">
            <span>Log current energy</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={energyValue}
              onChange={(event) => setEnergy(Number(event.target.value))}
              aria-label="Current energy"
            />
            <strong>{energyValue}%</strong>
          </label>
        </GlassPanel>

        <GlassPanel className="cycle-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Cycle tracker</p>
              <h2>Month at a glance</h2>
            </div>
            <span className="cycle-day">Day {cycleDay} · {phaseLabels[phase]}</span>
          </div>
          <div className="cycle-track" aria-label={`Cycle day ${cycleDay} of ${safeCycle.length}`}>
            {cycleDays.map((day) => (
              <span
                className={`${getCyclePhase(day)} ${day === cycleDay ? 'is-current' : ''}`}
                key={day}
                title={`Day ${day}`}
              />
            ))}
          </div>
          <div className="cycle-legend">
            <span><i className="phase-period" />Menstrual</span>
            <span><i className="phase-fertile" />Fertile</span>
            <span><i className="phase-luteal" />Luteal</span>
          </div>
          <form className="cycle-form" onSubmit={saveCycle}>
            <label>
              <span>Cycle start</span>
              <input
                className="field-input field-input--date"
                type="date"
                name="startDate"
                defaultValue={safeCycle.startDate}
                max={today}
                aria-label="Cycle start date"
              />
            </label>
            <label>
              <span>Length</span>
              <input
                className="field-input compact-number"
                type="number"
                name="length"
                min="20"
                max="45"
                defaultValue={safeCycle.length}
                aria-label="Cycle length in days"
              />
            </label>
            <button className="mini-action" type="submit"><CheckIcon /> Save</button>
          </form>
          <p className="wellness-note">A visual reflection only. Not a medical device or diagnosis.</p>
        </GlassPanel>
      </div>
    </div>
  )
}
