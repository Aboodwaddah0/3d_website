import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { FLAVORS, sceneStore } from '../store'

const COUNT = 50

export default function Splash() {
  const points = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)
  const active = useRef(false)
  const timer = useRef(0)

  const sprite = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 14)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(c)
  }, [])

  const state = useMemo(() => ({
    positions: new Float32Array(COUNT * 3),
    velocities: new Float32Array(COUNT * 3),
  }), [])

  useEffect(() => {
    return sceneStore.subscribe(() => {
      const accent = new THREE.Color(FLAVORS[sceneStore.flavor].accent)
      for (let i = 0; i < COUNT; i++) {
        const angle = Math.random() * Math.PI * 2
        const elev = Math.random() * Math.PI * 0.7 - Math.PI * 0.1
        const speed = 2.5 + Math.random() * 4.5
        state.positions[i * 3] = 0
        state.positions[i * 3 + 1] = 0
        state.positions[i * 3 + 2] = 0
        state.velocities[i * 3] = Math.cos(angle) * Math.cos(elev) * speed
        state.velocities[i * 3 + 1] = Math.sin(elev) * speed * 0.6 + 1.5
        state.velocities[i * 3 + 2] = Math.sin(angle) * Math.cos(elev) * speed
      }
      if (matRef.current) matRef.current.color.copy(accent)
      active.current = true
      timer.current = 0
    })
  }, [state])

  useFrame((_, delta) => {
    if (!points.current || !matRef.current) return
    if (!active.current) {
      points.current.visible = false
      return
    }
    points.current.visible = true
    timer.current += delta

    if (timer.current > 1.2) {
      active.current = false
      return
    }

    const pos = points.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < COUNT; i++) {
      state.velocities[i * 3 + 1] -= 8 * delta
      state.positions[i * 3] += state.velocities[i * 3] * delta
      state.positions[i * 3 + 1] += state.velocities[i * 3 + 1] * delta
      state.positions[i * 3 + 2] += state.velocities[i * 3 + 2] * delta
      pos.setXYZ(i, state.positions[i * 3], state.positions[i * 3 + 1], state.positions[i * 3 + 2])
    }
    pos.needsUpdate = true
    matRef.current.opacity = Math.max(0, 1 - timer.current / 1.2) * 0.75
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.06}
        map={sprite}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        color="#f5c84c"
      />
    </points>
  )
}
