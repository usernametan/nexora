import { useMemo } from 'react'
import { OrbitIcon } from './Icons'

function supportsWebGL() {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext
      && (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    )
  } catch {
    return false
  }
}

export function WebGLFallback({ children }) {
  const supported = useMemo(supportsWebGL, [])
  if (supported) return children

  return (
    <div className="webgl-fallback">
      <div className="webgl-fallback__orbit" aria-hidden="true">
        <span />
        <span />
        <span />
        <i />
      </div>
      <div>
        <p className="intro-kicker"><OrbitIcon size={15} /> Your life, in motion</p>
        <h1>One system.<br /><span>Seven worlds.</span></h1>
        <p className="intro-copy">
          This device cannot render the 3D cosmos. Every world is still available from the navigation panel.
        </p>
      </div>
    </div>
  )
}
