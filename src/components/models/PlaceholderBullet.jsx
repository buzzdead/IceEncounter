import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../stores/gameStore'

const BULLET_MAX_DISTANCE = 100
const BULLET_LIFETIME = 5000

/**
 * Placeholder Bullet for development/testing
 */
function PlaceholderBullet({ bullet }) {
  const ref = useRef()
  const removeBullet = useGameStore((state) => state.removeBullet)
  const breakGlass = useGameStore((state) => state.breakGlass)

  const direction = useMemo(
    () => new THREE.Vector3(...bullet.direction).normalize(),
    [bullet.direction]
  )

  const initialPosition = useMemo(
    () => new THREE.Vector3(...bullet.position),
    [bullet.position]
  )

  // Calculate rotation to face the direction of travel
  const bulletRotation = useMemo(() => {
    const euler = new THREE.Euler()
    // Look at direction (bullet points along -Z by default, we rotate to match direction)
    const quaternion = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const matrix = new THREE.Matrix4()
    matrix.lookAt(new THREE.Vector3(0, 0, 0), direction, up)
    quaternion.setFromRotationMatrix(matrix)
    euler.setFromQuaternion(quaternion)
    return [euler.x, euler.y, euler.z]
  }, [direction])

  useFrame((state, delta) => {
    if (!ref.current) return

    const movement = direction.clone().multiplyScalar(bullet.speed * delta)
    ref.current.position.add(movement)

    const distanceTraveled = ref.current.position.distanceTo(initialPosition)

    if (
      distanceTraveled > BULLET_MAX_DISTANCE ||
      Date.now() - bullet.createdAt > BULLET_LIFETIME
    ) {
      removeBullet(bullet.id)
      return
    }

    // Simple collision detection
    const raycaster = new THREE.Raycaster(
      ref.current.position,
      direction,
      0,
      bullet.speed * delta * 2
    )

    const intersects = raycaster
      .intersectObjects(state.scene.children, true)
      .filter((hit) => !hit.object.userData.isBullet)

    if (intersects.length > 0) {
      const hit = intersects[0]

      // Check for glass hits
      const glassNames = ['windshield', 'rear', 'leftFront', 'leftRear', 'rightFront', 'rightRear']
      glassNames.forEach((name) => {
        if (hit.object.name?.toLowerCase().includes(name.toLowerCase())) {
          breakGlass(name)
        }
      })

      removeBullet(bullet.id)
    }
  })

  return (
    <group ref={ref} position={bullet.position} rotation={bulletRotation} userData={{ isBullet: true }}>
      {/* Bullet body - oriented along Z axis (forward) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.02, 0.08, 4, 8]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          metalness={0.8}
        />
      </mesh>
      {/* Tracer effect - behind the bullet */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.01, 0.02, 0.3, 8]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export function PlaceholderBullets() {
  const bullets = useGameStore((state) => state.bullets)

  return (
    <>
      {bullets.map((bullet) => (
        <PlaceholderBullet key={bullet.id} bullet={bullet} />
      ))}
    </>
  )
}
