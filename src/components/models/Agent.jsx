import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'
import { useGameStore } from '../../stores/gameStore'

// Animation name mappings - update these to match your actual animation names in Blender
const ANIMATION_MAP = {
  idle: 'Idle',       // Replace with your actual idle animation name
  walk: 'Walk',       // Replace with your actual walk animation name
  drawGun: 'DrawGun', // Replace with your actual draw gun animation name
  shoot: 'Shoot',     // Replace with your actual shoot animation name
}

export function Agent({ agentId, modelPath = '/models/agent.glb', ...props }) {
  const group = useRef()
  const { scene, animations } = useGLTF(modelPath)

  const agents = useGameStore((state) => state.agents)
  const activeAgentId = useGameStore((state) => state.activeAgentId)
  const setAgentAnimation = useGameStore((state) => state.setAgentAnimation)

  const agent = agents[agentId]
  const isActive = agentId === activeAgentId

  // Use SkeletonUtils.clone for proper skinned mesh cloning
  // Include agentId in deps so each agent gets unique clone
  const clonedScene = useMemo(() => {
    const clone = skeletonClone(scene)
    // Deep clone materials to avoid sharing
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone()
      }
    })
    return clone
  }, [scene, agentId])

  // Get animations for this specific clone
  const { actions, mixer } = useAnimations(animations, group)

  // Handle animation changes
  useEffect(() => {
    if (!agent || !actions) return

    const animationName = ANIMATION_MAP[agent.animation]
    const action = actions[animationName]

    if (!action) {
      console.warn(`Animation "${animationName}" not found for agent ${agentId}. Available:`, Object.keys(actions))
      return
    }

    // Fade out all current animations
    Object.values(actions).forEach((a) => {
      if (a && a.isRunning()) {
        a.fadeOut(0.2)
      }
    })

    // Play new animation
    action.reset()
    action.fadeIn(0.2)
    action.play()

    // For shoot animation, play once then return to idle
    if (agent.animation === 'shoot') {
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true

      const onFinished = () => {
        setAgentAnimation(agentId, 'idle')
        mixer.removeEventListener('finished', onFinished)
      }
      mixer.addEventListener('finished', onFinished)
    } else if (agent.animation === 'drawGun') {
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true

      const onFinished = () => {
        setAgentAnimation(agentId, 'idle')
        mixer.removeEventListener('finished', onFinished)
      }
      mixer.addEventListener('finished', onFinished)
    } else {
      action.setLoop(THREE.LoopRepeat)
    }
  }, [agent?.animation, actions, mixer, agentId, setAgentAnimation])

  // Update position and rotation
  useFrame(() => {
    if (group.current && agent) {
      group.current.position.set(...agent.position)
      group.current.rotation.set(...agent.rotation)
    }
  })

  if (!agent) return null

  return (
    <group ref={group} {...props} dispose={null}>
      {/* Active agent indicator ring */}
      {isActive && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} />
        </mesh>
      )}
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload the model
useGLTF.preload('/models/agent.glb')
