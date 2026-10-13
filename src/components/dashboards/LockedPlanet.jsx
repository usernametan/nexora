import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { CloseIcon, LockIcon } from '../ui/Icons'

export function LockedPlanet({ planet, reducedMotion, onClose }) {
  const cardRef = useRef(null)

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return undefined
    if (reducedMotion) {
      gsap.set(card, { autoAlpha: 1, scale: 1, y: 0 })
      return undefined
    }
    gsap.fromTo(
      card,
      { autoAlpha: 0, scale: 0.94, y: 16 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out' },
    )
    return () => gsap.killTweensOf(card)
  }, [reducedMotion])

  return (
    <div className="locked-overlay" role="presentation" onMouseDown={onClose}>
      <section
        ref={cardRef}
        className="locked-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="locked-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="locked-close" type="button" onClick={onClose} aria-label="Close message">
          <CloseIcon />
        </button>
        <div className="locked-orbit" style={{ '--planet-color': planet.color }}>
          <span className="locked-orbit__ring locked-orbit__ring--one" />
          <span className="locked-orbit__ring locked-orbit__ring--two" />
          <span className="locked-orbit__planet"><LockIcon size={20} /></span>
        </div>
        <p className="locked-kicker"><span /> Signal not yet in orbit</p>
        <h2 id="locked-title">Coming soon</h2>
        <h3>{planet.name} — {planet.module}</h3>
        <p>{planet.description}</p>
        <button className="locked-dismiss" type="button" onClick={onClose}>Return to cosmos</button>
      </section>
    </div>
  )
}
