import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore, AGENT_IDS } from '../../stores/gameStore'

// Different colors for different agents
const AGENT_COLORS = {
  [AGENT_IDS.NPC_STANDING]: { body: '#6b7280', head: '#9ca3af', pants: '#374151' }, // Gray NPC
  [AGENT_IDS.PLAYER]: { body: '#3b82f6', head: '#fcd34d', pants: '#1e40af' },        // Blue player
  [AGENT_IDS.THIRD_AGENT]: { body: '#10b981', head: '#fcd34d', pants: '#047857' },   // Green third
}

/**
 * Placeholder Agent for development/testing
 * Use this while you're working on your actual agent model in Blender
 */
export function PlaceholderAgent({ agentId, ...props }) {
  const group = useRef()
  const legRefs = useRef({ left: null, right: null })

  const agents = useGameStore((state) => state.agents)
  const activeAgentId = useGameStore((state) => state.activeAgentId)

  const agent = agents[agentId]
  const colors = AGENT_COLORS[agentId] || AGENT_COLORS[AGENT_IDS.PLAYER]
  const isActive = agentId === activeAgentId

  useFrame(() => {
    if (!group.current || !agent) return

    group.current.position.set(...agent.position)
    group.current.rotation.set(...agent.rotation)

    // Walking animation
    if (agent.animation === 'walk') {
      const time = Date.now() * 0.01
      // Bob up and down
      group.current.position.y = Math.sin(time) * 0.05

      // Animate legs
      if (legRefs.current.left && legRefs.current.right) {
        legRefs.current.left.rotation.x = Math.sin(time) * 0.5
        legRefs.current.right.rotation.x = Math.sin(time + Math.PI) * 0.5
      }
    } else {
      // Reset leg positions when not walking
      if (legRefs.current.left && legRefs.current.right) {
        legRefs.current.left.rotation.x = 0
        legRefs.current.right.rotation.x = 0
      }
    }
  })

  if (!agent) return null

  return (
    <group ref={group} {...props}>
      {/* Active agent indicator (subtle glow ring) */}
      {isActive && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color={colors.body} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={colors.head} />
      </mesh>

      {/* Arms */}
      <mesh position={[0.4, 1.2, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color={colors.body} />
      </mesh>
      <mesh
        position={agent.isGunDrawn ? [-0.2, 1.2, -0.4] : [-0.4, 1.2, 0]}
        rotation={agent.isGunDrawn ? [Math.PI / 2, 0, 0] : [0, 0, 0.3]}
        castShadow
      >
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color={colors.body} />
      </mesh>

      {/* Gun (visible when drawn) */}
      {agent.isGunDrawn && (
        <mesh position={[-0.2, 1.2, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.08, 0.3, 0.15]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      )}

      {/* Legs */}
      <mesh
        ref={(el) => (legRefs.current.right = el)}
        position={[0.15, 0.3, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>
      <mesh
        ref={(el) => (legRefs.current.left = el)}
        position={[-0.15, 0.3, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>
    </group>
  )
}
