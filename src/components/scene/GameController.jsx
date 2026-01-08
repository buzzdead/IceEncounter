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
  targetPosition: [8, 0, -5],
  walkSpeed: 2,
}

// Car charge sequence parameters
const CAR_CHARGE_SEQUENCE = {
  // Phase 1: Accelerate towards agent
  approachDuration: 1.5,
  approachSpeed: 8,

  // Phase 2: Turn right and graze past
  turnDuration: 2.0,
  turnSpeed: 6,
  turnRate: -1.2, // Negative = turn right

  // Total duration
  totalDuration: 3.5,
}

export function GameController() {
  const sequenceTimeRef = useRef(0)
  const chargeTimeRef = useRef(0)
  const activeAgentId = useGameStore((state) => state.activeAgentId)
  const carStartPositionRef = useRef(null)
  const carStartRotationRef = useRef(null)
  const agentTargetPosRef = useRef(null)

  const gamePhase = useGameStore((state) => state.gamePhase)
  const setCarPosition = useGameStore((state) => state.setCarPosition)
  const setCarRotation = useGameStore((state) => state.setCarRotation)
  const setSteeringAngle = useGameStore((state) => state.setSteeringAngle)
  const setCarSpeed = useGameStore((state) => state.setCarSpeed)
  const startTransition = useGameStore((state) => state.startTransition)
  const setAgentPosition = useGameStore((state) => state.setAgentPosition)
  const setAgentRotation = useGameStore((state) => state.setAgentRotation)
  const checkFrontTrigger = useGameStore((state) => state.checkFrontTrigger)
  const triggerCarCharge = useGameStore((state) => state.triggerCarCharge)

  // Reset sequence timer when entering car reversing phase
  useEffect(() => {
    if (gamePhase === GAME_PHASES.CAR_REVERSING) {
      sequenceTimeRef.current = 0
      const state = useGameStore.getState()
      carStartPositionRef.current = [...state.carPosition]
      carStartRotationRef.current = [...state.carRotation]
    }
  }, [gamePhase])

  // Initialize car charge sequence
  useEffect(() => {
    if (gamePhase === GAME_PHASES.CAR_CHARGE) {
      chargeTimeRef.current = 0
      const state = useGameStore.getState()
      // Store the agent's position as target for the car to aim at initially
      agentTargetPosRef.current = [...state.agents[AGENT_IDS.THIRD_AGENT].position]
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

    // Check front trigger during THIRD_AGENT phase
    if (gamePhase === GAME_PHASES.THIRD_AGENT) {
      if (checkFrontTrigger()) {
        triggerCarCharge()
      }
    }

    // Handle car charge sequence
    if (gamePhase === GAME_PHASES.CAR_CHARGE) {
      chargeTimeRef.current += delta
      const t = chargeTimeRef.current
      const seq = CAR_CHARGE_SEQUENCE

      const currentRot = state.carRotation[1]
      const forward = new THREE.Vector3(0, 0, -1)
      forward.applyEuler(new THREE.Euler(0, currentRot, 0))

      // Phase 1: Drive towards agent (first 1.5 seconds)
      if (t < seq.approachDuration) {
        const newPos = [...state.carPosition]
        newPos[0] += forward.x * seq.approachSpeed * delta
        newPos[2] += forward.z * seq.approachSpeed * delta

        setCarPosition(newPos)
        setCarSpeed(seq.approachSpeed)
      }
      // Phase 2: Turn right and continue driving (1.5s to 3.5s)
      else if (t < seq.totalDuration) {
        const newPos = [...state.carPosition]
        newPos[0] += forward.x * seq.turnSpeed * delta
        newPos[2] += forward.z * seq.turnSpeed * delta

        const newRot = [...state.carRotation]
        newRot[1] += seq.turnRate * delta

        setCarPosition(newPos)
        setCarRotation(newRot)
        setSteeringAngle(seq.turnRate * 0.3) // Visual steering
        setCarSpeed(seq.turnSpeed)
      }
      // Sequence complete
      else {
        setCarSpeed(0)
        setSteeringAngle(0)
        // Could trigger next phase here if needed
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
      if (distance > 0.5 && activeAgentId !== AGENT_IDS.THIRD_AGENT) {
        // Calculate movement
        const dirX = dx / distance
        const dirZ = dz / distance

        const newPos = [
          thirdAgent.position[0] + dirX * THIRD_AGENT_WALK.walkSpeed * delta,
          thirdAgent.position[1],
          thirdAgent.position[2] + dirZ * THIRD_AGENT_WALK.walkSpeed * delta,
        ]

        // Calculate rotation to face movement direction (add PI to face forward)
        const targetRotY = Math.atan2(dirX, dirZ)

        setAgentPosition(AGENT_IDS.THIRD_AGENT, newPos)
        setAgentRotation(AGENT_IDS.THIRD_AGENT, [0, targetRotY, 0])
      }
    }
  })

  return null
}
