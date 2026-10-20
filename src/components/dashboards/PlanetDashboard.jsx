import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { BackButton } from '../ui/BackButton'
import { EarthDashboard } from './EarthDashboard'
import { MoonDashboard } from './MoonDashboard'
import { MarsDashboard } from './MarsDashboard'
import { SaturnDashboard } from './SaturnDashboard'
import { MercuryDashboard } from './MercuryDashboard'
import { JupiterDashboard } from './JupiterDashboard'
import { NeptuneDashboard } from './NeptuneDashboard'

const dashboards = {
  earth: EarthDashboard,
  moon: MoonDashboard,
  mars: MarsDashboard,
  saturn: SaturnDashboard,
  mercury: MercuryDashboard,
  jupiter: JupiterDashboard,
  neptune: NeptuneDashboard,
}

export function PlanetDashboard({ planet, isClosing, reducedMotion, onBack, onExited }) {
  const shellRef = useRef(null)
  const Dashboard = dashboards[planet.id]

  useLayoutEffect(() => {
    const shell = shellRef.current
    if (!shell) return undefined

    if (reducedMotion) {
      gsap.set(shell, { autoAlpha: isClosing ? 0 : 1, x: 0, filter: 'blur(0px)' })
      if (isClosing) onExited()
      return undefined
    }

    if (isClosing) {
      gsap.to(shell, {
        x: -70,
        autoAlpha: 0,
        filter: 'blur(12px)',
        duration: 0.55,
        ease: 'power3.inOut',
        onComplete: onExited,
      })
    } else {
      gsap.fromTo(
        shell,
        { x: -70, autoAlpha: 0, filter: 'blur(12px)' },
        { x: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1.05, delay: 0.48, ease: 'power3.out' },
      )
    }

    return () => gsap.killTweensOf(shell)
  }, [isClosing, onExited, reducedMotion])

  return (
    <section
      ref={shellRef}
      className={`planet-dashboard planet-dashboard--${planet.id} ${isClosing ? 'is-closing' : ''}`}
      aria-label={`${planet.name} ${planet.module} dashboard`}
    >
      <div className="dashboard-vignette" />
      <div className="dashboard-shell">
        <div className="dashboard-topbar">
          <BackButton onClick={onBack} disabled={isClosing} />
          <div className="dashboard-coordinate">
            <span>{planet.name.toUpperCase()}</span>
            <i />
            <span>{planet.module.toUpperCase()}</span>
          </div>
        </div>
        <div className="dashboard-scroll">
          <Dashboard />
          <footer className="dashboard-footer">
            <span>PERSONAL COSMOS</span>
            <span>LOCAL PROTOTYPE · SAVED ON THIS DEVICE</span>
          </footer>
        </div>
      </div>
    </section>
  )
}
