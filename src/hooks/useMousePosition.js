import { useEffect, useRef } from 'react'

export function useMousePosition(enabled, reducedMotion) {
  const shipRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      if (shipRef.current) shipRef.current.style.opacity = '0'
      return undefined
    }

    const ship = shipRef.current
    if (!ship) return undefined

    let animationFrame
    let previousTime = performance.now()
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let targetX = x
    let targetY = y
    let previousX = x
    let rotation = 0
    let thrust = 0

    const handlePointerMove = (event) => {
      if (event.pointerType === 'touch') return
      targetX = event.clientX
      targetY = event.clientY
    }

    const handlePointerLeave = () => {
      ship.style.opacity = '0'
    }

    const handlePointerEnter = () => {
      ship.style.opacity = '1'
    }

    const render = (time) => {
      const delta = Math.min((time - previousTime) / 16.67, 3)
      previousTime = time
      const follow = reducedMotion ? 1 : 1 - Math.pow(0.0007, delta)
      x += (targetX - x) * follow
      y += (targetY - y) * follow
      const horizontalVelocity = x - previousX
      const targetRotation = Math.max(-18, Math.min(18, horizontalVelocity * 1.15))
      rotation += (targetRotation - rotation) * (reducedMotion ? 1 : 0.12)
      const targetThrust = Math.min(1, Math.abs(horizontalVelocity) / 18)
      thrust += (targetThrust - thrust) * 0.16
      ship.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`
      ship.style.setProperty('--thrust', thrust.toFixed(3))
      previousX = x
      animationFrame = requestAnimationFrame(render)
    }

    ship.style.opacity = '1'
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', handlePointerLeave)
    document.documentElement.addEventListener('mouseenter', handlePointerEnter)
    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('pointermove', handlePointerMove)
      document.documentElement.removeEventListener('mouseleave', handlePointerLeave)
      document.documentElement.removeEventListener('mouseenter', handlePointerEnter)
    }
  }, [enabled, reducedMotion])

  return shipRef
}
