import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function CameraRig({ focusedPlanet, mobile, reducedMotion }) {
  const { camera, pointer } = useThree()
  const lookTarget = useRef(new THREE.Vector3(0.35, 0, 0))
  const desiredPosition = useRef(new THREE.Vector3())
  const desiredLook = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    if (focusedPlanet) {
      if (mobile) {
        desiredPosition.current.set(0, 2.55, 7.6)
        desiredLook.current.set(0, 0.7, 0)
      } else {
        desiredPosition.current.set(-0.85, 0.75, 7.1)
        desiredLook.current.set(0.7, 0, 0)
      }
    } else {
      desiredPosition.current.set(pointer.x * 0.16, 5.25 + pointer.y * 0.12, mobile ? 15.4 : 13.5)
      desiredLook.current.set(mobile ? 0 : 0.35, 0, 0)
    }

    const smoothing = reducedMotion ? 1 : 1 - Math.pow(0.0009, Math.min(delta, 0.05))
    camera.position.lerp(desiredPosition.current, smoothing)
    lookTarget.current.lerp(desiredLook.current, smoothing)
    camera.lookAt(lookTarget.current)
  })

  return null
}

export { CameraRig }
