import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import { CosmosScene } from './components/cosmos/CosmosScene'
import { SpaceshipCursor } from './components/cosmos/SpaceshipCursor'
import { PlanetDashboard } from './components/dashboards/PlanetDashboard'
import { PlanetSidebar } from './components/navigation/PlanetSidebar'
import { Onboarding } from './components/onboarding/Onboarding'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { SparkIcon } from './components/ui/Icons'
import { WebGLFallback } from './components/ui/WebGLFallback'
import { useProfile } from './context/profile'
import { planets } from './data/mockData'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useReducedMotion } from './hooks/useReducedMotion'

function CosmosApp() {
  const { planetId } = useParams()
  const navigate = useNavigate()
  const [hoveredPlanet, setHoveredPlanet] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('personal-cosmos:sidebar-open', true)
  const mobile = useMediaQuery('(max-width: 760px)')
  const reducedMotion = useReducedMotion()
  const { profile } = useProfile()
  const activePlanetData = useMemo(() => planets.find((planet) => planet.id === planetId) ?? null, [planetId])

  useEffect(() => {
    if (planetId && !activePlanetData) navigate('/', { replace: true })
  }, [activePlanetData, navigate, planetId])

  useEffect(() => {
    document.title = activePlanetData
      ? `${activePlanetData.name} · Personal Cosmos`
      : 'Personal Cosmos'
  }, [activePlanetData])

  const handleSelect = useCallback((planet) => {
    setHoveredPlanet(null)
    if (activePlanetData?.id === planet.id) return
    setIsClosing(false)
    navigate(`/world/${planet.id}`)
  }, [activePlanetData, navigate])

  const handleBack = useCallback(() => {
    if (activePlanetData && !isClosing) setIsClosing(true)
  }, [activePlanetData, isClosing])

  const handleDashboardExited = useCallback(() => {
    setIsClosing(false)
    setHoveredPlanet(null)
    navigate('/')
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (settingsOpen) {
        setSettingsOpen(false)
        return
      }
      handleBack()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleBack, settingsOpen])

  return (
    <div className={`app-shell ${activePlanetData ? 'has-active-planet' : 'is-cosmos'} ${sidebarOpen ? '' : 'is-sidebar-hidden'}`}>
      <a className="skip-link" href="#world-navigation-panel">Skip to world navigation</a>

      <div className="cosmos-stage">
        <ErrorBoundary>
          <WebGLFallback>
            <CosmosScene
              focusedPlanet={activePlanetData?.id ?? null}
              mobile={mobile}
              reducedMotion={reducedMotion}
              onSelect={handleSelect}
              onHover={setHoveredPlanet}
            />
          </WebGLFallback>
        </ErrorBoundary>
        <div className="cosmos-vignette" aria-hidden="true" />
        <div className="cosmos-grain" aria-hidden="true" />
      </div>

      <PlanetSidebar
        activePlanet={activePlanetData}
        onSelect={handleSelect}
        onHome={handleBack}
        onOpenSettings={() => setSettingsOpen(true)}
        collapsed={!sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />

      <div className={`cosmos-interface ${activePlanetData ? 'is-hidden' : ''}`} aria-hidden={Boolean(activePlanetData)}>
        <div className="top-system-readout">
          <span><i /> LOCAL ORBIT</span>
          <strong>PERSONAL COSMOS</strong>
          <small>CONCEPT BUILD · 01</small>
        </div>

        <section className="cosmos-intro">
          <p className="intro-kicker"><SparkIcon size={15} /> Your life, in motion</p>
          <h1>One system.<br /><span>Seven worlds.</span></h1>
          <p className="intro-copy">Tasks, health, knowledge, and focus—each orbiting the part of you that keeps everything moving.</p>
          <div className="explore-prompt">
            <span className="explore-orbit"><i /></span>
            <p><strong>Explore your cosmos</strong><small>Move your cursor. Select a world.</small></p>
          </div>
        </section>

        <div className="cosmos-bottom-readout">
          <span>01 / DAILY LIFE</span>
          <span className="readout-line" />
          <span>07 / PERSONAL SYSTEM</span>
        </div>
      </div>

      <SpaceshipCursor
        enabled={!activePlanetData && !settingsOpen && profile.onboarded}
        targeted={Boolean(hoveredPlanet)}
        reducedMotion={reducedMotion}
      />

      {activePlanetData && (
        <PlanetDashboard
          key={activePlanetData.id}
          planet={activePlanetData}
          isClosing={isClosing}
          reducedMotion={reducedMotion}
          onBack={handleBack}
          onExited={handleDashboardExited}
        />
      )}

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {!profile.onboarded && <Onboarding />}
    </div>
  )
}

function NotFound() {
  return (
    <div className="app-fallback">
      <div className="app-fallback__card">
        <p className="profile-kicker">Lost orbit</p>
        <h1>This world does not exist.</h1>
        <p>The address may be old, or the planet may have drifted out of range.</p>
        <button className="primary-action" type="button" onClick={() => window.location.assign('/')}>
          RETURN TO COSMOS
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CosmosApp />} />
      <Route path="/world/:planetId" element={<CosmosApp />} />
      <Route path="/cosmos" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
