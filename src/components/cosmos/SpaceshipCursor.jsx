import { useMousePosition } from '../../hooks/useMousePosition'

export function SpaceshipCursor({ enabled, targeted, reducedMotion }) {
  const shipRef = useMousePosition(enabled, reducedMotion)

  return (
    <div
      ref={shipRef}
      className={`spaceship-cursor ${enabled ? 'is-enabled' : ''} ${targeted ? 'is-targeting' : ''} ${reducedMotion ? 'is-reduced' : ''}`}
      aria-hidden="true"
    >
      <span className="ship-reticle"><i /><i /></span>
      <span className="engine-trail"><i /><i /><i /></span>
      <svg className="ship-body" viewBox="0 0 76 42" fill="none">
        <defs>
          <linearGradient id="shipHull" x1="18" y1="4" x2="59" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f1f7ff" />
            <stop offset="0.36" stopColor="#aab8c8" />
            <stop offset="0.72" stopColor="#526477" />
            <stop offset="1" stopColor="#172333" />
          </linearGradient>
          <linearGradient id="shipGlass" x1="47" y1="13" x2="57" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d7f3ff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#4b7da5" stopOpacity="0.3" />
          </linearGradient>
          <filter id="engineGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <path d="M12 21h26" stroke="#73c8ff" strokeOpacity=".65" strokeWidth="3" strokeLinecap="round" filter="url(#engineGlow)" />
        <path d="M13 20.7 38 14l24 2.2 11 4.6-11 4.7-24 2.1-25-6.9Z" fill="url(#shipHull)" stroke="#d7e4ef" strokeOpacity=".45" strokeWidth=".75" />
        <path d="m37 14-9 6.8 9 7.9 9-7.9-9-6.8Z" fill="#1b2b3c" stroke="#8195a9" strokeWidth=".6" />
        <path d="m46 14.7 8.8-.5 7.4 3.3-8.2 2.5-8-1.2V14.7Z" fill="url(#shipGlass)" />
        <path d="m19 16.3 17-1.1-9 5.7-12-2.4 4-2.2ZM19 25.4l17 .9-9-5.6-12 2.3 4 2.4Z" fill="#6f8294" fillOpacity=".54" />
        <path d="M12 18.2v5.5M35 12.2l1.7 17.6M61 16.3 73 21l-12 4.8" stroke="#dce8f2" strokeOpacity=".42" strokeWidth=".8" />
        <circle cx="67" cy="21" r="1.2" fill="#8edfff" />
        <circle cx="67" cy="21" r="3.4" fill="#6dc9ff" fillOpacity=".22" filter="url(#engineGlow)" />
      </svg>
    </div>
  )
}
