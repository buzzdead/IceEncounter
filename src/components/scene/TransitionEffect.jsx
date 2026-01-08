import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useGameStore, GAME_PHASES, AGENT_IDS } from '../../stores/gameStore'

const TRANSITION_DURATION = 2.0 // seconds

export function TransitionEffect() {
  const { camera } = useThree()
  const transitionTimeRef = useRef(0)
  const startCameraPositionRef = useRef(null)
  const startCameraTargetRef = useRef(null)

  const gamePhase = useGameStore((state) => state.gamePhase)
  const isTransitioning = useGameStore((state) => state.isTransitioning)
  const transitionProgress = useGameStore((state) => state.transitionProgress)
  const updateTransitionProgress = useGameStore((state) => state.updateTransitionProgress)
  const agents = useGameStore((state) => state.agents)

  // Store camera position when transition starts
  useEffect(() => {
    if (gamePhase === GAME_PHASES.TRANSITION && isTransitioning) {
      transitionTimeRef.current = 0
      startCameraPositionRef.current = camera.position.clone()
      // Calculate target we're looking at
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      startCameraTargetRef.current = camera.position.clone().add(direction.multiplyScalar(10))
    }
  }, [gamePhase, isTransitioning, camera])

  useFrame((_, delta) => {
    if (gamePhase !== GAME_PHASES.TRANSITION || !isTransitioning) return

    transitionTimeRef.current += delta
    const progress = Math.min(transitionTimeRef.current / TRANSITION_DURATION, 1)

    // Update transition progress in store
    updateTransitionProgress(progress)

    // Smoothly move camera to third agent
    if (startCameraPositionRef.current) {
      const thirdAgentPos = agents[AGENT_IDS.THIRD_AGENT].position

      // Target camera position (behind and above third agent)
      const targetCameraPos = new THREE.Vector3(
        thirdAgentPos[0] - 5,
        thirdAgentPos[1] + 8,
        thirdAgentPos[2] + 10
      )

      // Ease function for smooth transition
      const ease = easeInOutCubic(progress)

      // Interpolate camera position
      camera.position.lerpVectors(
        startCameraPositionRef.current,
        targetCameraPos,
        ease
      )

      // Look at third agent
      const lookAtTarget = new THREE.Vector3(
        thirdAgentPos[0],
        thirdAgentPos[1] + 1,
        thirdAgentPos[2]
      )
      camera.lookAt(lookAtTarget)
    }
  })

  // Only show effects during transition
  if (!isTransitioning) return null

  // Calculate effect intensities based on progress
  // Peak intensity at middle of transition
  const peakProgress = Math.sin(transitionProgress * Math.PI)
  const vignetteIntensity = 0.3 + peakProgress * 0.5
  const chromaticIntensity = peakProgress * 0.01
  const noiseIntensity = peakProgress * 0.15

  return (
    <EffectComposer>
      <Vignette
        offset={0.3}
        darkness={vignetteIntensity}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(chromaticIntensity, chromaticIntensity)}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={noiseIntensity}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  )
}

// Easing function
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Alternative simpler transition using just a fade overlay
export function SimpleFadeTransition() {
  const fadeRef = useRef()

  const isTransitioning = useGameStore((state) => state.isTransitioning)
  const transitionProgress = useGameStore((state) => state.transitionProgress)
  const updateTransitionProgress = useGameStore((state) => state.updateTransitionProgress)
  const gamePhase = useGameStore((state) => state.gamePhase)

  useFrame((_, delta) => {
    if (gamePhase !== GAME_PHASES.TRANSITION || !isTransitioning) return

    const newProgress = transitionProgress + delta / TRANSITION_DURATION
    updateTransitionProgress(newProgress)
  })

  if (!isTransitioning) return null

  // Fade to black then fade back
  const opacity = transitionProgress < 0.5
    ? transitionProgress * 2  // Fade in (0 -> 1)
    : (1 - transitionProgress) * 2  // Fade out (1 -> 0)

  return (
    <mesh ref={fadeRef} position={[0, 0, -1]} renderOrder={999}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        color="black"
        transparent
        opacity={opacity}
        depthTest={false}
      />
    </mesh>
  )
}
