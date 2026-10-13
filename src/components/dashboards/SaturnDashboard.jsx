import { useEffect, useMemo, useState } from 'react'
import { ambientOptions, focusSessions, weeklyFocus } from '../../data/mockData'
import { PauseIcon, PlayIcon, ResetIcon, SparkIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const formatTimer = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function SaturnDashboard() {
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [ambient, setAmbient] = useState('space')

   useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const timerProgress = useMemo(() => {
    const elapsed = 25 * 60 - seconds
    return `${(elapsed / (25 * 60)) * 360}deg`
  }, [seconds])

  return (
    <div className="dashboard-page saturn-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span /> Saturn · Deep work</p>
          <h1>Make space for focus</h1>
          <p className="dashboard-date">One clear orbit at a time.</p>
        </div>
        <div className="today-focus">
          <span>Today’s focus</span>
          <strong>3h 24m</strong>
          <small>+18% from yesterday</small>
        </div>
      </header>

      <div className="focus-layout">
        <GlassPanel className="timer-panel">
          <div className="timer-ring" style={{ '--timer-progress': timerProgress }}>
            <div className="timer-ring__inner">
              <span>Focus session</span>
              <strong aria-live="polite">{formatTimer(seconds)}</strong>
              <small>{running ? 'In deep focus' : seconds === 0 ? 'Session complete' : 'Ready when you are'}</small>
            </div>
          </div>
          <div className="timer-actions">
            <button className="primary-action" type="button" onClick={() => setRunning((current) => !current)}>
              {running ? <PauseIcon /> : <PlayIcon />}
              {running ? 'PAUSE' : 'START'}
            </button>
            <button className="secondary-action" type="button" onClick={() => { setRunning(false); setSeconds(25 * 60) }}>
              <ResetIcon /> RESET
            </button>
          </div>
        </GlassPanel>

        <div className="focus-side">
          <GlassPanel className="sessions-panel">
            <div className="section-heading">
              <div><p className="section-kicker">Completed</p><h2>Focus sessions</h2></div>
              <span className="session-total">3 sessions</span>
            </div>
            <div className="session-list">
              {focusSessions.map((session) => (
                <div className="session-row" key={session.label}>
                  <i style={{ background: session.color }} />
                  <span>{session.label}</span>
                  <strong>{session.duration}</strong>
                  <small>Complete</small>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="ambient-panel">
            <div className="section-heading">
              <div><p className="section-kicker">Sound environment</p><h2>Ambient space</h2></div>
              <SparkIcon />
            </div>
            <div className="ambient-list">
              {ambientOptions.map((option) => (
                <button
                  className={ambient === option.id ? 'is-active' : ''}
                  type="button"
                  key={option.id}
                  onClick={() => setAmbient(option.id)}
                  aria-pressed={ambient === option.id}
                >
                  <span className="ambient-pulse"><i /><i /><i /></span>
                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                  <i className="ambient-check" />
                </button>
              ))}
            </div>
            <p className="prototype-note">Audio is represented visually only in this prototype.</p>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel className="weekly-panel">
        <div className="section-heading">
          <div><p className="section-kicker">Last 7 days</p><h2>Weekly study orbit</h2></div>
          <div className="weekly-total"><strong>21.9h</strong><span>Total focus</span></div>
        </div>
        <div className="focus-chart">
          {weeklyFocus.map((item, index) => (
            <div className="focus-bar" key={`${item.day}-${index}`}>
              <div className="focus-bar__track"><span style={{ height: `${(item.hours / 5.5) * 100}%` }} /></div>
              <strong>{item.hours}h</strong>
              <small>{item.day}</small>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  )
}
