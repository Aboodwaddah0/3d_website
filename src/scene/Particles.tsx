import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { fx } from './fx'

/** Floating golden energy dust that surrounds the product across all sections. */
export default function Particles({ count = 800 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  const mat = useRef<THREE.PointsMaterial>(null)

  // Soft round sprite so particles render as glowing dots, not squares.
  const sprite = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])

  const { positions, colors, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const gold = new THREE.Color('#f5c84c')
    const white = new THREE.Color('#fff6e0')
    const violet = new THREE.Color('#b97bff')
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 5.5
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 7
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(theta) * r - 1
      const roll = Math.random()
      const c = roll < 0.6 ? gold : roll < 0.85 ? white : violet
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
      speeds[i] = 0.08 + Math.random() * 0.35
    }
    return { positions, colors, speeds }
  }, [count])

  useFrame(({ clock }, delta) => {
    if (!points.current || !mat.current) return
    const t = clock.elapsedTime
    const pos = points.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * delta
      if (y > 3.6) y = -3.6
      pos.setY(i, y)
    }
    pos.needsUpdate = true
    points.current.rotation.y = t * 0.03
    mat.current.size = 0.05 * fx.particleSize
    mat.current.opacity = fx.particleOpacity
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={0.05}
        map={sprite}
        alphaMap={sprite}
        vertexColors
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
