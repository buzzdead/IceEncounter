import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, GAME_PHASES, AGENT_IDS } from '../../stores/gameStore'

// Scripted car reverse sequence parameters
const CAR_REVERSE_SEQUENCE = {
  // Phase 1: Turn wheels left
  steeringDuration: 0.8,
  targetSteeringAngle: Math.PI / 5, // ~36 degrees left

  // Phase 2: Reverse while steering
  reverseDuration: 2.0,
  reverseSpeed: -3,
  reverseRotation: 0.3, // How much the car rotates while reversing

  // Total duration before transition starts
  totalDuration: 2.8,
}

// Third agent walking parameters
const THIRD_AGENT_WALK = {
  // Target position (front of car)
  targetPosition: [0, 0, 4],
  walkSpeed: 2,
}

export function GameController() {
  const sequenceTimeRef = useRef(0)
  const carStartPositionRef = useRef(null)
  const carStartRotationRef = useRef(null)

  const gamePhase = useGameStore((state) => state.gamePhase)
  const setCarPosition = useGameStore((state) => state.setCarPosition)
  const setCarRotation = useGameStore((state) => state.setCarRotation)
  const setSteeringAngle = useGameStore((state) => state.setSteeringAngle)
  const setCarSpeed = useGameStore((state) => state.setCarSpeed)
  const startTransition = useGameStore((state) => state.startTransition)
  const setAgentPosition = useGameStore((state) => state.setAgentPosition)
  const setAgentRotation = useGameStore((state) => state.setAgentRotation)

  // Reset sequence timer when entering car reversing phase
  useEffect(() => {
    if (gamePhase === GAME_PHASES.CAR_REVERSING) {
      sequenceTimeRef.current = 0
      const state = useGameStore.getState()
      carStartPositionRef.current = [...state.carPosition]
      carStartRotationRef.current = [...state.carRotation]
    }
  }, [gamePhase])

  useFrame((_, delta) => {
    const state = useGameStore.getState()

    // Handle car reversing sequence
    if (gamePhase === GAME_PHASES.CAR_REVERSING) {
      sequenceTimeRef.current += delta
      const t = sequenceTimeRef.current
      const seq = CAR_REVERSE_SEQUENCE

      // Phase 1: Turn wheels left (first 0.8 seconds)
      if (t < seq.steeringDuration) {
        const steeringProgress = t / seq.steeringDuration
        // Ease out for smooth steering
        const easedProgress = 1 - Math.pow(1 - steeringProgress, 3)
        setSteeringAngle(seq.targetSteeringAngle * easedProgress)
      }

      // Phase 2: Reverse while steering (0.8s to 2.8s)
      if (t >= seq.steeringDuration && t < seq.totalDuration) {
        const reverseProgress = (t - seq.steeringDuration) / seq.reverseDuration

        // Calculate new position (reversing)
        const currentRot = state.carRotation[1]
        const forward = new THREE.Vector3(0, 0, -1)
        forward.applyEuler(new THREE.Euler(0, currentRot, 0))

        const newPos = [...state.carPosition]
        newPos[0] += forward.x * seq.reverseSpeed * delta
        newPos[2] += forward.z * seq.reverseSpeed * delta

        // Rotate car while reversing (steering effect)
        const newRot = [...state.carRotation]
        newRot[1] -= seq.reverseRotation * delta

        setCarPosition(newPos)
        setCarRotation(newRot)
        setCarSpeed(seq.reverseSpeed)
      }

      // Sequence complete - start transition
      if (t >= seq.totalDuration) {
        setCarSpeed(0)
        startTransition()
      }
    }

    // Handle third agent walking during all phases (NPC behavior)
    if (state.agents[AGENT_IDS.THIRD_AGENT]) {
      const thirdAgent = state.agents[AGENT_IDS.THIRD_AGENT]
      const targetPos = THIRD_AGENT_WALK.targetPosition

      // Calculate direction to target
      const dx = targetPos[0] - thirdAgent.position[0]
      const dz = targetPos[2] - thirdAgent.position[2]
      const distance = Math.sqrt(dx * dx + dz * dz)

      // Only move if not at target yet
      if (distance > 0.5) {
        // Calculate movement
        const dirX = dx / distance
        const dirZ = dz / distance

        const newPos = [
          thirdAgent.position[0] + dirX * THIRD_AGENT_WALK.walkSpeed * delta,
          thirdAgent.position[1],
          thirdAgent.position[2] + dirZ * THIRD_AGENT_WALK.walkSpeed * delta,
        ]

        // Calculate rotation to face movement direction
        const targetRotY = Math.atan2(-dirX, -dirZ)

        setAgentPosition(AGENT_IDS.THIRD_AGENT, newPos)
        setAgentRotation(AGENT_IDS.THIRD_AGENT, [0, targetRotY, 0])
      }
    }
  })

  return null
}
