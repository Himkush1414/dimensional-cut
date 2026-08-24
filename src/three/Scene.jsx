import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { sceneState } from '../lib/sceneState'
import { OrbObject } from './objects/OrbObject'
import { CapsuleObject } from './objects/CapsuleObject'
import { PrismObject } from './objects/PrismObject'

const OBJECTS = [
  { Component: OrbObject, color: '#d98c4f' },
  { Component: CapsuleObject, color: '#6fd3c7' },
  { Component: PrismObject, color: '#b79af0' },
]

function Rig() {
  const light = useRef()

  useFrame((state) => {
    const targetX = sceneState.mx * 0.35
    const targetY = sceneState.my * 0.2
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.04)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.04)
    state.camera.lookAt(0, 0, 0)

    if (light.current) {
      const colors = OBJECTS.map((o) => o.color)
      const activeFloat = sceneState.t * OBJECTS.length
      const idx = Math.min(OBJECTS.length - 1, Math.floor(activeFloat))
      const c = new THREE.Color(colors[idx])
      light.current.color.lerp(c, 0.05)
    }
  })

  return <pointLight ref={light} position={[2, 1.5, 3]} intensity={18} distance={8} />
}

export function Scene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 5.2], fov: 32 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#0a0a0b']} />
        <fog attach="fog" args={['#0a0a0b', 6, 11]} />

        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#3a3a3f', '#0a0a0b', 0.5]} />
        <directionalLight position={[-3, 4, 2]} intensity={1.1} />
        <Rig />

        <Suspense fallback={null}>
          {OBJECTS.map(({ Component, color }, i) => (
            <Component key={i} index={i} color={color} count={OBJECTS.length} />
          ))}
          <Sparkles count={40} scale={7} size={1.4} speed={0.2} opacity={0.35} color="#f3f1ec" />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.35} scale={8} blur={2.6} far={2} />
        </Suspense>
      </Canvas>
    </div>
  )
}
