import { activePlanets, lockedPlanets } from '../../data/mockData'
import { LockIcon, OrbitIcon } from '../ui/Icons'

function PlanetGlyph({ planet }) {
  return (
    <span className={`mini-planet mini-planet--${planet.id}`} style={{ '--planet-color': planet.color }} aria-hidden="true">
      <i />
      {planet.id === 'saturn' && <b />}
    </span>
  )
}

export function PlanetSidebar({ activePlanet, onSelect, onHome }) {
  return (
    <aside className="planet-sidebar">
      <button className="brand-mark" type="button" onClick={onHome} disabled={!activePlanet} aria-label="Return to cosmos">
        <OrbitIcon size={25} />
        <span>PC</span>
      </button>

      <div className="sidebar-rule" />
      <p className="sidebar-label">World navigation</p>

      <nav className="planet-nav" aria-label="Planet navigation">
        <div className="planet-nav__group">
          {activePlanets.map((planet) => {
            const isActive = activePlanet?.id === planet.id
            return (
              <button
                className={`planet-nav__item ${isActive ? 'is-active' : ''}`}
                type="button"
                key={planet.id}
                onClick={() => onSelect(planet)}
                aria-current={isActive ? 'page' : undefined}
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

        {lockedPlanets.length > 0 && (
          <>
            <div className="planet-nav__divider"><span>Future orbits</span></div>

            <div className="planet-nav__group is-locked">
              {lockedPlanets.map((planet) => (
                <button
                  className="planet-nav__item is-locked"
                  type="button"
                  key={planet.id}
                  onClick={() => onSelect(planet)}
                  style={{ '--planet-color': planet.color }}
                >
                  <PlanetGlyph planet={planet} />
                  <span className="planet-nav__copy">
                    <strong>{planet.name}</strong>
                    <small>{planet.module}</small>
                  </span>
                  <LockIcon size={12} />
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-system">
        <div className="system-signal"><i /><i /><i /><i /></div>
        <span><strong>System online</strong><small>7 worlds connected</small></span>
      </div>
    </aside>
  )
}
