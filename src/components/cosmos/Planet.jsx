import { useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCloudTexture, getPlanetTexture } from '../../utils/planetTextures'

export function Planet({ planet, focusRef, focused, dimmed, reducedMotion, onSelect, onHover }) {
  const visualRef = useRef(null)
  const bodyRef = useRef(null)
  const cloudRef = useRef(null)
  const materialRef = useRef(null)
  const cloudMaterialRef = useRef(null)
  const atmosphereRef = useRef(null)
  const ringMaterialRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const hoverAmount = useRef(0)

  useFrame((_, delta) => {
    const focus = focusRef.current.value
    const targetHover = hovered ? 1 : 0
    hoverAmount.current = THREE.MathUtils.damp(hoverAmount.current, targetHover, 8, delta)

    if (visualRef.current) {
      const scale = 1 + focus * 2.45 + hoverAmount.current * 0.1
      visualRef.current.scale.setScalar(scale)
    }
    if (bodyRef.current && !reducedMotion) bodyRef.current.rotation.y += delta * planet.rotationSpeed
    if (cloudRef.current && !reducedMotion) cloudRef.current.rotation.y += delta * (planet.rotationSpeed + 0.025)
    if (materialRef.current) {
      const lockedVisibility = planet.locked ? 0.55 : 1
      const targetOpacity = (dimmed ? 0.11 : lockedVisibility) * (hovered ? 1 : 0.96)
      materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, targetOpacity, 3.2, delta)
    }
    if (cloudMaterialRef.current) cloudMaterialRef.current.opacity = THREE.MathUtils.damp(cloudMaterialRef.current.opacity, dimmed ? 0.025 : 0.32, 3, delta)
    if (atmosphereRef.current) {
      const base = planet.id === 'earth' ? 0.12 : 0.025
      const target = dimmed ? base * 0.18 : base + focus * 0.2 + hoverAmount.current * 0.08
      atmosphereRef.current.opacity = THREE.MathUtils.damp(atmosphereRef.current.opacity, target, 4, delta)
    }
    if (ringMaterialRef.current) {
      const target = dimmed ? 0.05 : planet.locked ? 0.18 : 0.58
      ringMaterialRef.current.opacity = THREE.MathUtils.damp(ringMaterialRef.current.opacity, target, 3, delta)
    }
  })

  const handlePointerOver = (event) => {
    event.stopPropagation()
    setHovered(true)
    onHover(planet.id)
  }

  const handlePointerOut = (event) => {
    event.stopPropagation()
    setHovered(false)
    onHover(null)
  }

  return (
    <group ref={visualRef}>
      <mesh
        scale={planet.id === 'saturn' ? 2.15 : 1.14}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(planet)
        }}
      >
        <sphereGeometry args={[planet.radius, 20, 14]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      <mesh ref={bodyRef} rotation={[planet.tilt, 0, planet.tilt * 0.35]}>
        <sphereGeometry args={[planet.radius, 56, 40]} />
        <meshStandardMaterial
          ref={materialRef}
          map={getPlanetTexture(planet.texture)}
          color={planet.locked ? '#a7adb5' : '#ffffff'}
          roughness={0.86}
          metalness={0.02}
          emissive={planet.color}
          emissiveIntensity={0.025}
          transparent
          opacity={planet.locked ? 0.55 : 1}
          depthWrite={!dimmed}
        />
      </mesh>

      {planet.id === 'earth' && (
        <mesh ref={cloudRef} scale={1.018}>
          <sphereGeometry args={[planet.radius, 48, 32]} />
          <meshStandardMaterial
            ref={cloudMaterialRef}
            map={getCloudTexture()}
            color="#ffffff"
            transparent
            opacity={0.32}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      )}

      <mesh scale={1.08}>
        <sphereGeometry args={[planet.radius, 40, 28]} />
        <meshBasicMaterial
          ref={atmosphereRef}
          color={planet.color}
          transparent
          opacity={0.02}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {planet.id === 'saturn' && (
        <group rotation={[Math.PI / 2.5, 0.12, -0.18]}>
          <mesh>
            <ringGeometry args={[planet.radius * 1.34, planet.radius * 2.18, 128]} />
            <meshBasicMaterial
              ref={ringMaterialRef}
              color="#c6a873"
              transparent
              opacity={0.58}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[planet.radius * 1.56, planet.radius * 1.68, 128]} />
            <meshBasicMaterial color="#6d604d" transparent opacity={0.48} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      )}

      {planet.locked && (
        <mesh rotation={[Math.PI / 2.65, 0.2, 0.3]}>
          <torusGeometry args={[planet.radius * 1.48, 0.008, 8, 72]} />
          <meshBasicMaterial color="#8f9aaa" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      )}

      {!focused && (
        <Html
          center
          position={[0, planet.radius * 1.7, 0]}
          distanceFactor={8}
          zIndexRange={[30, 0]}
          wrapperClass="planet-label-anchor"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`planet-label ${hovered ? 'is-visible' : ''} ${planet.locked ? 'is-locked' : ''}`}
            style={{ '--planet-color': planet.color }}
          >
            <span>{planet.locked ? 'Locked world' : hovered ? 'Enter orbit' : planet.module}</span>
            <strong>{planet.name}</strong>
            {planet.locked && <small>Signal offline</small>}
          </div>
        </Html>
      )}
    </group>
  )
}
