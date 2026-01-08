import { useMemo } from 'react'
import * as THREE from 'three'

// Asphalt with road markings
export function Ground({
  size = 100,
  roadWidth = 10,
  stripeWidth = 0.2,
  stripeLength = 3,
  stripeGap = 2,
  ...props
}) {
  // Create asphalt texture procedurally
  const asphaltTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    // Base asphalt color
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(0, 0, 512, 512)

    // Add noise/grain for realistic asphalt
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const gray = Math.floor(Math.random() * 40 + 30)
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`
      ctx.fillRect(x, y, 2, 2)
    }

    // Add some larger aggregate
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const gray = Math.floor(Math.random() * 30 + 50)
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`
      ctx.beginPath()
      ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(size / 5, size / 5)

    return texture
  }, [size])

  // Generate stripe positions for center line
  const centerStripes = useMemo(() => {
    const stripes = []
    const totalLength = size
    let currentZ = -totalLength / 2

    while (currentZ < totalLength / 2) {
      stripes.push(currentZ + stripeLength / 2)
      currentZ += stripeLength + stripeGap
    }

    return stripes
  }, [size, stripeLength, stripeGap])

  // Edge line positions (solid white lines on road edges)
  const edgeLineOffset = roadWidth / 2 - 0.5

  return (
    <group {...props}>
      {/* Main ground plane - asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          map={asphaltTexture}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Center dashed line */}
      {centerStripes.map((z, index) => (
        <mesh
          key={`center-${index}`}
          position={[0, 0.01, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[stripeWidth, stripeLength]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      ))}

      {/* Left edge line (solid) */}
      <mesh
        position={[-edgeLineOffset, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[stripeWidth, size]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>

      {/* Right edge line (solid) */}
      <mesh
        position={[edgeLineOffset, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[stripeWidth, size]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>

      {/* Optional: Crosswalk */}
      <Crosswalk position={[0, 0.01, 20]} roadWidth={roadWidth} />
    </group>
  )
}

// Crosswalk component for intersections
function Crosswalk({ position, roadWidth, stripeCount = 8 }) {
  const stripeWidth = 0.5
  const crosswalkWidth = 3
  const gap = roadWidth / stripeCount

  const stripes = useMemo(() => {
    const result = []
    for (let i = 0; i < stripeCount; i++) {
      result.push(-roadWidth / 2 + gap / 2 + i * gap)
    }
    return result
  }, [roadWidth, stripeCount, gap])

  return (
    <group position={position}>
      {stripes.map((x, index) => (
        <mesh
          key={index}
          position={[x, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[stripeWidth, crosswalkWidth]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// Parking lot lines component
export function ParkingSpot({ position, rotation = 0, width = 2.5, length = 5 }) {
  const lineWidth = 0.1

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Left line */}
      <mesh position={[-width / 2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lineWidth, length]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>

      {/* Right line */}
      <mesh position={[width / 2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lineWidth, length]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>

      {/* Back line */}
      <mesh position={[0, 0.01, length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, lineWidth]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
    </group>
  )
}
