import { useMemo, useRef } from 'react'
import { Sparkles, Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

function seededPosition(index) {
  const first = Math.sin(index * 12.9898) * 43758.5453
  const second = Math.sin(index * 78.233) * 24634.6345
  const third = Math.sin(index * 37.719) * 15731.7431
  return [first - Math.floor(first), second - Math.floor(second), third - Math.floor(third)]
}

export function StarField({ reducedMotion }) {
  const dustRef = useRef(null)
  const positions = useMemo(() => {
    const values = new Float32Array(360 * 3)
    for (let index = 0; index < 360; index += 1) {
      const [first, second, third] = seededPosition(index + 11)
      const radius = 15 + first * 24
      const angle = second * Math.PI * 2
      const elevation = (third - 0.5) * 18
      values[index * 3] = Math.cos(angle) * radius
      values[index * 3 + 1] = elevation
      values[index * 3 + 2] = Math.sin(angle) * radius
    }
    return values
  }, [])

  useFrame((_, delta) => {
    if (dustRef.current && !reducedMotion) dustRef.current.rotation.y += delta * 0.0025
  })

  return (
    <group>
      <Stars radius={55} depth={32} count={1450} factor={2.1} saturation={0.08} fade speed={reducedMotion ? 0 : 0.12} />
      <Sparkles count={90} scale={[28, 14, 28]} size={0.7} speed={reducedMotion ? 0 : 0.12} opacity={0.32} color="#a7c8e8" />
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#8da9c4" size={0.035} transparent opacity={0.42} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  )
}
