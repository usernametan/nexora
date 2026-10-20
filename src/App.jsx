import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { CosmosScene } from './components/cosmos/CosmosScene'
import { SpaceshipCursor } from './components/cosmos/SpaceshipCursor'
import { LockedPlanet } from './components/dashboards/LockedPlanet'
import { PlanetDashboard } from './components/dashboards/PlanetDashboard'
import { PlanetSidebar } from './components/navigation/PlanetSidebar'
import { Onboarding } from './components/onboarding/Onboarding'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { SparkIcon } from './components/ui/Icons'
import { ProfileProvider } from './context/ProfileContext'
import { useProfile } from './context/profile'
import { planets } from './data/mockData'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useReducedMotion } from './hooks/useReducedMotion'

function CosmosApp() {
  const [activePlanet, setActivePlanet] = useState(null)
  const [lockedPlanet, setLockedPlanet] = useState(null)
  const [hoveredPlanet, setHoveredPlanet] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const mobile = useMediaQuery('(max-width: 760px)')
  const reducedMotion = useReducedMotion()
  const { profile } = useProfile()
  const activePlanetData = useMemo(() => planets.find((planet) => planet.id === activePlanet) ?? null, [activePlanet])

  const handleSelect = useCallback((planet) => {
    setHoveredPlanet(null)
    if (planet.locked) {
      setLockedPlanet(planet)
      return
    }
    if (activePlanet === planet.id) return
    setIsClosing(false)
    setActivePlanet(planet.id)
  }, [activePlanet])

  const handleBack = useCallback(() => {
    if (activePlanet && !isClosing) setIsClosing(true)
  }, [activePlanet, isClosing])

  const handleDashboardExited = useCallback(() => {
    setActivePlanet(null)
    setIsClosing(false)
    setHoveredPlanet(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (settingsOpen) {
        setSettingsOpen(false)
        return
      }
      if (lockedPlanet) setLockedPlanet(null)
      else handleBack()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleBack, lockedPlanet, settingsOpen])

  return (
    <div className={`app-shell ${activePlanetData ? 'has-active-planet' : 'is-cosmos'}`}>
      <div className="cosmos-stage">
        <CosmosScene
          focusedPlanet={activePlanet}
          mobile={mobile}
          reducedMotion={reducedMotion}
          onSelect={handleSelect}
          onHover={setHoveredPlanet}
        />
        <div className="cosmos-vignette" aria-hidden="true" />
        <div className="cosmos-grain" aria-hidden="true" />
      </div>

      <PlanetSidebar
        activePlanet={activePlanetData}
        onSelect={handleSelect}
        onHome={handleBack}
        onOpenSettings={() => setSettingsOpen(true)}
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
        enabled={!activePlanetData && !lockedPlanet && !settingsOpen && profile.onboarded}
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

      {lockedPlanet && (
        <LockedPlanet
          key={lockedPlanet.id}
          planet={lockedPlanet}
          reducedMotion={reducedMotion}
          onClose={() => setLockedPlanet(null)}
        />
      )}

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {!profile.onboarded && <Onboarding />}
    </div>
  )
}

export default function App() {
  return (
    <ProfileProvider>
      <CosmosApp />
    </ProfileProvider>
  )
}
