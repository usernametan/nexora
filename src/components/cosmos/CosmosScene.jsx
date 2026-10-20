import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { planets } from '../../data/mockData'
import { CameraRig } from './CameraRig'
import { OrbitingPlanet } from './OrbitingPlanet'
import { StarField } from './StarField'
import { Sun } from './Sun'

const mobilePlanetIds = new Set(['earth', 'moon', 'mars', 'saturn', 'mercury', 'jupiter', 'neptune'])

export function CosmosScene({ focusedPlanet, mobile, reducedMotion, onSelect, onHover }) {
  return (
    <Canvas
      className="cosmos-canvas"
      camera={{ position: [0, 5.25, mobile ? 15.4 : 13.5], fov: mobile ? 48 : 42, near: 0.1, far: 100 }}
      dpr={[1, 1.7]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.12
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={['#02050b']} />
      <fog attach="fog" args={['#02050b', 19, 48]} />
      <CameraRig focusedPlanet={focusedPlanet} mobile={mobile} reducedMotion={reducedMotion} />
      <ambientLight intensity={0.32} color="#9bb6d2" />
      <directionalLight position={[-5, 7, 8]} intensity={0.62} color="#dbe8ff" />
      <directionalLight position={[6, -3, -7]} intensity={0.18} color="#7797c6" />
      <StarField reducedMotion={reducedMotion} />
      <Sun reducedMotion={reducedMotion} dimmed={Boolean(focusedPlanet)} />
      {planets
        .filter((planet) => !mobile || mobilePlanetIds.has(planet.id))
        .map((planet) => (
          <OrbitingPlanet
            key={planet.id}
            planet={planet}
            focused={focusedPlanet === planet.id}
            dimmed={Boolean(focusedPlanet) && focusedPlanet !== planet.id}
            mobile={mobile}
            reducedMotion={reducedMotion}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
    </Canvas>
  )
}
