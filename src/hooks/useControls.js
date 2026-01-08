import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, GAME_PHASES, AGENT_IDS } from '../stores/gameStore'

const MOVE_SPEED = 5
const ROTATION_SPEED = 3

export function useAgentControls() {
  const keysPressed = useRef({})

  const setAgentPosition = useGameStore((state) => state.setAgentPosition)
  const setAgentRotation = useGameStore((state) => state.setAgentRotation)
  const setAgentAnimation = useGameStore((state) => state.setAgentAnimation)
  const drawGun = useGameStore((state) => state.drawGun)
  const holsterGun = useGameStore((state) => state.holsterGun)
  const shoot = useGameStore((state) => state.shoot)
  const checkDriverDoorTrigger = useGameStore((state) => state.checkDriverDoorTrigger)
  const triggerCarReverse = useGameStore((state) => state.triggerCarReverse)

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log(e.code)
      keysPressed.current[e.code] = true

      const { gamePhase, activeAgentId, agents } = useGameStore.getState()

      // Only allow controls during playable phases
      if (gamePhase === GAME_PHASES.CAR_REVERSING || gamePhase === GAME_PHASES.TRANSITION) {
        return
      }

      const activeAgent = agents[activeAgentId]

      // Draw/holster gun with 'G'
      if (e.button === 2) {
  // Prevent the default browser context menu from firing
  e.preventDefault();

  if (activeAgent.isGunDrawn) {
    holsterGun(activeAgentId)
  } else {
    console.log("drawing")
    drawGun(activeAgentId)
  }
}

      // Shoot with Space (only if gun is drawn)
      if (e.code === 'Space' && activeAgent.isGunDrawn) {
        const agentPos = activeAgent.position
        const agentRot = activeAgent.rotation

        const direction = new THREE.Vector3(0, 0, -1)
        const euler = new THREE.Euler(...agentRot)
        direction.applyEuler(euler)

        const origin = [
          agentPos[0] + direction.x * 0.5,
          agentPos[1] + 1.5,
          agentPos[2] + direction.z * 0.5,
        ]

        shoot(origin, [direction.x, direction.y, direction.z])
        setAgentAnimation(activeAgentId, 'shoot')
      }
    }

    const handleKeyUp = (e) => {
      keysPressed.current[e.code] = false
    }

   const handleMouseDown = (e) => {
    if (e.button === 2) {
      e.preventDefault();
      const { activeAgentId } = useGameStore.getState();
      drawGun(activeAgentId); // Sets animation to 'drawGun'
    }
  };

  const handleMouseUp = (e) => {
    if (e.button === 2) {
      const { activeAgentId } = useGameStore.getState();
      holsterGun(activeAgentId); // Should set animation back to 'idle'
    }
  };

  const handleClick = (e) => {
    // Left click (button 0) - fire when aiming
    if (e.button === 0) {
      const { gamePhase, activeAgentId, agents } = useGameStore.getState()

      // Only allow shooting during playable phases
      if (gamePhase === GAME_PHASES.CAR_REVERSING || gamePhase === GAME_PHASES.TRANSITION) {
        return
      }

      const activeAgent = agents[activeAgentId]

      // Only fire if gun is drawn (aiming)
      if (activeAgent.isGunDrawn) {
        e.preventDefault()

        const agentPos = activeAgent.position
        const agentRot = activeAgent.rotation

        // Calculate forward direction based on agent rotation
        // Use +Z because model faces opposite direction (same as movement)
        const direction = new THREE.Vector3(0, 0, 1)
        const euler = new THREE.Euler(...agentRot)
        direction.applyEuler(euler)

        // Origin: slightly in front of agent at gun height
        const origin = [
          agentPos[0] + direction.x * 0.5,
          agentPos[1] + 1.5,
          agentPos[2] + direction.z * 0.5,
        ]

        shoot(origin, [direction.x, direction.y, direction.z])
        setAgentAnimation(activeAgentId, 'shoot')
      }
    }
  }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousedown', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [drawGun, holsterGun, shoot, setAgentAnimation])

  // Update agent position/rotation each frame
  useFrame((_, delta) => {
    const { gamePhase, activeAgentId, agents } = useGameStore.getState()

    // Only allow movement during playable phases
    if (gamePhase === GAME_PHASES.CAR_REVERSING || gamePhase === GAME_PHASES.TRANSITION) {
      return
    }

    const activeAgent = agents[activeAgentId]
    const agentPos = activeAgent.position
    const agentRot = activeAgent.rotation
    const currentAnimation = activeAgent.animation

    let isMoving = false
    const newPos = [...agentPos]
    const newRot = [...agentRot]

    // Calculate forward direction
    const forward = new THREE.Vector3(0, 0, -1)
    const euler = new THREE.Euler(0, agentRot[1], 0)
    forward.applyEuler(euler)

    const right = new THREE.Vector3(1, 0, 0)
    right.applyEuler(euler)

    // Movement (inverted because model faces opposite direction)
    if (keysPressed.current['KeyW']) {
      newPos[0] -= forward.x * MOVE_SPEED * delta
      newPos[2] -= forward.z * MOVE_SPEED * delta
      isMoving = true
    }
    if (keysPressed.current['KeyS']) {
      newPos[0] += forward.x * MOVE_SPEED * delta
      newPos[2] += forward.z * MOVE_SPEED * delta
      isMoving = true
    }
    if (keysPressed.current['KeyA']) {
      newRot[1] += ROTATION_SPEED * delta
    }
    if (keysPressed.current['KeyD']) {
      newRot[1] -= ROTATION_SPEED * delta
    }

    // Strafe
    if (keysPressed.current['KeyQ']) {
      newPos[0] -= right.x * MOVE_SPEED * delta
      newPos[2] -= right.z * MOVE_SPEED * delta
      isMoving = true
    }
    if (keysPressed.current['KeyE']) {
      newPos[0] += right.x * MOVE_SPEED * delta
      newPos[2] += right.z * MOVE_SPEED * delta
      isMoving = true
    }

    // Update position
    if (newPos[0] !== agentPos[0] || newPos[2] !== agentPos[2]) {
      setAgentPosition(activeAgentId, newPos)
    }
    if (newRot[1] !== agentRot[1]) {
      setAgentRotation(activeAgentId, newRot)
    }

    // Update animation based on movement
    if (currentAnimation !== 'drawGun' && currentAnimation !== 'shoot') {
      if (isMoving && currentAnimation !== 'walk') {
        setAgentAnimation(activeAgentId, 'walk')
      } else if (!isMoving && currentAnimation === 'walk') {
        setAgentAnimation(activeAgentId, 'idle')
      }
    }

    // Check driver door trigger during approach phase
    if (gamePhase === GAME_PHASES.APPROACH_CAR) {
      if (checkDriverDoorTrigger()) {
        triggerCarReverse()
      }
    }
  })
}

