import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import CanMesh from './Can'
import Particles from './Particles'
import Rings from './Rings'
import ScrollFX from './ScrollFX'

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
      {/* lighting rig — key, rim and ambience for the dark luxury look */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 6]} intensity={1.7} color="#fff2d0" />
      <pointLight position={[0, 1.6, 4.2]} intensity={7} distance={10} decay={2} color="#ffe9c0" />
      <pointLight position={[-4.5, 2, -3]} intensity={26} distance={14} decay={2} color="#7a4dff" />
      <pointLight position={[3, -2.5, -2]} intensity={12} distance={12} decay={2} color="#2e7dff" />

      {/* local HDR-style environment for realistic metal reflections (no network) */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 3, 4]} scale={[6, 1.4, 1]} color="#fff4d6" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[5, 2, 1]} color="#e8dcff" />
        <Lightformer form="rect" intensity={1.2} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[5, 2, 1]} color="#f5c84c" />
        <Lightformer form="circle" intensity={2} position={[0, -4, 3]} scale={4} color="#43307a" />
        <Lightformer form="rect" intensity={1.1} position={[0, -2.5, 4]} rotation-x={0.6} scale={[6, 1, 1]} color="#fff" />
      </Environment>

      {/* the star of the show */}
      {/* rings live inside the can group so the energy orbits the product
          wherever the scroll choreography parks it */}
      <group ref={canRef}>
        <Suspense fallback={null}>
          <CanMesh />
        </Suspense>
        <Rings />
      </group>

      <Particles count={isMobile ? 320 : 800} />

      <ScrollFX canRef={canRef} />
    </Canvas>
  )
}
