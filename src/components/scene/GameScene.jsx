import { Suspense, useState, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky, Environment } from '@react-three/drei'
import { Agent } from '../models/Agent'
import { Car } from '../models/Car'
import { PlaceholderAgent } from '../models/PlaceholderAgent'
import { PlaceholderCar } from '../models/PlaceholderCar'
import { Bullets } from '../models/Bullet'
import { Ground } from '../environment/Ground'
import { GameController } from './GameController'
import { TransitionEffect } from './TransitionEffect'
import { useAgentControls } from '../../hooks/useControls'
import { useGameStore, GAME_PHASES, AGENT_IDS } from '../../stores/gameStore'
import * as THREE from 'three'

// Controls component to use hooks inside Canvas
function Controls() {
  useAgentControls()
  return null
}

// Camera that follows the active agent
function FollowCamera() {
  const { camera } = useThree()
  const activeAgentId = useGameStore((state) => state.activeAgentId)
  const agents = useGameStore((state) => state.agents)

  // Camera offset from agent (behind and above)
  // Model faces +Z, so camera should be at +Z to be behind
  const offset = useRef(new THREE.Vector3(0, 5, -10))
  const smoothedPosition = useRef(new THREE.Vector3())
  const smoothedLookAt = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const agent = agents[activeAgentId]
    if (!agent) return

    const agentPos = new THREE.Vector3(...agent.position)
    const agentRot = agent.rotation[1] // Y rotation

    // Calculate camera position based on agent's rotation
    // Rotate the offset around the agent
    const rotatedOffset = offset.current.clone()
    rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), agentRot)

    const targetPosition = agentPos.clone().add(rotatedOffset)
    const targetLookAt = agentPos.clone().add(new THREE.Vector3(0, 1.5, 0)) // Look at agent's head height

    // Smooth camera movement
    const smoothFactor = 1 - Math.pow(0.001, delta)
    smoothedPosition.current.lerp(targetPosition, smoothFactor)
    smoothedLookAt.current.lerp(targetLookAt, smoothFactor)

    camera.position.copy(smoothedPosition.current)
    camera.lookAt(smoothedLookAt.current)
  })

  return null
}

// Check if a model exists
function useModelExists(path) {
  const [exists, setExists] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetch(path, { method: 'HEAD' })
      .then((res) => {
        setExists(res.ok)
        setChecked(true)
      })
      .catch(() => {
        setExists(false)
        setChecked(true)
      })
  }, [path])

  return { exists, checked }
}

// Loading fallback
function Loader() {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  )
}

// Driver door trigger zone visualization (debug)
function DriverDoorTrigger({ visible = false }) {
  const driverDoorPosition = useGameStore((state) => state.driverDoorPosition)
  const driverDoorRadius = useGameStore((state) => state.driverDoorRadius)

  if (!visible) return null

  return (
    <mesh position={driverDoorPosition} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[driverDoorRadius - 0.1, driverDoorRadius, 32]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
    </mesh>
  )
}

export function GameScene() {
  const { exists: agentModelExists, checked: agentChecked } = useModelExists('/models/agent.glb')
  const { exists: carModelExists, checked: carChecked } = useModelExists('/models/car.glb')

  return (
    <>
      {/* Game Systems */}
      <Controls />
      <GameController />

      {/* Follow camera */}
      <FollowCamera />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />

      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[10, 20, 10]}
        inclination={0.5}
        azimuth={0.25}
      />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Ground */}
      <Ground size={100} roadWidth={12} />

      {/* Driver door trigger zone (debug - set visible={true} to see it) */}
      <DriverDoorTrigger visible={true} />

      {/* All three agents */}
      {agentChecked && !agentModelExists && (
        <>
          <PlaceholderAgent agentId={AGENT_IDS.NPC_STANDING} />
          <PlaceholderAgent agentId={AGENT_IDS.PLAYER} />
          <PlaceholderAgent agentId={AGENT_IDS.THIRD_AGENT} />
        </>
      )}
      {agentChecked && agentModelExists && (
        <Suspense fallback={<Loader />}>
          <Agent agentId={AGENT_IDS.NPC_STANDING} />
          <Agent agentId={AGENT_IDS.PLAYER} />
          <Agent agentId={AGENT_IDS.THIRD_AGENT} />
        </Suspense>
      )}
      {!agentChecked && <Loader />}

      {/* Car */}
      {carChecked && !carModelExists && <PlaceholderCar />}
      {carChecked && carModelExists && (
        <Suspense fallback={<Loader />}>
          <Car modelPath="/models/car.glb" />
        </Suspense>
      )}
      {!carChecked && <Loader />}

      {/* Bullets */}
      <Bullets />

      {/* Transition effects */}
      <TransitionEffect />
    </>
  )
}
