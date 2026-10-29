import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { useAuth } from '../../context/auth'
import { BackButton } from '../ui/BackButton'

const dashboards = {
  earth: lazy(() => import('./EarthDashboard').then((module) => ({ default: module.EarthDashboard }))),
  moon: lazy(() => import('./MoonDashboard').then((module) => ({ default: module.MoonDashboard }))),
  mars: lazy(() => import('./MarsDashboard').then((module) => ({ default: module.MarsDashboard }))),
  saturn: lazy(() => import('./SaturnDashboard').then((module) => ({ default: module.SaturnDashboard }))),
  mercury: lazy(() => import('./MercuryDashboard').then((module) => ({ default: module.MercuryDashboard }))),
  jupiter: lazy(() => import('./JupiterDashboard').then((module) => ({ default: module.JupiterDashboard }))),
  neptune: lazy(() => import('./NeptuneDashboard').then((module) => ({ default: module.NeptuneDashboard }))),
}

function DashboardLoading() {
  return (
    <div className="dashboard-loading" role="status" aria-live="polite">
      <span />
      <p>Aligning orbit…</p>
    </div>
  )
}

export function PlanetDashboard({ planet, isClosing, reducedMotion, onBack, onExited }) {
  const shellRef = useRef(null)
  const { signedIn } = useAuth()
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
      style={{ '--planet-accent': planet.color }}
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
          {Dashboard ? (
            <Suspense fallback={<DashboardLoading />}>
              <Dashboard />
            </Suspense>
          ) : (
            <DashboardLoading />
          )}
          <footer className="dashboard-footer">
            <span>PERSONAL COSMOS</span>
            <span>{signedIn ? 'CLOUD SYNC ACTIVE · PRIVATE' : 'PRIVATE · SAVED ON THIS DEVICE'}</span>
          </footer>
        </div>
      </div>
    </section>
  )
}
