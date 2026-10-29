import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitPath } from './OrbitPath'
import { Planet } from './Planet'

export function OrbitingPlanet({ planet, focused, dimmed, mobile, reducedMotion, onSelect, onHover, children }) {
  const rootRef = useRef(null)
  const carrierRef = useRef(null)
  const focusRef = useRef({ value: 0 })
  const angleRef = useRef(planet.angle)

  useEffect(() => {
    if (reducedMotion) {
      focusRef.current.value = focused ? 1 : 0
      return undefined
    }
    const tween = gsap.to(focusRef.current, {
      value: focused ? 1 : 0,
      duration: focused ? 1.45 : 1.2,
      ease: focused ? 'power3.inOut' : 'power2.inOut',
    })
    return () => tween.kill()
  }, [focused, reducedMotion])

  useFrame((_, delta) => {
    if (!focused && !reducedMotion) angleRef.current += delta * planet.orbitSpeed
    const rawFocus = focusRef.current.value
    const focus = rawFocus * rawFocus * (3 - 2 * rawFocus)
    const angle = angleRef.current
    const orbitX = Math.cos(angle) * planet.orbitRadius
    const orbitZ = Math.sin(angle) * planet.orbitRadius
    const focusPosition = mobile ? [0, 1.72, 0] : [3.25, 0, 0]
    const parentPosition = rootRef.current?.parent?.position
    const focusX = focusPosition[0] - (parentPosition?.x ?? 0)
    const focusY = focusPosition[1] - (parentPosition?.y ?? 0)
    const focusZ = focusPosition[2] - (parentPosition?.z ?? 0)

    if (carrierRef.current) {
      carrierRef.current.position.set(
        THREE.MathUtils.lerp(orbitX, focusX, focus),
        THREE.MathUtils.lerp(0, focusY, focus),
        THREE.MathUtils.lerp(orbitZ, focusZ, focus),
      )
    }
  })

  return (
    <group ref={rootRef}>
      <OrbitPath radius={planet.orbitRadius} color={planet.color} dimmed={dimmed} reducedMotion={reducedMotion} />
      <group ref={carrierRef}>
        <Planet
          planet={planet}
          focusRef={focusRef}
          focused={focused}
          dimmed={dimmed}
          mobile={mobile}
          reducedMotion={reducedMotion}
          onSelect={onSelect}
          onHover={onHover}
        />
        {children}
      </group>
    </group>
  )
}
