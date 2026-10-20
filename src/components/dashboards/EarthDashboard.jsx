import { calendarEvents, earthTasks, timeline } from '../../data/mockData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { CheckIcon, ClockIcon } from '../ui/Icons'
import { GlassPanel } from '../ui/GlassPanel'

const calendarCells = Array.from({ length: 35 }, (_, index) => {
  const day = index - 1
  return day > 0 && day <= 30 ? day : null
})

export function EarthDashboard() {
  const [completedIds, setCompletedIds] = useLocalStorage(
    'personal-cosmos:earth-completed',
    () => earthTasks.filter((task) => task.done).map((task) => task.id),
  )
  const completed = new Set(completedIds)
  const completion = Math.round((completed.size / earthTasks.length) * 100)

  const toggleTask = (taskId) => {
    setCompletedIds((current) => (
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    ))
  }

  return (
    <div className="dashboard-page earth-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span /> Earth · Daily execution</p>
          <h1>Good morning, Tan</h1>
          <p className="dashboard-date">Friday, September 25</p>
        </div>
        <div className="day-progress" aria-label={`${completion}% of tasks complete`}>
          <div className="day-progress__value">{completed.size}<span>/{earthTasks.length}</span></div>
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
            <span className="section-count">{completed.size} complete</span>
          </div>
          <div className="task-list">
            {earthTasks.map((task) => {
              const isDone = completed.has(task.id)
              return (
                <button
                  className={`task-row ${isDone ? 'is-complete' : ''}`}
                  type="button"
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  aria-pressed={isDone}
                >
                  <span className="task-check"><CheckIcon /></span>
                  <span className="task-copy">
                    <strong>{task.title}</strong>
                    <small>{task.meta}</small>
                  </span>
                  <span className="task-orbit" />
                </button>
              )
            })}
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
              <p className="section-kicker">September 2026</p>
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
                  className={`calendar-day ${day === 25 ? 'is-today' : ''} ${event ? 'has-event' : ''}`}
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
