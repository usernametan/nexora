import { useEffect, useMemo, useRef, useState } from 'react'
import { useProfile } from '../../context/profile'
import { ambientOptions } from '../../data/mockData'
import {
  dailyStorageKey,
  readStoredValue,
  useCurrentDay,
  useLocalStorage,
  writeStoredValue,
} from '../../hooks/useLocalStorage'
import { useAmbientAudio } from '../../hooks/useAmbientAudio'
import { createId, formatMinutes, isoDay, sessionMinutes } from '../../utils/format'
import { PauseIcon, PlayIcon, ResetIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const TIMER_DURATION = 25 * 60
const SECONDS_KEY = 'personal-cosmos:saturn-seconds'
const SESSIONS_KEY = 'personal-cosmos:saturn-sessions'

const formatTimer = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function SaturnDashboard() {
  const { profile } = useProfile()
  const today = useCurrentDay(profile.timezone)
  const [seconds, setSeconds] = useState(() => {
    const stored = readStoredValue(SECONDS_KEY, TIMER_DURATION)
    if (typeof stored !== 'number' || !Number.isFinite(stored)) return TIMER_DURATION
    return Math.min(TIMER_DURATION, Math.max(0, stored))
  })
  const [sessions, setSessions] = useLocalStorage(dailyStorageKey(SESSIONS_KEY, today), [])
  const [ambient, setAmbient] = useLocalStorage('personal-cosmos:saturn-ambient', 'space')
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [running, setRunning] = useState(false)
  const secondsRef = useRef(seconds)
  useAmbientAudio(ambient, audioEnabled)

  const safeSessions = useMemo(() => (Array.isArray(sessions) ? sessions : []), [sessions])
  const sessionsFor = (date) => (
    date === today ? safeSessions : readStoredValue(dailyStorageKey(SESSIONS_KEY, date), [])
  )
  const todayMinutes = safeSessions.reduce((total, session) => total + sessionMinutes(session), 0)
  const yesterdayMinutes = sessionsFor(isoDay(1, profile.timezone))
    .reduce((total, session) => total + sessionMinutes(session), 0)
  const todaySessionCount = safeSessions.length
  const delta = yesterdayMinutes > 0 ? Math.round(((todayMinutes - yesterdayMinutes) / yesterdayMinutes) * 100) : null

  const weekly = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = isoDay(6 - index, profile.timezone)
    const minutes = (date === today ? safeSessions : readStoredValue(dailyStorageKey(SESSIONS_KEY, date), []))
      .reduce((total, session) => total + sessionMinutes(session), 0)
    return {
      date,
      day: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' }),
      minutes,
    }
  }), [profile.timezone, safeSessions, today])
  const weekTotal = weekly.reduce((total, day) => total + day.minutes, 0)
  const maxDay = Math.max(1, ...weekly.map((day) => day.minutes))

  useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  useEffect(() => () => {
    writeStoredValue(SECONDS_KEY, secondsRef.current)
  }, [])

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (!running || seconds > 0) return
    setRunning(false)
    writeStoredValue(SECONDS_KEY, 0)
    setSessions((current) => [...(Array.isArray(current) ? current : []), {
      id: createId('focus'),
      label: 'Focus',
      minutes: 25,
      color: '#d9ab72',
      date: today,
    }])
  }, [running, seconds, setSessions, today])

  const timerProgress = useMemo(() => {
    const elapsed = TIMER_DURATION - seconds
    return `${(elapsed / TIMER_DURATION) * 360}deg`
  }, [seconds])

  const toggleTimer = () => {
    if (running) {
      setRunning(false)
      writeStoredValue(SECONDS_KEY, seconds)
      return
    }
    if (seconds === 0) {
      setSeconds(TIMER_DURATION)
      writeStoredValue(SECONDS_KEY, TIMER_DURATION)
      setRunning(true)
      return
    }
    setRunning(true)
  }

  const resetTimer = () => {
    setRunning(false)
    setSeconds(TIMER_DURATION)
    writeStoredValue(SECONDS_KEY, TIMER_DURATION)
  }

  const chooseAmbient = (optionId) => {
    setAmbient(optionId)
    setAudioEnabled(true)
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
          <strong>{formatMinutes(todayMinutes)}</strong>
          <small>
            {delta === null
              ? `${todaySessionCount} ${todaySessionCount === 1 ? 'session' : 'sessions'} logged`
              : `${delta >= 0 ? '+' : ''}${delta}% from yesterday`}
          </small>
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
            <button className="secondary-action" type="button" onClick={resetTimer}>
              <ResetIcon /> RESET
            </button>
          </div>
        </GlassPanel>

        <div className="focus-side">
          <GlassPanel className="sessions-panel">
            <div className="section-heading">
              <div><p className="section-kicker">Completed</p><h2>Focus sessions</h2></div>
              <span className="session-total">{safeSessions.length} {safeSessions.length === 1 ? 'session' : 'sessions'}</span>
            </div>
            <div className="session-list">
              {safeSessions.slice(-6).reverse().map((session, index) => (
                <div className="session-row" key={session.id ?? `${session.label}-${index}`}>
                  <i style={{ background: session.color }} />
                  <span>{session.label}</span>
                  <strong>{formatMinutes(sessionMinutes(session))}</strong>
                  <small>{session.date ? new Date(`${session.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Complete'}</small>
                </div>
              ))}
              {safeSessions.length === 0 && <p className="empty-state">No sessions logged yet. Start the timer above.</p>}
            </div>
          </GlassPanel>

          <GlassPanel className="ambient-panel">
            <div className="section-heading">
              <div><p className="section-kicker">Sound environment</p><h2>Ambient space</h2></div>
              <button
                className={`ambient-power ${audioEnabled ? 'is-on' : ''}`}
                type="button"
                onClick={() => setAudioEnabled((current) => !current)}
                aria-pressed={audioEnabled}
              >
                {audioEnabled ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
                {audioEnabled ? 'MUTE' : 'SOUND ON'}
              </button>
            </div>
            <div className="ambient-list">
              {ambientOptions.map((option) => (
                <button
                  className={ambient === option.id ? 'is-active' : ''}
                  type="button"
                  key={option.id}
                  onClick={() => chooseAmbient(option.id)}
                  aria-pressed={ambient === option.id}
                >
                  <span className="ambient-pulse"><i /><i /><i /></span>
                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                  <i className="ambient-check" />
                </button>
              ))}
            </div>
            <p className="prototype-note">
              {audioEnabled
                ? 'Sound is synthesized locally in your browser. Keep the volume low.'
                : 'Audio is off. Choose a sound or turn sound on.'}
            </p>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel className="weekly-panel">
        <div className="section-heading">
          <div><p className="section-kicker">Last 7 days</p><h2>Weekly study orbit</h2></div>
          <div className="weekly-total"><strong>{formatMinutes(weekTotal)}</strong><span>Total focus</span></div>
        </div>
        <div className="focus-chart">
          {weekly.map((item) => (
            <div className="focus-bar" key={item.date}>
              <div className="focus-bar__track"><span style={{ height: `${(item.minutes / maxDay) * 100}%` }} /></div>
              <strong>{formatMinutes(item.minutes)}</strong>
              <small>{item.day}</small>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  )
}
