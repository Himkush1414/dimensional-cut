import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { computeMotion, sceneState } from '../../lib/sceneState'
import { Core } from './Core'

const RADIUS = 1.05
const OPEN_GAP = 0.62
const OPEN_TILT = 0.5

/**
 * A sphere split at its equator, the two shells swinging open like a
 * geode to reveal the core, then drifting shut into an unbroken orb.
 */
export function OrbObject({ index, color, count }) {
  const groupRef = useRef()
  const topRef = useRef()
  const bottomRef = useRef()
  const seamRef = useRef()
  const coreGroupRef = useRef()
  const topMat = useRef()
  const bottomMat = useRef()
  const seamMat = useRef()

  const topGeometry = useMemo(
    () => new THREE.SphereGeometry(RADIUS, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    [],
  )
  const bottomGeometry = useMemo(
    () => new THREE.SphereGeometry(RADIUS, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    [],
  )

  useFrame((state, delta) => {
    const { weight, sealProgress } = computeMotion(sceneState.t, index, count)
    const g = groupRef.current
    if (!g) return

    g.visible = weight > 0.003
    if (!g.visible) return

    const spin = sceneState.reducedMotion ? delta * 0.04 : delta * 0.14
    g.rotation.y += spin
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, sceneState.my * 0.12, 0.05)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -sceneState.mx * 0.08, 0.05)

    const scale = THREE.MathUtils.lerp(0.1, 1, weight)
    g.scale.setScalar(scale)

    const gap = THREE.MathUtils.lerp(OPEN_GAP, 0, sealProgress)
    const tilt = THREE.MathUtils.lerp(OPEN_TILT, 0, sealProgress)
    topRef.current.position.y = gap
    topRef.current.rotation.z = tilt
    bottomRef.current.position.y = -gap
    bottomRef.current.rotation.z = -tilt

    if (topMat.current) topMat.current.opacity = weight
    if (bottomMat.current) bottomMat.current.opacity = weight
    if (seamMat.current) seamMat.current.opacity = weight * (1 - sealProgress) * 0.9

    const coreOpacityMask = 1 - Math.min(1, sealProgress / 0.55)
    coreGroupRef.current.visible = coreOpacityMask > 0.01
    coreGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.7, 1, coreOpacityMask))
  })

  return (
    <group ref={groupRef}>
      <group ref={topRef}>
        <mesh geometry={topGeometry}>
          <meshStandardMaterial
            ref={topMat}
            color="#e7e2d8"
            metalness={0.4}
            roughness={0.32}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      </group>
      <group ref={bottomRef}>
        <mesh geometry={bottomGeometry}>
          <meshStandardMaterial
            ref={bottomMat}
            color="#dcd6c9"
            metalness={0.4}
            roughness={0.32}
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
        <Core color={color} radius={0.42} nodeCount={14} />
      </group>
    </group>
  )
}
