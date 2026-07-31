import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import CanMesh from './Can'
import Particles from './Particles'
import Rings from './Rings'
import ScrollFX from './ScrollFX'
import TrailParticles from './TrailParticles'
import Splash from './Splash'
import { fx } from './fx'

function SceneFX() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const dirRef = useRef<THREE.DirectionalLight>(null)
  const violetRef = useRef<THREE.PointLight>(null)
  const blueRef = useRef<THREE.PointLight>(null)

  const warmDir = useMemo(() => new THREE.Color('#fff2d0'), [])
  const violetDir = useMemo(() => new THREE.Color('#e0c4ff'), [])
  const coolDir = useMemo(() => new THREE.Color('#c4e8ff'), [])
  const warmV = useMemo(() => new THREE.Color('#7a4dff'), [])
  const hotV = useMemo(() => new THREE.Color('#a855ff'), [])
  const warmB = useMemo(() => new THREE.Color('#2e7dff'), [])
  const coolB = useMemo(() => new THREE.Color('#2eb8ff'), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    if (Math.abs(camera.fov - fx.fov) > 0.01) {
      camera.fov = fx.fov
      camera.updateProjectionMatrix()
    }
    camera.rotation.x = fx.camRotX
    camera.rotation.y = fx.camRotY

    gl.toneMappingExposure = fx.exposure

    const s = fx.hdrShift
    if (dirRef.current) {
      if (s < 0.5) {
        tmp.copy(warmDir).lerp(violetDir, s * 2)
      } else {
        tmp.copy(violetDir).lerp(coolDir, (s - 0.5) * 2)
      }
      dirRef.current.color.copy(tmp)
    }
    if (violetRef.current) {
      tmp.copy(warmV).lerp(hotV, s)
      violetRef.current.color.copy(tmp)
      violetRef.current.intensity = 26 + s * 12
    }
    if (blueRef.current) {
      tmp.copy(warmB).lerp(coolB, s)
      blueRef.current.color.copy(tmp)
      blueRef.current.intensity = 12 + s * 6
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.4 + s * 0.15
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.4} />
      <directionalLight ref={dirRef} position={[4, 5, 6]} intensity={1.7} color="#fff2d0" />
      <pointLight position={[0, 1.6, 4.2]} intensity={7} distance={10} decay={2} color="#ffe9c0" />
      <pointLight ref={violetRef} position={[-4.5, 2, -3]} intensity={26} distance={14} decay={2} color="#7a4dff" />
      <pointLight ref={blueRef} position={[3, -2.5, -2]} intensity={12} distance={12} decay={2} color="#2e7dff" />
    </>
  )
}

function ReflectionFloor() {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(256, 256, 20, 256, 256, 250)
    grad.addColorStop(0, 'rgba(245, 200, 76, 0.18)')
    grad.addColorStop(0.2, 'rgba(245, 200, 76, 0.10)')
    grad.addColorStop(0.4, 'rgba(185, 123, 255, 0.07)')
    grad.addColorStop(0.65, 'rgba(107, 226, 255, 0.04)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 512, 512)
    g.globalAlpha = 0.08
    g.strokeStyle = '#f5c84c'
    g.lineWidth = 0.5
    for (let r = 30; r < 250; r += 45) {
      g.beginPath()
      g.arc(256, 256, r, 0, Math.PI * 2)
      g.stroke()
    }
    return new THREE.CanvasTexture(c)
  }, [])

  useFrame(() => {
    if (matRef.current) matRef.current.opacity = fx.canFade * fx.floorOpacity
    if (meshRef.current) meshRef.current.visible = fx.canFade > 0.02
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
      <circleGeometry args={[3, 64]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default function Experience() {
  const canRef = useRef<THREE.Group>(null!)

  const isMobile = useMemo(() => window.matchMedia('(max-width: 767px)').matches, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <SceneFX />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 3, 4]} scale={[6, 1.4, 1]} color="#fff4d6" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[5, 2, 1]} color="#e8dcff" />
        <Lightformer form="rect" intensity={1.2} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[5, 2, 1]} color="#f5c84c" />
        <Lightformer form="circle" intensity={2} position={[0, -4, 3]} scale={4} color="#43307a" />
        <Lightformer form="rect" intensity={1.1} position={[0, -2.5, 4]} rotation-x={0.6} scale={[6, 1, 1]} color="#fff" />
      </Environment>

      <group ref={canRef}>
        <Suspense fallback={null}>
          <CanMesh />
        </Suspense>
        <Rings />
        <TrailParticles />
        <Splash />
        <ReflectionFloor />
      </group>

      <Particles count={isMobile ? 320 : 800} />

      <ScrollFX canRef={canRef} />
    </Canvas>
  )
}
