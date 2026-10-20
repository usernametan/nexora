import { useEffect, useState } from 'react'
import { useProfile } from '../../context/profile'
import { calendarEvents, earthTasks, timeline } from '../../data/mockData'
import { dailyStorageKey, useCurrentDay, useLocalStorage } from '../../hooks/useLocalStorage'
import { createId, formatLongDate, formatMonthYear, greetingFor, monthGrid } from '../../utils/format'
import { CheckIcon, ClockIcon, EditIcon, PlusIcon, TrashIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const emptyDraft = { title: '', meta: '' }

export function EarthDashboard() {
  const { profile } = useProfile()
  const today = useCurrentDay(profile.timezone)
  const [now, setNow] = useState(() => new Date())
  const [tasks, setTasks] = useLocalStorage(dailyStorageKey('personal-cosmos:earth-tasks', today), earthTasks)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const calendarCells = monthGrid(today)
  const todayDay = Number(today.slice(8, 10))
  const greeting = greetingFor(now, profile.timezone)
  const safeTasks = Array.isArray(tasks) ? tasks : earthTasks
  const completedCount = safeTasks.filter((task) => task.done).length
  const completion = safeTasks.length ? Math.round((completedCount / safeTasks.length) * 100) : 0

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const toggleTask = (taskId) => {
    setTasks((current) => (Array.isArray(current) ? current : earthTasks).map((task) => (
      task.id === taskId ? { ...task, done: !task.done } : task
    )))
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setDraft({ title: task.title, meta: task.meta ?? '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  const submitTask = (event) => {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    const meta = draft.meta.trim() || 'Personal · No estimate'
    if (editingId) {
      setTasks((current) => (Array.isArray(current) ? current : earthTasks).map((task) => (
        task.id === editingId ? { ...task, title, meta } : task
      )))
    } else {
      setTasks((current) => [...(Array.isArray(current) ? current : earthTasks), {
        id: createId('task'),
        title,
        meta,
        done: false,
      }])
    }
    cancelEdit()
  }

  const removeTask = (taskId) => {
    setTasks((current) => (Array.isArray(current) ? current : earthTasks).filter((task) => task.id !== taskId))
    if (editingId === taskId) cancelEdit()
  }

  return (
    <div className="dashboard-page earth-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span /> Earth · Daily execution</p>
          <h1>{greeting}{profile.name ? `, ${profile.name}` : ''}</h1>
          <p className="dashboard-date">{formatLongDate(today)}</p>
        </div>
        <div className="day-progress" aria-label={`${completion}% of tasks complete`}>
          <div className="day-progress__value">{completedCount}<span>/{safeTasks.length}</span></div>
          <div className="day-progress__track"><span style={{ width: `${completion}%` }} /></div>
          <small>Daily momentum</small>
        </div>
      </header>

      <div className="earth-layout">
        <GlassPanel className="task-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Priority signal</p>
              <h2>Must do today</h2>
            </div>
            <span className="section-count">{completedCount} complete</span>
          </div>

          <form className={`item-form task-composer ${editingId ? 'is-editing' : ''}`} onSubmit={submitTask}>
            <div className="field-row">
              <input
                className="field-input"
                type="text"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder={editingId ? 'Edit task title' : 'Add a task'}
                aria-label="Task title"
              />
              <button className="mini-action" type="submit" disabled={!draft.title.trim()}>
                {editingId ? <CheckIcon /> : <PlusIcon />}
                {editingId ? 'Save' : 'Add'}
              </button>
            </div>
            <div className="field-row">
              <input
                className="field-input field-input--quiet"
                type="text"
                value={draft.meta}
                onChange={(event) => setDraft((current) => ({ ...current, meta: event.target.value }))}
                placeholder="Category · estimate (optional)"
                aria-label="Task detail"
              />
              {editingId && (
                <button className="text-action" type="button" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>

          <div className="task-list">
            {safeTasks.map((task) => {
              const isDone = Boolean(task.done)
              return (
                <div className={`task-row ${isDone ? 'is-complete' : ''}`} key={task.id}>
                  <button
                    className="task-toggle"
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    aria-pressed={isDone}
                  >
                    <span className="task-check"><CheckIcon /></span>
                    <span className="task-copy">
                      <strong>{task.title}</strong>
                      <small>{task.meta}</small>
                    </span>
                  </button>
                  <div className="row-actions">
                    <button className="icon-action" type="button" onClick={() => startEdit(task)} aria-label={`Edit ${task.title}`}>
                      <EditIcon />
                    </button>
                    <button className="icon-action icon-action--danger" type="button" onClick={() => removeTask(task.id)} aria-label={`Delete ${task.title}`}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )
            })}
            {safeTasks.length === 0 && <p className="empty-state">No tasks yet. Capture the next small step above.</p>}
          </div>
        </GlassPanel>

        <GlassPanel className="timeline-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Time architecture</p>
              <h2>Today’s orbit</h2>
            </div>
            <ClockIcon />
          </div>
          <div className="timeline-list">
            {timeline.map((item) => (
              <div className="timeline-row" key={item.time}>
                <time>{item.time}</time>
                <span className={`timeline-dot tone-${item.tone}`} />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="calendar-panel">
          <div className="section-heading calendar-heading">
            <div>
              <p className="section-kicker">{formatMonthYear(today)}</p>
              <h2>Mission calendar</h2>
            </div>
            <div className="calendar-legend"><span /> Scheduled</div>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid">
            {calendarCells.map((day, index) => {
              const event = day ? calendarEvents[day] : null
              return (
                <div
                  className={`calendar-day ${day === todayDay ? 'is-today' : ''} ${event ? 'has-event' : ''}`}
                  key={`${day ?? 'blank'}-${index}`}
                >
                  {day && <span>{day}</span>}
                  {event && <small className={`event-${event.tone}`} title={event.label}>{event.label}</small>}
                </div>
              )
            })}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
