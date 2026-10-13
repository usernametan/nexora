import { useRef } from 'react'
import { MeshDistortMaterial, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Sun({ reducedMotion, dimmed }) {
  const groupRef = useRef(null)
  const surfaceRef = useRef(null)
  const auraRef = useRef(null)
  const lightRef = useRef(null)

  useFrame((state, delta) => {
    if (groupRef.current && !reducedMotion) groupRef.current.rotation.y += delta * 0.025
    if (surfaceRef.current) {
      const targetOpacity = dimmed ? 0.28 : 1
      surfaceRef.current.opacity = THREE.MathUtils.damp(surfaceRef.current.opacity, targetOpacity, 3.2, delta)
    }
    if (auraRef.current) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(state.clock.elapsedTime * 0.55) * 0.025
      auraRef.current.scale.setScalar(pulse)
      auraRef.current.opacity = THREE.MathUtils.damp(auraRef.current.opacity, dimmed ? 0.045 : 0.2, 3, delta)
    }
    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.damp(lightRef.current.intensity, dimmed ? 15 : 42, 3, delta)
    }
  })

  return (
    <group>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[1.12, 64, 48]} />
          <MeshDistortMaterial
            ref={surfaceRef}
            color="#ff7a28"
            emissive="#ff4b0b"
            emissiveIntensity={2.5}
            roughness={0.72}
            metalness={0.05}
            distort={reducedMotion ? 0 : 0.17}
            speed={reducedMotion ? 0 : 0.32}
            transparent
          />
        </mesh>
        <mesh ref={auraRef} scale={1.08}>
          <sphereGeometry args={[1.12, 48, 32]} />
          <meshBasicMaterial
            color="#ff9d46"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <Sparkles count={42} scale={[2.8, 2.8, 2.8]} size={2.1} speed={reducedMotion ? 0 : 0.22} opacity={0.62} color="#ffd08a" />
      </group>
      <pointLight ref={lightRef} color="#ffb15c" intensity={42} distance={32} decay={2} />
    </group>
  )
}
