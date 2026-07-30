import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { fx } from './fx'

const RING_DEFS = [
  { radius: 0.95, tube: 0.02, color: '#f5c84c', base: 0.95, tilt: 0.5, speed: 0.55 },
  { radius: 1.25, tube: 0.015, color: '#b97bff', base: 0.65, tilt: -0.42, speed: -0.38 },
  { radius: 1.55, tube: 0.012, color: '#6be2ff', base: 0.45, tilt: 0.3, speed: 0.26 },
]

/** Orbiting energy waves that charge up around the can in the ingredients section. */
export default function Rings() {
  const group = useRef<THREE.Group>(null)
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!group.current) return
    group.current.visible = fx.rings > 0.01
    group.current.children.forEach((ring, i) => {
      const def = RING_DEFS[i]
      ring.rotation.z = t * def.speed
      // mostly-horizontal orbits hugging the can, with a gentle wobble
      ring.rotation.x = Math.PI / 2 + def.tilt + Math.sin(t * 0.7 + i * 2) * 0.14
      const pulse = 1 + Math.sin(t * 2.2 + i * 1.4) * 0.04
      ring.scale.setScalar(pulse * (0.55 + fx.rings * 0.45))
      const m = mats.current[i]
      if (m) m.opacity = fx.rings * def.base * (0.75 + Math.sin(t * 3 + i) * 0.25)
    })
  })

  return (
    <group ref={group} visible={false}>
      {RING_DEFS.map((def, i) => (
        <mesh key={i}>
          <torusGeometry args={[def.radius, def.tube, 16, 128]} />
          <meshBasicMaterial
            ref={(m) => (mats.current[i] = m)}
            color={def.color}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
