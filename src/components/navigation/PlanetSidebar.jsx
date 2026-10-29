import { planets } from '../../data/mockData'
import { useAuth } from '../../context/auth'
import { ChevronRightIcon, OrbitIcon, SettingsIcon } from '../ui/Icons'

function PlanetGlyph({ planet }) {
  return (
    <span className={`mini-planet mini-planet--${planet.id}`} style={{ '--planet-color': planet.color }} aria-hidden="true">
      <i />
      {planet.id === 'saturn' && <b />}
    </span>
  )
}

export function PlanetSidebar({ activePlanet, onSelect, onHome, onOpenSettings, collapsed, onToggleSidebar }) {
  const toggleLabel = collapsed ? 'Show navigation panel' : 'Hide navigation panel'
  const { signedIn, status } = useAuth()
  const syncLabel = signedIn
    ? status.state === 'synced'
      ? 'Cloud synced'
      : status.state === 'syncing'
        ? 'Syncing…'
        : status.state === 'error'
          ? 'Sync issue'
          : 'Saved locally'
    : 'Local only'

  return (
    <>
      <aside id="world-navigation-panel" className={`planet-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="World navigation">
        <button className="brand-mark" type="button" onClick={onHome} disabled={!activePlanet} aria-label="PC — Return to cosmos">
          <OrbitIcon size={25} />
          <span>PC</span>
        </button>

        <div className="sidebar-rule" />
        <p className="sidebar-label">World navigation</p>

        <nav className="planet-nav" aria-label="Planet navigation">
          <div className="planet-nav__group">
            {planets.map((planet) => {
              const isActive = activePlanet?.id === planet.id
              return (
                <button
                  className={`planet-nav__item ${isActive ? 'is-active' : ''}`}
                  type="button"
                  key={planet.id}
                  onClick={() => onSelect(planet)}
                  aria-current={isActive ? 'page' : undefined}
                  title={`${planet.name} — ${planet.module}`}
                  style={{ '--planet-color': planet.color }}
                >
                  <PlanetGlyph planet={planet} />
                  <span className="planet-nav__copy">
                    <strong>{planet.name}</strong>
                    <small>{planet.module}</small>
                  </span>
                  <i className="nav-active-dot" />
                </button>
              )
            })}
          </div>
        </nav>

        <div className="sidebar-system">
          <div className="system-signal"><i /><i /><i /><i /></div>
          <span>
            <strong>System online</strong>
            <small aria-live="polite">{syncLabel}</small>
          </span>
          <button className="sidebar-settings" type="button" onClick={onOpenSettings} aria-label="Open personal settings">
            <SettingsIcon size={14} />
          </button>
        </div>
      </aside>

      <button
        className={`sidebar-toggle ${collapsed ? 'is-collapsed' : ''}`}
        type="button"
        onClick={onToggleSidebar}
        aria-label={toggleLabel}
        aria-controls="world-navigation-panel"
        aria-expanded={!collapsed}
        title={toggleLabel}
      >
        <ChevronRightIcon size={14} />
      </button>
    </>
  )
}
