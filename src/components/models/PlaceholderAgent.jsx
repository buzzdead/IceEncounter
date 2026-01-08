import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../stores/gameStore'

/**
 * Placeholder Agent for development/testing
 * Use this while you're working on your actual agent model in Blender
 */
export function PlaceholderAgent(props) {
  const group = useRef()

  const agentPosition = useGameStore((state) => state.agentPosition)
  const agentRotation = useGameStore((state) => state.agentRotation)
  const agentAnimation = useGameStore((state) => state.agentAnimation)
  const isGunDrawn = useGameStore((state) => state.isGunDrawn)

  useFrame(() => {
    if (group.current) {
      group.current.position.set(...agentPosition)
      group.current.rotation.set(...agentRotation)

      // Simple bob animation for walking
      if (agentAnimation === 'walk') {
        group.current.position.y = Math.sin(Date.now() * 0.01) * 0.1
      }
    }
  })

  return (
    <group ref={group} {...props}>
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>

      {/* Arms */}
      <mesh position={[0.4, 1.2, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh
        position={isGunDrawn ? [- 0.2, 1.2, -0.4] : [-0.4, 1.2, 0]}
        rotation={isGunDrawn ? [Math.PI / 2, 0, 0] : [0, 0, 0.3]}
        castShadow
      >
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>

      {/* Gun (visible when drawn) */}
      {isGunDrawn && (
        <mesh position={[-0.2, 1.2, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.08, 0.3, 0.15]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      )}

      {/* Legs */}
      <mesh position={[0.15, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
      <mesh position={[-0.15, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
    </group>
  )
}
