import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { computeMotion, sceneState } from '../../lib/sceneState'
import { Core } from './Core'

/**
 * A faceted crystal that reveals its interior not by splitting open but
 * by dissolving: transparent and glass-like while open, seizing into an
 * opaque brushed shell as it seals. A deliberately different mechanic
 * from the hinged shells so the page doesn't feel templated.
 */
export function PrismObject({ index, color, count }) {
  const groupRef = useRef()
  const shellMat = useRef()
  const coreGroupRef = useRef()

  useFrame((state, delta) => {
    const { weight, sealProgress } = computeMotion(sceneState.t, index, count)
    const g = groupRef.current
    if (!g) return

    g.visible = weight > 0.003
    if (!g.visible) return

    const spin = sceneState.reducedMotion ? delta * 0.05 : delta * 0.2
    g.rotation.y += spin
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.15 + sceneState.my * 0.1, 0.05)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, sceneState.mx * 0.08, 0.05)

    const scale = THREE.MathUtils.lerp(0.1, 1.05, weight)
    g.scale.setScalar(scale)

    if (shellMat.current) {
      const baseOpacity = THREE.MathUtils.lerp(0.28, 1, sealProgress)
      shellMat.current.opacity = baseOpacity * weight
      shellMat.current.metalness = THREE.MathUtils.lerp(0.15, 0.85, sealProgress)
      shellMat.current.roughness = THREE.MathUtils.lerp(0.55, 0.22, sealProgress)
      shellMat.current.transmission = THREE.MathUtils.lerp(0.85, 0, sealProgress)
      shellMat.current.emissiveIntensity = THREE.MathUtils.lerp(0.55, 0.05, sealProgress)
    }

    const coreOpacityMask = 1 - Math.min(1, sealProgress / 0.6)
    coreGroupRef.current.visible = coreOpacityMask > 0.01
    coreGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.65, 0.95, coreOpacityMask))
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshPhysicalMaterial
          ref={shellMat}
          color="#efece4"
          emissive={color}
          transparent
          opacity={0.3}
          transmission={0.85}
          thickness={0.6}
          ior={1.4}
          metalness={0.15}
          roughness={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group ref={coreGroupRef}>
        <Core color={color} radius={0.34} nodeCount={16} />
      </group>
    </group>
  )
}