export function useCarControls() {
  const keysPressed = useRef({})

  const setCarPosition = useGameStore((state) => state.setCarPosition)
  const setCarRotation = useGameStore((state) => state.setCarRotation)
  const setCarSpeed = useGameStore((state) => state.setCarSpeed)
  const setSteeringAngle = useGameStore((state) => state.setSteeringAngle)

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.code] = true
    }

    const handleKeyUp = (e) => {
      keysPressed.current[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    const carPos = useGameStore.getState().carPosition
    const carRot = useGameStore.getState().carRotation
    let speed = useGameStore.getState().carSpeed
    let steering = useGameStore.getState().steeringAngle

    const newPos = [...carPos]
    const newRot = [...carRot]

    // Calculate forward direction
    const forward = new THREE.Vector3(0, 0, -1)
    const euler = new THREE.Euler(0, carRot[1], 0)
    forward.applyEuler(euler)

    // Accelerate/Brake with Arrow keys
    if (keysPressed.current['ArrowUp']) {
      speed = Math.min(speed + 5 * delta, 20)
    } else if (keysPressed.current['ArrowDown']) {
      speed = Math.max(speed - 10 * delta, -10)
    } else {
      if (speed > 0) {
        speed = Math.max(speed - 3 * delta, 0)
      } else if (speed < 0) {
        speed = Math.min(speed + 3 * delta, 0)
      }
    }

    // Steering angle for front wheels
    if (keysPressed.current['ArrowLeft']) {
      steering = Math.min(steering + 2 * delta, Math.PI / 6)
    } else if (keysPressed.current['ArrowRight']) {
      steering = Math.max(steering - 2 * delta, -Math.PI / 6)
    } else {
      // Return steering to center
      if (steering > 0) {
        steering = Math.max(steering - 3 * delta, 0)
      } else if (steering < 0) {
        steering = Math.min(steering + 3 * delta, 0)
      }
    }

    // Apply steering to car rotation when moving
    if (Math.abs(speed) > 0.1) {
      newRot[1] += steering * delta * Math.sign(speed) * 2
    }

    // Apply movement
    newPos[0] += forward.x * speed * delta
    newPos[2] += forward.z * speed * delta

    setCarPosition(newPos)
    setCarRotation(newRot)
    setCarSpeed(speed)
    setSteeringAngle(steering)
  })
}
