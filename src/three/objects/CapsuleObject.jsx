import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { computeMotion, sceneState } from '../../lib/sceneState'
import { Core } from './Core'

const RADIUS = 0.62
const BODY_HALF = 0.55
const OPEN_GAP = 0.6

/**
 * A capsule/canister cut through its barrel, the dome-capped halves
 * sliding apart along the seam to expose the mechanism inside.
 */
export function CapsuleObject({ index, color, count }) {
  const groupRef = useRef()
  const topRef = useRef()
  const bottomRef = useRef()
  const seamRef = useRef()
  const coreGroupRef = useRef()
  const topMats = useRef([])
  const bottomMats = useRef([])
  const seamMat = useRef()

  useFrame((state, delta) => {
    const { weight, sealProgress } = computeMotion(sceneState.t, index, count)
    const g = groupRef.current
    if (!g) return

    g.visible = weight > 0.003
    if (!g.visible) return

    const spin = sceneState.reducedMotion ? delta * 0.04 : delta * 0.16
    g.rotation.y -= spin
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, sceneState.mx * 0.1, 0.05)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.35 + sceneState.my * 0.1, 0.05)

    const scale = THREE.MathUtils.lerp(0.1, 1, weight)
    g.scale.setScalar(scale)

    const gap = THREE.MathUtils.lerp(OPEN_GAP, 0, sealProgress)
    topRef.current.position.y = BODY_HALF + gap
    bottomRef.current.position.y = -BODY_HALF - gap

    const op = weight
    topMats.current.forEach((m) => m && (m.opacity = op))
    bottomMats.current.forEach((m) => m && (m.opacity = op))
    if (seamMat.current) seamMat.current.opacity = weight * (1 - sealProgress) * 0.9

    const coreOpacityMask = 1 - Math.min(1, sealProgress / 0.55)
    coreGroupRef.current.visible = coreOpacityMask > 0.01
    coreGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.7, 1, coreOpacityMask))
  })

  return (
    <group ref={groupRef}>
      {/* top half: dome + upper barrel, pivoted around the seam at local y = 0 */}
      <group ref={topRef} position-y={BODY_HALF}>
        <mesh position-y={0}>
          <sphereGeometry args={[RADIUS, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            ref={(m) => (topMats.current[0] = m)}
            color="#c9cfd6"
            metalness={0.6}
            roughness={0.28}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        <mesh position-y={-BODY_HALF / 2}>
          <cylinderGeometry args={[RADIUS, RADIUS, BODY_HALF, 32, 1, true]} />
          <meshStandardMaterial
            ref={(m) => (topMats.current[1] = m)}
            color="#c9cfd6"
            metalness={0.6}
            roughness={0.28}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      </group>

      {/* bottom half: mirror */}
      <group ref={bottomRef} position-y={-BODY_HALF}>
        <mesh position-y={0}>
          <sphereGeometry args={[RADIUS, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial
            ref={(m) => (bottomMats.current[0] = m)}
            color="#aeb4bb"
            metalness={0.6}
            roughness={0.28}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        <mesh position-y={BODY_HALF / 2}>
          <cylinderGeometry args={[RADIUS, RADIUS, BODY_HALF, 32, 1, true]} />
          <meshStandardMaterial
            ref={(m) => (bottomMats.current[1] = m)}
            color="#aeb4bb"
            metalness={0.6}
            roughness={0.28}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      </group>

      <mesh ref={seamRef} rotation-x={Math.PI / 2}>
        <torusGeometry args={[RADIUS * 0.995, 0.012, 16, 100]} />
        <meshBasicMaterial ref={seamMat} color={color} transparent opacity={0} />
      </mesh>

      <group ref={coreGroupRef}>
        <Core color={color} radius={0.36} nodeCount={12} />
      </group>
    </group>
  )
}
