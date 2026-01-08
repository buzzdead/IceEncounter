import { useEffect, useCallback, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

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
  const isGunDrawn = useGameStore((state) => state.isGunDrawn)

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.code] = true

      // Draw/holster gun with 'G'
      if (e.code === 'KeyG') {
        if (isGunDrawn) {
          holsterGun()
        } else {
          drawGun()
        }
      }

      // Shoot with Space (only if gun is drawn)
      if (e.code === 'Space' && isGunDrawn) {
        const agentPos = useGameStore.getState().agentPosition
        const agentRot = useGameStore.getState().agentRotation

        // Calculate shoot direction based on agent rotation
        const direction = new THREE.Vector3(0, 0, -1)
        const euler = new THREE.Euler(...agentRot)
        direction.applyEuler(euler)

        // Shoot origin slightly in front of agent
        const origin = [
          agentPos[0] + direction.x * 0.5,
          agentPos[1] + 1.5, // Approximately chest height
          agentPos[2] + direction.z * 0.5,
        ]

        shoot(origin, [direction.x, direction.y, direction.z])
      }
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
  }, [drawGun, holsterGun, isGunDrawn, shoot])

  // Update agent position/rotation each frame
  useFrame((_, delta) => {
    const agentPos = useGameStore.getState().agentPosition
    const agentRot = useGameStore.getState().agentRotation
    const currentAnimation = useGameStore.getState().agentAnimation

    let isMoving = false
    const newPos = [...agentPos]
    const newRot = [...agentRot]

    // Calculate forward direction
    const forward = new THREE.Vector3(0, 0, -1)
    const euler = new THREE.Euler(0, agentRot[1], 0)
    forward.applyEuler(euler)

    const right = new THREE.Vector3(1, 0, 0)
    right.applyEuler(euler)

    // Movement
    if (keysPressed.current['KeyW']) {
      newPos[0] += forward.x * MOVE_SPEED * delta
      newPos[2] += forward.z * MOVE_SPEED * delta
      isMoving = true
    }
    if (keysPressed.current['KeyS']) {
      newPos[0] -= forward.x * MOVE_SPEED * delta
      newPos[2] -= forward.z * MOVE_SPEED * delta
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
      setAgentPosition(newPos)
    }
    if (newRot[1] !== agentRot[1]) {
      setAgentRotation(newRot)
    }

    // Update animation based on movement (only if not in special animation)
    if (currentAnimation !== 'drawGun' && currentAnimation !== 'shoot') {
      if (isMoving && currentAnimation !== 'walk') {
        setAgentAnimation('walk')
      } else if (!isMoving && currentAnimation === 'walk') {
        setAgentAnimation('idle')
      }
    }
  })
}

export function useCarControls() {
  const keysPressed = useRef({})

  const setCarPosition = useGameStore((state) => state.setCarPosition)
  const setCarRotation = useGameStore((state) => state.setCarRotation)
  const setCarSpeed = useGameStore((state) => state.setCarSpeed)

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
      // Natural deceleration
      if (speed > 0) {
        speed = Math.max(speed - 3 * delta, 0)
      } else if (speed < 0) {
        speed = Math.min(speed + 3 * delta, 0)
      }
    }

    // Steering
    if (Math.abs(speed) > 0.1) {
      if (keysPressed.current['ArrowLeft']) {
        newRot[1] += 2 * delta * Math.sign(speed)
      }
      if (keysPressed.current['ArrowRight']) {
        newRot[1] -= 2 * delta * Math.sign(speed)
      }
    }

    // Apply movement
    newPos[0] += forward.x * speed * delta
    newPos[2] += forward.z * speed * delta

    setCarPosition(newPos)
    setCarRotation(newRot)
    setCarSpeed(speed)
  })
}
