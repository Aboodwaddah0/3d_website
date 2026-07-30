import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture, useVideoTexture } from '@react-three/drei'
import { fx } from './fx'

/**
 * Floating cinematic screens inside the 3D scene — the uploaded promo video
 * and campaign stills rendered as glowing panels drifting around the product.
 */

function ScreenPanel({
  texture,
  width,
  position,
  rotationY,
  phase,
}: {
  texture: THREE.Texture
  width: number
  position: [number, number, number]
  rotationY: number
  phase: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const edge = useRef<THREE.MeshBasicMaterial>(null)
  const height = width * 0.535

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (mesh.current) {
      mesh.current.position.y = position[1] + Math.sin(t * 0.8 + phase) * 0.12
      mesh.current.rotation.y = rotationY + Math.sin(t * 0.5 + phase) * 0.06
      mesh.current.visible = fx.screens > 0.01
    }
    if (mat.current) mat.current.opacity = fx.screens
    if (edge.current) edge.current.opacity = fx.screens * 0.35
  })

  return (
    <mesh ref={mesh} position={position} rotation={[0, rotationY, 0]} visible={false}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial ref={mat} map={texture} transparent opacity={0} toneMapped={false} />
      {/* glowing backing frame */}
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[width + 0.08, height + 0.08]} />
        <meshBasicMaterial
          ref={edge}
          color="#f5c84c"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </mesh>
  )
}

function VideoPanel() {
  const videoTex = useVideoTexture('/assets/hero.mp4', { muted: true, loop: true, start: true })
  videoTex.colorSpace = THREE.SRGBColorSpace
  return <ScreenPanel texture={videoTex} width={2.0} position={[-4.8, 1.8, -5.5]} rotationY={0.35} phase={0} />
}

export default function Screens() {
  const [trio, club] = useTexture(['/assets/scene-trio.jpg', '/assets/scene-club.jpg'])
  trio.colorSpace = THREE.SRGBColorSpace
  club.colorSpace = THREE.SRGBColorSpace

  const scale = useMemo(() => (window.matchMedia('(max-width: 767px)').matches ? 0.62 : 1), [])

  return (
    <group scale={scale}>
      <VideoPanel />
      <ScreenPanel texture={trio} width={1.9} position={[4.8, 1.8, -5.5]} rotationY={-0.35} phase={2.1} />
      <ScreenPanel texture={club} width={1.8} position={[4.6, -1.4, -5.5]} rotationY={-0.3} phase={4.2} />
    </group>
  )
}
