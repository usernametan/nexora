import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProfile } from '../../context/profile'
import { useToast } from '../../context/toast'
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
import { PauseIcon, PlayIcon, ResetIcon, TrashIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const TIMER_DURATION = 25 * 60
const SECONDS_KEY = 'personal-cosmos:saturn-seconds'
const END_AT_KEY = 'personal-cosmos:saturn-end-at'
const SESSIONS_KEY = 'personal-cosmos:saturn-sessions'

const formatTimer = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

const initialSeconds = () => {
  const stored = readStoredValue(SECONDS_KEY, TIMER_DURATION)
  if (typeof stored !== 'number' || !Number.isFinite(stored)) return TIMER_DURATION
  return Math.min(TIMER_DURATION, Math.max(0, stored))
}

export function SaturnDashboard() {
  const { profile } = useProfile()
  const { showToast } = useToast()
  const today = useCurrentDay(profile.timezone)
  const [seconds, setSeconds] = useState(initialSeconds)
  const [endAt, setEndAt] = useLocalStorage(END_AT_KEY, null)
  const [sessions, setSessions] = useLocalStorage(dailyStorageKey(SESSIONS_KEY, today), [])
  const [ambient, setAmbient] = useLocalStorage('personal-cosmos:saturn-ambient', 'space')
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [notifications, setNotifications] = useState(() => (
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  ))
  const secondsRef = useRef(seconds)
  const completionRef = useRef(false)
  const running = Boolean(endAt)
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

  const notifyCompletion = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return
      let permission = Notification.permission
      if (permission === 'default') permission = await Notification.requestPermission()
      setNotifications(permission)
      if (permission !== 'granted') return
      new Notification('Focus session complete', {
        body: 'Twenty-five protected minutes are in the log. Take a short reset.',
        icon: '/favicon.svg',
        tag: 'personal-cosmos-focus',
      })
    } catch {
      // Notification permission errors are non-fatal.
    }
  }, [])

  const completeSession = useCallback(() => {
    if (completionRef.current) return
    completionRef.current = true
    setEndAt(null)
    setSeconds(0)
    writeStoredValue(SECONDS_KEY, 0)
    setSessions((current) => [...(Array.isArray(current) ? current : []), {
      id: createId('focus'),
      label: 'Focus',
      minutes: 25,
      color: '#d9ab72',
      date: today,
    }])
    showToast('Focus session complete. Twenty-five minutes logged.', { tone: 'success' })
    notifyCompletion()
    window.setTimeout(() => { completionRef.current = false }, 1000)
  }, [notifyCompletion, setEndAt, setSessions, showToast, today])

  useEffect(() => {
    if (!endAt) return undefined
    let interval
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setSeconds(next)
      if (next <= 0) {
        completeSession()
        window.clearInterval(interval)
      }
    }
    tick()
    interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [completeSession, endAt])

  const timerProgress = useMemo(() => {
    const elapsed = TIMER_DURATION - seconds
    return `${(elapsed / TIMER_DURATION) * 360}deg`
  }, [seconds])

  const toggleTimer = () => {
    if (running) {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setEndAt(null)
      setSeconds(remaining)
      writeStoredValue(SECONDS_KEY, remaining)
      return
    }
    const nextSeconds = seconds === 0 ? TIMER_DURATION : seconds
    setSeconds(nextSeconds)
    setEndAt(Date.now() + nextSeconds * 1000)
    writeStoredValue(SECONDS_KEY, nextSeconds)
    notifyCompletion()
  }

  const resetTimer = () => {
    setEndAt(null)
    setSeconds(TIMER_DURATION)
    writeStoredValue(SECONDS_KEY, TIMER_DURATION)
  }

  const chooseAmbient = (optionId) => {
    setAmbient(optionId)
    setAudioEnabled(true)
  }

  const removeSession = (sessionId) => {
    const removed = safeSessions.find((session) => session.id === sessionId)
    setSessions((current) => (Array.isArray(current) ? current : []).filter((session) => session.id !== sessionId))
    if (removed) {
      showToast('Session removed', {
        actionLabel: 'Undo',
        onAction: () => setSessions((current) => [...(Array.isArray(current) ? current : []), removed]),
      })
    }
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
            {notifications !== 'granted' && notifications !== 'unsupported' && (
              <button className="secondary-action" type="button" onClick={notifyCompletion}>
                ENABLE ALERTS
              </button>
            )}
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
                  {session.id && (
                    <button
                      className="icon-action icon-action--danger session-delete"
                      type="button"
                      onClick={() => removeSession(session.id)}
                      aria-label={`Delete ${session.label} session`}
                    >
                      <TrashIcon size={12} />
                    </button>
                  )}
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
