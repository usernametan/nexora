import { moonMetrics } from '../../data/mockData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { GlassPanel } from '../ui/GlassPanel'

const cycleDays = Array.from({ length: 28 }, (_, index) => index + 1)

const getCyclePhase = (day) => {
  if (day <= 5) return 'period'
  if (day <= 9) return 'phase-one'
  if (day <= 14) return 'fertile'
  if (day <= 18) return 'phase-two'
  if (day <= 22) return 'luteal'
  return 'rest'
}

export function MoonDashboard() {
  const [glasses, setGlasses] = useLocalStorage('personal-cosmos:moon-hydration', 5)
  const hydration = Math.min(8, Math.max(0, Number(glasses) || 0))
  const waterLevel = `${(hydration / 8) * 100}%`
  const metrics = moonMetrics.map((metric) => (
    metric.label === 'Hydration'
      ? { ...metric, value: `${hydration} / 8`, score: Math.round((hydration / 8) * 100) }
      : metric
  ))

  return (
    <div className="dashboard-page moon-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow"><span /> Moon · Personal wellbeing</p>
          <h1>A quieter kind of progress</h1>
          <p className="dashboard-date">Your body, gently observed.</p>
        </div>
        <span className="soft-badge">Saved on this device</span>
      </header>

      <div className="wellness-hero">
        <GlassPanel className="sleep-card">
          <div className="metric-label">Last night’s sleep</div>
          <div className="sleep-value">7<span>h</span> 42<span>m</span></div>
          <div className="sleep-quality"><span /> Restorative · Good</div>
          <div className="sleep-wave" aria-hidden="true">
            {[18, 28, 22, 42, 31, 52, 39, 63, 48, 34, 55, 28, 44, 24, 36, 18].map((height, index) => (
              <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="metric-footer"><span>11:18 PM</span><span>7:00 AM</span></div>
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
              onClick={() => setGlasses((current) => Math.max(0, current - 1))}
              disabled={hydration === 0}
              aria-label="Remove a glass of water"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setGlasses((current) => Math.min(8, current + 1))}
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
              <p className="section-kicker">September 25</p>
              <h2>Daily status</h2>
            </div>
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
        </GlassPanel>

        <GlassPanel className="cycle-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Cycle tracker</p>
              <h2>Month at a glance</h2>
            </div>
            <span className="cycle-day">Day 18</span>
          </div>
          <div className="cycle-track" aria-label="Static 28 day cycle overview">
            {cycleDays.map((day) => (
              <span
                className={`${getCyclePhase(day)} ${day === 18 ? 'is-current' : ''}`}
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
          <p className="wellness-note">A visual reflection only. Not a medical device or diagnosis.</p>
        </GlassPanel>
      </div>
    </div>
  )
}
