import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../stores/gameStore'

/**
 * Placeholder Car for development/testing
 * Use this while you're working on your actual car model in Blender
 */
export function PlaceholderCar(props) {
  const group = useRef()
  const wheelRefs = useRef([])
  const glassRefs = useRef({})

  const carPosition = useGameStore((state) => state.carPosition)
  const carRotation = useGameStore((state) => state.carRotation)
  const carSpeed = useGameStore((state) => state.carSpeed)
  const brokenGlassPanels = useGameStore((state) => state.brokenGlassPanels)
  const updateWheelRotation = useGameStore((state) => state.updateWheelRotation)

  useFrame((_, delta) => {
    if (group.current) {
      group.current.position.set(...carPosition)
      group.current.rotation.set(...carRotation)
    }

    // Rotate wheels
    const rotationSpeed = carSpeed * delta * 10
    wheelRefs.current.forEach((wheel) => {
      if (wheel) {
        wheel.rotation.x += rotationSpeed
      }
    })

    if (carSpeed !== 0) {
      updateWheelRotation(delta)
    }
  })

  const wheelPositions = [
    [-0.8, 0.3, 1.2],   // Front Left
    [0.8, 0.3, 1.2],    // Front Right
    [-0.8, 0.3, -1.2],  // Rear Left
    [0.8, 0.3, -1.2],   // Rear Right
  ]

  return (
    <group ref={group} {...props}>
      {/* Car Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.8, 0.5, 4]} />
        <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 1.1, -0.3]} castShadow>
        <boxGeometry args={[1.6, 0.5, 2]} />
        <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Windshield */}
      {!brokenGlassPanels.includes('windshield') && (
        <mesh
          ref={(el) => (glassRefs.current.windshield = el)}
          position={[0, 1.1, 0.8]}
          rotation={[-0.3, 0, 0]}
        >
          <planeGeometry args={[1.5, 0.6]} />
          <meshStandardMaterial
            color="#88ccff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Rear window */}
      {!brokenGlassPanels.includes('rear') && (
        <mesh
          ref={(el) => (glassRefs.current.rear = el)}
          position={[0, 1.1, -1.5]}
          rotation={[0.3, 0, 0]}
        >
          <planeGeometry args={[1.5, 0.6]} />
          <meshStandardMaterial
            color="#88ccff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Side windows */}
      {!brokenGlassPanels.includes('leftFront') && (
        <mesh position={[-0.85, 1.1, 0.2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 0.45]} />
          <meshStandardMaterial
            color="#88ccff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {!brokenGlassPanels.includes('rightFront') && (
        <mesh position={[0.85, 1.1, 0.2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 0.45]} />
          <meshStandardMaterial
            color="#88ccff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Wheels */}
      {wheelPositions.map((pos, index) => (
        <mesh
          key={index}
          ref={(el) => (wheelRefs.current[index] = el)}
          position={pos}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[-0.6, 0.6, 2]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.6, 0.6, 2]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.5} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.7, 0.6, -2]}>
        <boxGeometry args={[0.2, 0.1, 0.05]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.7, 0.6, -2]}>
        <boxGeometry args={[0.2, 0.1, 0.05]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}
