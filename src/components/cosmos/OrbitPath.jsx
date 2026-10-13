import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function OrbitPath({ radius, color, dimmed, reducedMotion }) {
  const materialRef = useRef(null)

  useFrame((_, delta) => {
    if (!materialRef.current) return
    const targetOpacity = dimmed ? 0.025 : reducedMotion ? 0.075 : 0.12
    materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, targetOpacity, 3, delta)
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.009, radius + 0.009, 160]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={dimmed ? 0.025 : 0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
