import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useGraph, createPortal } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'
import { useGameStore } from '../../stores/gameStore'
import { Gun } from './Gun'

// Animation name mappings - update these to match your actual animation names in Blender
const ANIMATION_MAP = {
  idle: 'Idle',       // Replace with your actual idle animation name
  walk: 'Walk',       // Replace with your actual walk animation name
  drawGun: 'Draw', // Replace with your actual draw gun animation name
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
    console.log(clone)
    return clone
  }, [scene, agentId])

  // Get animations for this specific clone
  const { actions, mixer } = useAnimations(animations, group)
  const { nodes } = useGraph(clonedScene)

  // Handle animation changes
  useEffect(() => {
  if (!agent || !actions) return

  const animationName = ANIMATION_MAP[agent.animation]
  const currentAction = actions[animationName]

  if (!currentAction) return

  // 1. SPECIFIC LOGIC FOR DRAWING (MOUSE DOWN)
  if (agent.animation === 'drawGun') {
    currentAction
      .reset()
      .setLoop(THREE.LoopOnce, 1)
      .play()
    
    currentAction.clampWhenFinished = true
    currentAction.paused = false
    currentAction.timeScale = 1
  } 
  
  // 2. SPECIFIC LOGIC FOR RELEASING (MOUSE UP)
  else {
    const drawAction = actions[ANIMATION_MAP.drawGun]
    
    // If we were holding the gun, reverse it BEFORE going to the next animation
    if (drawAction && drawAction.time > 0) {
      drawAction.paused = false
      drawAction.timeScale = -1
      drawAction.setLoop(THREE.LoopOnce, 1)
      drawAction.play()
    }

    // Now play the target animation (Idle or Walk)
    currentAction.reset().fadeIn(0.2).play()
  }

  // 3. CLEANUP: Only fade out animations that aren't the current one OR the Draw animation
  Object.keys(actions).forEach((key) => {
    if (key !== animationName && key !== ANIMATION_MAP.drawGun) {
      actions[key]?.fadeOut(0.2)
    }
  })

}, [agent?.animation, actions])

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
    {nodes.mixamorigRightHand && createPortal(
      <Gun />, 
      nodes.mixamorigRightHand
    )}
    </group>
  )
}

// Preload the model
useGLTF.preload('/models/agent.glb')
