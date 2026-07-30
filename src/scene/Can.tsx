import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import gsap from 'gsap'
import { FLAVORS, sceneStore } from '../store'
import { fx } from './fx'

/**
 * The hero product — a 250ml slim can (real proportions ~2.5:1 height:diameter)
 * wrapped with the uploaded BosS artwork. The label crop is mapped onto the
 * FRONT half of the cylinder so the logo reads clearly and undistorted; the
 * back half picks up the artwork's dark backdrop, reading as the unlit side.
 */

const RADIUS = 0.46
const BODY_H = 2.1

export default function CanMesh() {
  const root = useRef<THREE.Group>(null)
  const sway = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const bodyMat = useRef<THREE.MeshPhysicalMaterial>(null)
  const accentLight = useRef<THREE.PointLight>(null)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null)
  const gl = useThree((s) => s.gl)

  const textures = useTexture(FLAVORS.map((f) => f.texture))

  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.wrapS = THREE.ClampToEdgeWrapping
      t.wrapT = THREE.ClampToEdgeWrapping
      // Source artwork: can body spans x 0.30-0.70, y 0.186-0.80 of the render.
      // Map that crop across the front 180° (u 0.25-0.75 -> tex 0.30-0.70), so
      // the label keeps its true aspect ratio when seen from the camera.
      t.repeat.set(0.8, 0.615)
      t.offset.set(0.1, 0.186)
      t.anisotropy = 8
    })
  }, [textures])

  // Radial glow sprite texture, generated once.
  const glowTexture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    grad.addColorStop(0, 'rgba(255,255,255,0.9)')
    grad.addColorStop(0.35, 'rgba(255,255,255,0.28)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])

  // Pre-upload every label texture to the GPU so the first swap to a flavor
  // doesn't stall a frame on decode/upload.
  useEffect(() => {
    textures.forEach((t) => gl.initTexture(t))
  }, [gl, textures])

  // Flavor swap, fully imperative (no React re-render): a fast full spin with
  // the label map switched mid-turn while it faces away from the camera.
  const swapTl = useRef<gsap.core.Timeline | null>(null)
  useEffect(() => {
    // initial tint
    const initial = new THREE.Color(FLAVORS[sceneStore.flavor].accent)
    accentLight.current?.color.copy(initial)
    glowMat.current?.color.copy(initial)

    return sceneStore.subscribe(() => {
      const flavor = sceneStore.flavor
      const accent = new THREE.Color(FLAVORS[flavor].accent)
      swapTl.current?.kill()
      const tl = gsap.timeline()
      swapTl.current = tl
      if (spin.current) {
        tl.to(spin.current.rotation, { y: '+=6.2832', duration: 0.6, ease: 'power2.inOut' }, 0)
          .to(spin.current.scale, { x: 0.95, y: 0.97, z: 0.95, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 0)
      }
      // swap while the label points away (~40% through the eased turn)
      tl.call(() => {
        if (bodyMat.current) bodyMat.current.map = textures[flavor]
      }, [], 0.24)
      if (accentLight.current) {
        tl.to(accentLight.current.color, { r: accent.r, g: accent.g, b: accent.b, duration: 0.5 }, 0.1)
      }
      if (glowMat.current) {
        tl.to(glowMat.current.color, { r: accent.r, g: accent.g, b: accent.b, duration: 0.5 }, 0.1)
      }
    })
  }, [textures])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // scroll-driven product fade (out for the brand section, back for the reveal)
    if (root.current) root.current.visible = fx.canFade > 0.02
    if (bodyMat.current) bodyMat.current.opacity = fx.canFade
    metal.opacity = fx.canFade
    if (sway.current) {
      // gentle bob + sway that always returns to front — keeps the label readable
      sway.current.position.y = Math.sin(t * 1.15) * 0.05
      sway.current.rotation.y = Math.sin(t * 0.4) * 0.16
    }
    if (glowMat.current) {
      glowMat.current.opacity = fx.canFade * fx.glow * (0.38 + Math.sin(t * 2.1) * 0.06)
    }
    if (accentLight.current) {
      accentLight.current.intensity = fx.canFade * (11 + Math.sin(t * 3.3) * 2.5)
    }
  })

  const metal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d4d4da', metalness: 0.95, roughness: 0.24, transparent: true }),
    [],
  )

  return (
    <group ref={root}>
      {/* Radial energy glow that tracks the can */}
      <mesh position={[0, 0, -1.35]}>
        <planeGeometry args={[6.4, 6.4]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glowTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          opacity={0.38}
        />
      </mesh>

      <pointLight ref={accentLight} position={[1.4, 0.6, 2.2]} intensity={11} distance={9} decay={2} />

      <group ref={sway}>
        {/* rotation.y = PI puts the mapped artwork centre toward the camera */}
        <group ref={spin} rotation={[0, Math.PI, 0]}>
          {/* label body — wrapped with the uploaded product artwork */}
          <mesh castShadow>
            <cylinderGeometry args={[RADIUS, RADIUS, BODY_H, 96, 1, true]} />
            <meshPhysicalMaterial
              ref={bodyMat}
              map={textures[sceneStore.flavor]}
              transparent
              metalness={0.5}
              roughness={0.22}
              clearcoat={1}
              clearcoatRoughness={0.18}
              envMapIntensity={1.4}
            />
          </mesh>
          {/* top taper + lid */}
          <mesh position={[0, BODY_H / 2 + 0.045, 0]} material={metal}>
            <cylinderGeometry args={[RADIUS - 0.06, RADIUS, 0.09, 96]} />
          </mesh>
          <mesh position={[0, BODY_H / 2 + 0.1, 0]} material={metal}>
            <cylinderGeometry args={[RADIUS - 0.09, RADIUS - 0.06, 0.02, 96]} />
          </mesh>
          <mesh position={[0, BODY_H / 2 + 0.115, 0]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
            <torusGeometry args={[RADIUS - 0.075, 0.018, 24, 96]} />
          </mesh>
          {/* pull tab */}
          <mesh position={[0, BODY_H / 2 + 0.12, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
            <torusGeometry args={[0.07, 0.016, 12, 40]} />
          </mesh>
          {/* bottom taper */}
          <mesh position={[0, -BODY_H / 2 - 0.045, 0]} material={metal}>
            <cylinderGeometry args={[RADIUS, RADIUS - 0.09, 0.09, 96]} />
          </mesh>
          <mesh position={[0, -BODY_H / 2 - 0.095, 0]} material={metal}>
            <cylinderGeometry args={[RADIUS - 0.09, RADIUS - 0.12, 0.02, 96]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
