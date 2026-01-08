import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../stores/gameStore'

const BULLET_MAX_DISTANCE = 100
const BULLET_LIFETIME = 5000 // ms

export function Bullet({ bullet, modelPath = '/models/Bullet.glb' }) {
  const ref = useRef()
  const { scene } = useGLTF(modelPath)
  const removeBullet = useGameStore((state) => state.removeBullet)
  const breakGlass = useGameStore((state) => state.breakGlass)

  // Clone the bullet model
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Direction vector normalized
  const direction = useMemo(
    () => new THREE.Vector3(...bullet.direction).normalize(),
    [bullet.direction]
  )

  // Initial position
  const initialPosition = useMemo(
    () => new THREE.Vector3(...bullet.position),
    [bullet.position]
  )

  // Calculate rotation to face the direction of travel
  const bulletRotation = useMemo(() => {
    const quaternion = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const matrix = new THREE.Matrix4()
    matrix.lookAt(new THREE.Vector3(0, 0, 0), direction, up)
    quaternion.setFromRotationMatrix(matrix)
    const euler = new THREE.Euler().setFromQuaternion(quaternion)
    return [euler.x, euler.y, euler.z]
  }, [direction])

  useFrame((state, delta) => {
    if (!ref.current) return

    // Move bullet
    const movement = direction.clone().multiplyScalar(bullet.speed * delta)
    ref.current.position.add(movement)

    // Calculate distance traveled
    const distanceTraveled = ref.current.position.distanceTo(initialPosition)

    // Remove bullet if too far or too old
    if (
      distanceTraveled > BULLET_MAX_DISTANCE ||
      Date.now() - bullet.createdAt > BULLET_LIFETIME
    ) {
      removeBullet(bullet.id)
      return
    }

    // Simple collision detection with scene objects
    // You can extend this with more sophisticated raycasting
    const raycaster = new THREE.Raycaster(
      ref.current.position,
      direction,
      0,
      bullet.speed * delta * 2
    )

    // Get all objects in scene (excluding the bullet itself)
    const intersects = raycaster.intersectObjects(
      state.scene.children,
      true
    ).filter(hit => !hit.object.userData.isBullet)

    if (intersects.length > 0) {
      const hit = intersects[0]

      // Check if we hit glass
      if (hit.object.name?.includes('Glass')) {
        // Find which glass panel was hit and break it
        const glassPanelNames = [
          'windshield', 'rear', 'leftFront', 'leftRear', 'rightFront', 'rightRear'
        ]
        glassPanelNames.forEach(panelName => {
          if (hit.object.name.toLowerCase().includes(panelName.toLowerCase())) {
            breakGlass(panelName)
          }
        })
      }

      // Remove bullet on hit
      removeBullet(bullet.id)
    }
  })

  return (
    <group
      ref={ref}
      position={bullet.position}
      rotation={bulletRotation}
      userData={{ isBullet: true }}
    >
      <primitive object={clonedScene} scale={0.1} />
    </group>
  )
}

// Bullets manager component
export function Bullets({ modelPath }) {
  const bullets = useGameStore((state) => state.bullets)

  return (
    <>
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} bullet={bullet} modelPath={modelPath} />
      ))}
    </>
  )
}

// Preload the model
useGLTF.preload('/models/Bullet.glb')
