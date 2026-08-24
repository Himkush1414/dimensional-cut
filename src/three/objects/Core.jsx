import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The "internal dimension" revealed when a shell is open: a wireframe
 * lattice, a soft emissive heart, and a slow ring of orbiting nodes.
 * Shared across every object so the reveal reads as one visual language,
 * with only the accent color changing per section.
 */
export function Core({ color, radius = 0.42, nodeCount = 14 }) {
  const groupRef = useRef()
  const heartRef = useRef()

  const nodes = useMemo(() => {
    const arr = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = golden * i
      arr.push(
        new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius * 1.7),
      )
    }
    return arr
  }, [nodeCount, radius])

  const lineGeometry = useMemo(() => {
    const points = []
    for (let i = 0; i < nodes.length; i++) {
      const next = nodes[(i + 3) % nodes.length]
      points.push(nodes[i], next)
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [nodes])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.22
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15
    if (heartRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.06
      heartRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={heartRef}>
        <icosahedronGeometry args={[radius, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      <mesh>
        <icosahedronGeometry args={[radius * 1.85, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
      </mesh>

      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </lineSegments>

      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[radius * 0.06, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  )
}
