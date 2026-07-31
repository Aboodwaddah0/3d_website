import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { fx } from './fx'

const COUNT = 150

export default function TrailParticles() {
  const points = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)

  const sprite = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.3)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(c)
  }, [])

  const { positions, colors, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const phases = new Float32Array(COUNT * 3)
    const gold = new THREE.Color('#f5c84c')
    const violet = new THREE.Color('#b97bff')
    const cyan = new THREE.Color('#6be2ff')

    for (let i = 0; i < COUNT; i++) {
      phases[i * 3] = Math.random() * Math.PI * 2
      phases[i * 3 + 1] = 0.5 + Math.random() * 0.6
      phases[i * 3 + 2] = 1.5 + Math.random() * 3

      const t = Math.random()
      const c = t < 0.5
        ? gold.clone().lerp(violet, t * 2)
        : violet.clone().lerp(cyan, (t - 0.5) * 2)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors, phases }
  }, [])

  useFrame(({ clock }) => {
    if (!points.current || !matRef.current) return
    const intensity = fx.trailIntensity * fx.canFade
    matRef.current.opacity = intensity * 0.55
    if (intensity < 0.01) {
      points.current.visible = false
      return
    }
    points.current.visible = true

    const t = clock.elapsedTime
    const pos = points.current.geometry.attributes.position as THREE.BufferAttribute

    for (let i = 0; i < COUNT; i++) {
      const angle = phases[i * 3] + t * phases[i * 3 + 2]
      const r = phases[i * 3 + 1]
      const y = Math.sin(angle * 0.3 + phases[i * 3]) * 1.0
      pos.setXYZ(i, Math.cos(angle) * r, y, Math.sin(angle) * r)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.03}
        map={sprite}
        alphaMap={sprite}
        vertexColors
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
