import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../stores/gameStore'

// Animation name mappings - update these to match your actual animation names in Blender
const ANIMATION_MAP = {
  idle: 'Idle',       // Replace with your actual idle animation name
  walk: 'Walk',       // Replace with your actual walk animation name
  drawGun: 'DrawGun', // Replace with your actual draw gun animation name
  shoot: 'Shoot',     // Replace with your actual shoot animation name
}

export function Agent({ modelPath = '/models/agent.glb', ...props }) {
  const group = useRef()
  const { scene, animations } = useGLTF(modelPath)
  const { actions, mixer } = useAnimations(animations, group)

  const agentAnimation = useGameStore((state) => state.agentAnimation)
  const agentPosition = useGameStore((state) => state.agentPosition)
  const agentRotation = useGameStore((state) => state.agentRotation)
  const isGunDrawn = useGameStore((state) => state.isGunDrawn)

  // Clone scene to avoid sharing issues
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Handle animation changes
  useEffect(() => {
    const animationName = ANIMATION_MAP[agentAnimation]
    const action = actions[animationName]

    if (!action) {
      console.warn(`Animation "${animationName}" not found. Available animations:`, Object.keys(actions))
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

    // For shoot animation, play once then return to idle or walk
    if (agentAnimation === 'shoot') {
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true

      const onFinished = () => {
        useGameStore.getState().setAgentAnimation(isGunDrawn ? 'idle' : 'idle')
        mixer.removeEventListener('finished', onFinished)
      }
      mixer.addEventListener('finished', onFinished)
    } else if (agentAnimation === 'drawGun') {
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true

      const onFinished = () => {
        useGameStore.getState().setAgentAnimation('idle')
        mixer.removeEventListener('finished', onFinished)
      }
      mixer.addEventListener('finished', onFinished)
    } else {
      action.setLoop(THREE.LoopRepeat)
    }
  }, [agentAnimation, actions, mixer, isGunDrawn])

  // Update position and rotation
  useFrame(() => {
    if (group.current) {
      group.current.position.set(...agentPosition)
      group.current.rotation.set(...agentRotation)
    }
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload the model
useGLTF.preload('/models/agent.glb')
