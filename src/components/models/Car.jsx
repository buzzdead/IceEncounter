import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../stores/gameStore'

// Wheel names - matching Blender model's wheel object names
const WHEEL_NAMES = {
  frontLeft: 'FrontWheelL',
  frontRight: 'FrontWheelR',
  rearLeft: 'RearWheelL',
  rearRight: 'RearWheelR',
}

// Glass panel names - update to match your Blender model
const GLASS_PANELS = {
  windshield: 'Glass_Windshield',
  rear: 'Glass_Rear',
  leftFront: 'Glass_Left_Front',
  leftRear: 'Glass_Left_Rear',
  rightFront: 'Glass_Right_Front',
  rightRear: 'Glass_Right_Rear',
}

export function Car({ modelPath = '/models/car.glb', ...props }) {
  const group = useRef()
  const wheelRefs = useRef({
    frontLeft: null,
    frontRight: null,
    rearLeft: null,
    rearRight: null,
  })
  const glassRefs = useRef({})
  const glassShardsRef = useRef({})

  const { scene } = useGLTF(modelPath)

  const carPosition = useGameStore((state) => state.carPosition)
  const carRotation = useGameStore((state) => state.carRotation)
  const carSpeed = useGameStore((state) => state.carSpeed)
  const steeringAngle = useGameStore((state) => state.steeringAngle)
  const brokenGlassPanels = useGameStore((state) => state.brokenGlassPanels)
  const updateWheelRotation = useGameStore((state) => state.updateWheelRotation)

  // Clone scene and find wheel/glass references
  const clonedScene = useMemo(() => {
    const clone = scene.clone()

    // Traverse and find wheels and glass
    // Wheels might be Groups or Objects, not just Meshes
    clone.traverse((child) => {
      // Find wheels by name (can be Group, Object3D, or Mesh)
      Object.entries(WHEEL_NAMES).forEach(([key, name]) => {
        if (child.name === name || child.name.includes(name)) {
          wheelRefs.current[key] = child
         console.log(`Found wheel ${key}:`, child.name, child.type, 'Children Count:', child.children.length, child);
        
        }
      })

      // Find glass panels (usually meshes)
      if (child.isMesh) {
        Object.entries(GLASS_PANELS).forEach(([key, name]) => {
          if (child.name === name || child.name.includes(name)) {
            glassRefs.current[key] = child
            // Make glass transparent
            if (child.material) {
              child.material = child.material.clone()
              child.material.transparent = true
              child.material.opacity = 0.3
              child.material.side = THREE.DoubleSide
            }
          }
        })
      }
    })
  clone.rotation.set(0, -Math.PI / 2, 0)
    clone.scale.set(3,3,3)
    clone.position.set(0, 1.15, 0)
    return clone
  }, [scene])

  // Handle glass breaking
  useEffect(() => {
    Object.entries(glassRefs.current).forEach(([key, glassMesh]) => {
      if (!glassMesh) return

      const isBroken = brokenGlassPanels.includes(key)
      glassMesh.visible = !isBroken

      // Create/show shards when broken
      if (isBroken && !glassShardsRef.current[key]) {
        const shards = createGlassShards(glassMesh)
        glassShardsRef.current[key] = shards
        group.current?.add(shards)
      }
    })
  }, [brokenGlassPanels])

  // Rotate wheels based on car speed and steering
  useFrame((_, delta) => {
 
    if (group.current) {
      group.current.position.set(...carPosition)
      group.current.rotation.set(...carRotation)
    }

    // Rotate all wheels based on speed (rolling)
    // Using Y axis for rolling (common in Blender exports)
   const wheelRotationSpeed = carSpeed * delta * 5

    // Apply rolling rotation and steering to wheels
    const { frontLeft, frontRight, rearLeft, rearRight } = wheelRefs.current

    // Front wheels: rolling + steering
    if (frontLeft) {
      frontLeft.rotation.z += wheelRotationSpeed // Corrected rolling axis to X
      frontLeft.rotation.y = steeringAngle       // Assuming Z or Y is for steering
    }
    if (frontRight) {
      frontRight.rotation.z += wheelRotationSpeed // Corrected rolling axis to X
      frontRight.rotation.y = steeringAngle
    }

    // Rear wheels: rolling only (already correct in your original code)
    if (rearLeft) {
      rearLeft.rotation.z += wheelRotationSpeed
    }
    if (rearRight) {
      rearRight.rotation.z += wheelRotationSpeed
    }

    // Update wheel rotation in store for reference
    if (carSpeed !== 0) {
      updateWheelRotation(delta)
    }


    // Animate glass shards falling
    Object.values(glassShardsRef.current).forEach((shardGroup) => {
      if (shardGroup) {
        shardGroup.children.forEach((shard) => {
          if (shard.userData.velocity) {
            shard.position.add(shard.userData.velocity)
            shard.userData.velocity.y -= 0.01 // gravity
            shard.rotation.x += shard.userData.rotationSpeed.x
            shard.rotation.y += shard.userData.rotationSpeed.y
            shard.rotation.z += shard.userData.rotationSpeed.z

            // Fade out and remove when below ground
            if (shard.position.y < -2) {
              shard.visible = false
            }
          }
        })
      }
    })
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Create glass shard particles
function createGlassShards(glassMesh) {
  const shardGroup = new THREE.Group()
  const shardCount = 20

  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([
    0, 0, 0,
    0.05, 0.1, 0,
    0.1, 0, 0,
  ])
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  const material = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  })

  const center = new THREE.Vector3()
  glassMesh.getWorldPosition(center)

  for (let i = 0; i < shardCount; i++) {
    const shard = new THREE.Mesh(geometry.clone(), material.clone())

    // Random position around the glass center
    shard.position.set(
      center.x + (Math.random() - 0.5) * 0.5,
      center.y + (Math.random() - 0.5) * 0.5,
      center.z + (Math.random() - 0.5) * 0.5
    )

    // Random velocity
    shard.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      Math.random() * 0.05,
      (Math.random() - 0.5) * 0.1
    )

    // Random rotation speed
    shard.userData.rotationSpeed = {
      x: (Math.random() - 0.5) * 0.2,
      y: (Math.random() - 0.5) * 0.2,
      z: (Math.random() - 0.5) * 0.2,
    }

    // Random scale
    const scale = 0.5 + Math.random() * 1
    shard.scale.set(scale, scale, scale)

    shardGroup.add(shard)
  }

  return shardGroup
}

// Preload the model
useGLTF.preload('/models/car.glb')
