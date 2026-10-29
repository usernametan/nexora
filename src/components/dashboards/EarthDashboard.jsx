import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '../../context/profile'
import { useToast } from '../../context/toast'
import { earthEvents, earthTasks, timeline as seedTimeline } from '../../data/mockData'
import { dailyStorageKey, useCurrentDay, useLocalStorage } from '../../hooks/useLocalStorage'
import { createId, formatLongDate, formatMonthYear, greetingFor, monthGrid } from '../../utils/format'
import { CheckIcon, ClockIcon, EditIcon, PlusIcon, TrashIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const emptyTask = { title: '', meta: '' }
const emptyEvent = (date) => ({ title: '', date, tone: 'blue' })
const emptyTimeline = { time: '09:00', title: '', detail: '' }
const tones = ['blue', 'violet', 'warm', 'cyan', 'green', 'orange', 'red']

export function EarthDashboard() {
  const { profile } = useProfile()
  const { showToast } = useToast()
  const today = useCurrentDay(profile.timezone)
  const [now, setNow] = useState(() => new Date())
  const [initialized, setInitialized] = useLocalStorage('personal-cosmos:earth-initialized', false)
  const [tasks, setTasks] = useLocalStorage(
    dailyStorageKey('personal-cosmos:earth-tasks', today),
    initialized ? [] : earthTasks,
  )
  const [events, setEvents] = useLocalStorage('personal-cosmos:earth-events', earthEvents)
  const [timelineItems, setTimelineItems] = useLocalStorage('personal-cosmos:earth-timeline', seedTimeline)
  const [taskDraft, setTaskDraft] = useState(emptyTask)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [eventDraft, setEventDraft] = useState(() => emptyEvent(today))
  const [editingEventId, setEditingEventId] = useState(null)
  const [timelineDraft, setTimelineDraft] = useState(emptyTimeline)
  const [editingTimelineId, setEditingTimelineId] = useState(null)
  const calendarCells = monthGrid(today)
  const todayDay = Number(today.slice(8, 10))
  const monthPrefix = today.slice(0, 7)
  const greeting = greetingFor(now, profile.timezone)
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const safeEvents = Array.isArray(events) ? events : earthEvents
  const safeTimeline = Array.isArray(timelineItems) ? timelineItems : seedTimeline
  const completedCount = safeTasks.filter((task) => task.done).length
  const completion = safeTasks.length ? Math.round((completedCount / safeTasks.length) * 100) : 0
  const monthEvents = useMemo(() => (
    [...safeEvents]
      .filter((event) => String(event.date).startsWith(monthPrefix))
      .sort((first, second) => String(first.date).localeCompare(String(second.date)))
  ), [monthPrefix, safeEvents])
  const sortedTimeline = useMemo(() => (
    [...safeTimeline].sort((first, second) => String(first.time).localeCompare(String(second.time)))
  ), [safeTimeline])

  useEffect(() => {
    if (!initialized) setInitialized(true)
  }, [initialized, setInitialized])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const toggleTask = (taskId) => {
    setTasks((current) => (Array.isArray(current) ? current : []).map((task) => (
      task.id === taskId ? { ...task, done: !task.done } : task
    )))
  }

  const startTaskEdit = (task) => {
    setEditingTaskId(task.id)
    setTaskDraft({ title: task.title, meta: task.meta ?? '' })
  }

  const cancelTaskEdit = () => {
    setEditingTaskId(null)
    setTaskDraft(emptyTask)
  }

  const submitTask = (event) => {
    event.preventDefault()
    const title = taskDraft.title.trim()
    if (!title) return
    const meta = taskDraft.meta.trim() || 'Personal · No estimate'
    if (editingTaskId) {
      setTasks((current) => (Array.isArray(current) ? current : []).map((task) => (
        task.id === editingTaskId ? { ...task, title, meta } : task
      )))
    } else {
      setTasks((current) => [...(Array.isArray(current) ? current : []), {
        id: createId('task'),
        title,
        meta,
        done: false,
      }])
    }
    cancelTaskEdit()
  }

  const removeTask = (taskId) => {
    const removed = safeTasks.find((task) => task.id === taskId)
    setTasks((current) => (Array.isArray(current) ? current : []).filter((task) => task.id !== taskId))
    if (editingTaskId === taskId) cancelTaskEdit()
    if (removed) {
      showToast(`Deleted “${removed.title}”`, {
        actionLabel: 'Undo',
        onAction: () => setTasks((current) => [...(Array.isArray(current) ? current : []), removed]),
      })
    }
  }

  const startEventEdit = (item) => {
    setEditingEventId(item.id)
    setEventDraft({ title: item.title, date: item.date, tone: item.tone ?? 'blue' })
  }

  const cancelEventEdit = () => {
    setEditingEventId(null)
    setEventDraft(emptyEvent(today))
  }

  const submitEvent = (event) => {
    event.preventDefault()
    const title = eventDraft.title.trim()
    if (!title || !eventDraft.date) return
    const next = { title, date: eventDraft.date, tone: eventDraft.tone }
    if (editingEventId) {
      setEvents((current) => (Array.isArray(current) ? current : earthEvents).map((item) => (
        item.id === editingEventId ? { ...item, ...next } : item
      )))
    } else {
      setEvents((current) => [...(Array.isArray(current) ? current : earthEvents), { id: createId('event'), ...next }])
    }
    cancelEventEdit()
  }

  const removeEvent = (eventId) => {
    const removed = safeEvents.find((item) => item.id === eventId)
    setEvents((current) => (Array.isArray(current) ? current : earthEvents).filter((item) => item.id !== eventId))
    if (editingEventId === eventId) cancelEventEdit()
    if (removed) {
      showToast(`Deleted “${removed.title}”`, {
        actionLabel: 'Undo',
        onAction: () => setEvents((current) => [...(Array.isArray(current) ? current : earthEvents), removed]),
      })
    }
  }

  const startTimelineEdit = (item) => {
    setEditingTimelineId(item.id)
    setTimelineDraft({ time: item.time, title: item.title, detail: item.detail ?? '' })
  }

  const cancelTimelineEdit = () => {
    setEditingTimelineId(null)
    setTimelineDraft(emptyTimeline)
  }

  const submitTimeline = (event) => {
    event.preventDefault()
    const title = timelineDraft.title.trim()
    if (!title || !timelineDraft.time) return
    const next = {
      time: timelineDraft.time,
      title,
      detail: timelineDraft.detail.trim(),
      tone: 'blue',
    }
    if (editingTimelineId) {
      setTimelineItems((current) => (Array.isArray(current) ? current : seedTimeline).map((item) => (
        item.id === editingTimelineId ? { ...item, ...next } : item
      )))
    } else {
      setTimelineItems((current) => [...(Array.isArray(current) ? current : seedTimeline), { id: createId('timeline'), ...next }])
    }
    cancelTimelineEdit()
  }

  const removeTimeline = (itemId) => {
    const removed = safeTimeline.find((item) => item.id === itemId)
    setTimelineItems((current) => (Array.isArray(current) ? current : seedTimeline).filter((item) => item.id !== itemId))
    if (editingTimelineId === itemId) cancelTimelineEdit()
    if (removed) {
      showToast(`Deleted “${removed.title}”`, {
        actionLabel: 'Undo',
        onAction: () => setTimelineItems((current) => [...(Array.isArray(current) ? current : seedTimeline), removed]),
      })
    }
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

          <form className={`item-form task-composer ${editingTaskId ? 'is-editing' : ''}`} onSubmit={submitTask}>
            <div className="field-row">
              <input
                className="field-input"
                type="text"
                value={taskDraft.title}
                onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder={editingTaskId ? 'Edit task title' : 'Add a task'}
                aria-label="Task title"
              />
              <button className="mini-action" type="submit" disabled={!taskDraft.title.trim()}>
                {editingTaskId ? <CheckIcon /> : <PlusIcon />}
                {editingTaskId ? 'Save' : 'Add'}
              </button>
            </div>
            <div className="field-row">
              <input
                className="field-input field-input--quiet"
                type="text"
                value={taskDraft.meta}
                onChange={(event) => setTaskDraft((current) => ({ ...current, meta: event.target.value }))}
                placeholder="Category · estimate (optional)"
                aria-label="Task detail"
              />
              {editingTaskId && (
                <button className="text-action" type="button" onClick={cancelTaskEdit}>Cancel</button>
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
                    <button className="icon-action" type="button" onClick={() => startTaskEdit(task)} aria-label={`Edit ${task.title}`}>
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
            {sortedTimeline.map((item) => (
              <div className="timeline-row" key={item.id ?? item.time}>
                <time>{item.time}</time>
                <span className={`timeline-dot tone-${item.tone}`} />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
                <div className="row-actions">
                  <button className="icon-action" type="button" onClick={() => startTimelineEdit(item)} aria-label={`Edit ${item.title}`}>
                    <EditIcon />
                  </button>
                  <button className="icon-action icon-action--danger" type="button" onClick={() => removeTimeline(item.id)} aria-label={`Delete ${item.title}`}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form className="compact-form" onSubmit={submitTimeline}>
            <div className="field-row">
              <input
                className="field-input field-input--date compact-time"
                type="time"
                value={timelineDraft.time}
                onChange={(event) => setTimelineDraft((current) => ({ ...current, time: event.target.value }))}
                aria-label="Schedule time"
              />
              <input
                className="field-input"
                type="text"
                value={timelineDraft.title}
                onChange={(event) => setTimelineDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder={editingTimelineId ? 'Edit block title' : 'Add a time block'}
                aria-label="Schedule title"
              />
              <button
                className="mini-action"
                type="submit"
                disabled={!timelineDraft.title.trim()}
                aria-label={editingTimelineId ? 'Save schedule item' : 'Add schedule item'}
              >
                {editingTimelineId ? <CheckIcon /> : <PlusIcon />}
              </button>
            </div>
            <div className="field-row">
              <input
                className="field-input field-input--quiet"
                type="text"
                value={timelineDraft.detail}
                onChange={(event) => setTimelineDraft((current) => ({ ...current, detail: event.target.value }))}
                placeholder="Detail (optional)"
                aria-label="Schedule detail"
              />
              {editingTimelineId && (
                <button className="text-action" type="button" onClick={cancelTimelineEdit}>Cancel</button>
              )}
            </div>
          </form>
        </GlassPanel>

        <GlassPanel className="calendar-panel">
          <div className="section-heading calendar-heading">
            <div>
              <p className="section-kicker">{formatMonthYear(today)}</p>
              <h2>Mission calendar</h2>
            </div>
            <div className="calendar-legend"><span /> {monthEvents.length} scheduled</div>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid">
            {calendarCells.map((day, index) => {
              const date = day ? `${monthPrefix}-${String(day).padStart(2, '0')}` : null
              const dayEvents = date ? safeEvents.filter((event) => event.date === date) : []
              return (
                <div
                  className={`calendar-day ${day === todayDay ? 'is-today' : ''} ${dayEvents.length ? 'has-event' : ''}`}
                  key={`${day ?? 'blank'}-${index}`}
                  title={dayEvents.map((event) => event.title).join(', ')}
                >
                  {day && <span>{day}</span>}
                  {dayEvents.slice(0, 1).map((event) => (
                    <small className={`event-${event.tone}`} key={event.id}>{event.title}</small>
                  ))}
                  {dayEvents.length > 1 && <small className="event-more">+{dayEvents.length - 1}</small>}
                </div>
              )
            })}
          </div>

          <div className="calendar-agenda">
            {monthEvents.map((event) => (
              <div className="agenda-row" key={event.id}>
                <span className={`timeline-dot tone-${event.tone}`} />
                <div>
                  <strong>{event.title}</strong>
                  <small>{new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                </div>
                <div className="row-actions">
                  <button className="icon-action" type="button" onClick={() => startEventEdit(event)} aria-label={`Edit ${event.title}`}>
                    <EditIcon />
                  </button>
                  <button className="icon-action icon-action--danger" type="button" onClick={() => removeEvent(event.id)} aria-label={`Delete ${event.title}`}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
            {monthEvents.length === 0 && <p className="empty-state">Nothing scheduled this month.</p>}
          </div>

          <form className="compact-form" onSubmit={submitEvent}>
            <div className="field-row">
              <input
                className="field-input"
                type="text"
                value={eventDraft.title}
                onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder={editingEventId ? 'Edit event' : 'Add an event'}
                aria-label="Calendar event title"
              />
              <input
                className="field-input field-input--date compact-date"
                type="date"
                value={eventDraft.date}
                onChange={(event) => setEventDraft((current) => ({ ...current, date: event.target.value }))}
                aria-label="Calendar event date"
              />
            </div>
            <div className="field-row">
              <select
                className="field-input field-select compact-select"
                value={eventDraft.tone}
                onChange={(event) => setEventDraft((current) => ({ ...current, tone: event.target.value }))}
                aria-label="Calendar event color"
              >
                {tones.map((tone) => <option value={tone} key={tone}>{tone}</option>)}
              </select>
              <button className="mini-action" type="submit" disabled={!eventDraft.title.trim() || !eventDraft.date}>
                {editingEventId ? <CheckIcon /> : <PlusIcon />}
                {editingEventId ? 'Save' : 'Add event'}
              </button>
              {editingEventId && (
                <button className="text-action" type="button" onClick={cancelEventEdit}>Cancel</button>
              )}
            </div>
          </form>
        </GlassPanel>
      </div>
    </div>
  )
}
