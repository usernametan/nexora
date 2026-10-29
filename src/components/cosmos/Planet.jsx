import { useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCloudTexture, getPlanetTexture } from '../../utils/planetTextures'

export function Planet({ planet, focusRef, focused, dimmed, mobile, reducedMotion, onSelect, onHover }) {
  const visualRef = useRef(null)
  const bodyRef = useRef(null)
  const cloudRef = useRef(null)
  const materialRef = useRef(null)
  const cloudMaterialRef = useRef(null)
  const atmosphereRef = useRef(null)
  const ringMaterialRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const hoverAmount = useRef(0)
  const hitScale = Math.max(planet.id === 'saturn' ? 2.15 : 1.5, 0.22 / planet.radius)

  useFrame((_, delta) => {
    const focus = focusRef.current.value
    const targetHover = hovered ? 1 : 0
    hoverAmount.current = THREE.MathUtils.damp(hoverAmount.current, targetHover, 8, delta)

    if (visualRef.current) {
      const baseFocusRadius = planet.id === 'saturn' ? 1.02 : 1.28
      const focusRadius = mobile ? baseFocusRadius * 0.72 : baseFocusRadius
      const focusScale = 1 + focus * (focusRadius / planet.radius - 1)
      visualRef.current.scale.setScalar(focusScale + hoverAmount.current * 0.1)
    }
    if (bodyRef.current && !reducedMotion) bodyRef.current.rotation.y += delta * planet.rotationSpeed
    if (cloudRef.current && !reducedMotion) cloudRef.current.rotation.y += delta * (planet.rotationSpeed + 0.025)
    if (materialRef.current) {
      const targetOpacity = (dimmed ? 0.11 : 1) * (hovered ? 1 : 0.96)
      materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, targetOpacity, 3.2, delta)
    }
    if (cloudMaterialRef.current) cloudMaterialRef.current.opacity = THREE.MathUtils.damp(cloudMaterialRef.current.opacity, dimmed ? 0.025 : 0.32, 3, delta)
    if (atmosphereRef.current) {
      const base = planet.id === 'earth' ? 0.12 : 0.025
      const target = dimmed ? base * 0.18 : base + focus * 0.28 + hoverAmount.current * 0.08
      atmosphereRef.current.opacity = THREE.MathUtils.damp(atmosphereRef.current.opacity, target, 4, delta)
    }
    if (ringMaterialRef.current) {
      const target = dimmed ? 0.05 : 0.58
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
        scale={hitScale}
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
          color="#ffffff"
          roughness={0.86}
          metalness={0.02}
          emissive={planet.color}
          emissiveIntensity={0.025}
          transparent
          opacity={1}
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
            <ringGeometry args={[planet.radius * 1.32, planet.radius * 1.9, 128]} />
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
            <ringGeometry args={[planet.radius * 1.5, planet.radius * 1.62, 128]} />
            <meshBasicMaterial color="#6d604d" transparent opacity={0.48} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
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
            className={`planet-label ${hovered ? 'is-visible' : ''}`}
            style={{ '--planet-color': planet.color }}
          >
            <span>{hovered ? 'Enter orbit' : planet.module}</span>
            <strong>{planet.name}</strong>
          </div>
        </Html>
      )}
    </group>
  )
}
