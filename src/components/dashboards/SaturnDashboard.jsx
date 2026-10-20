import { useEffect, useMemo, useState } from 'react'
import { ambientOptions, focusSessions, weeklyFocus } from '../../data/mockData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { PauseIcon, PlayIcon, ResetIcon, SparkIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const TIMER_DURATION = 25 * 60

const formatTimer = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function SaturnDashboard() {
  const [seconds, setSeconds] = useLocalStorage('personal-cosmos:saturn-seconds', TIMER_DURATION)
  const [sessions, setSessions] = useLocalStorage('personal-cosmos:saturn-sessions', focusSessions)
  const [ambient, setAmbient] = useLocalStorage('personal-cosmos:saturn-ambient', 'space')
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, setSeconds])

  useEffect(() => {
    if (!running || seconds > 0) return
    setRunning(false)
    setSessions((current) => [...current, { label: 'Focus', duration: '25m', color: '#d9ab72' }])
  }, [running, seconds, setSessions])

  const timerProgress = useMemo(() => {
    const elapsed = TIMER_DURATION - seconds
    return `${(elapsed / TIMER_DURATION) * 360}deg`
  }, [seconds])

  const toggleTimer = () => {
    if (!running && seconds === 0) {
      setSeconds(TIMER_DURATION)
      setRunning(true)
      return
    }
    setRunning((current) => !current)
  }

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
            <button className="primary-action" type="button" onClick={toggleTimer}>
              {running ? <PauseIcon /> : <PlayIcon />}
              {running ? 'PAUSE' : 'START'}
            </button>
            <button className="secondary-action" type="button" onClick={() => { setRunning(false); setSeconds(TIMER_DURATION) }}>
              <ResetIcon /> RESET
            </button>
          </div>
        </GlassPanel>

        <div className="focus-side">
          <GlassPanel className="sessions-panel">
            <div className="section-heading">
              <div><p className="section-kicker">Completed</p><h2>Focus sessions</h2></div>
              <span className="session-total">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span>
            </div>
            <div className="session-list">
              {sessions.map((session, index) => (
                <div className="session-row" key={`${session.label}-${index}`}>
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
