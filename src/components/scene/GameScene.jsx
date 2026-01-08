import { Suspense, useState, useEffect } from 'react'
import { OrbitControls, Sky, Environment } from '@react-three/drei'
import { useGLTF } from '@react-three/drei'
import { Agent } from '../models/Agent'
import { Car } from '../models/Car'
import { Bullets } from '../models/Bullet'
import { PlaceholderAgent } from '../models/PlaceholderAgent'
import { PlaceholderCar } from '../models/PlaceholderCar'
import { PlaceholderBullets } from '../models/PlaceholderBullet'
import { Ground } from '../environment/Ground'
import { useAgentControls, useCarControls } from '../../hooks/useControls'

// Controls component to use hooks inside Canvas
function Controls() {
  useAgentControls()
  // Uncomment to enable car controls with arrow keys
  // useCarControls()
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

// Conditional model loader
function ModelLoader({ modelPath, ModelComponent, PlaceholderComponent, ...props }) {
  const { exists, checked } = useModelExists(modelPath)

  if (!checked) {
    return <Loader />
  }

  if (exists) {
    return (
      <Suspense fallback={<Loader />}>
        <ModelComponent modelPath={modelPath} {...props} />
      </Suspense>
    )
  }

  return <PlaceholderComponent {...props} />
}

export function GameScene() {
  return (
    <>
      {/* Controls */}
      <Controls />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={50}
      />

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

      {/* Fill light */}
      <directionalLight
        position={[-10, 10, -10]}
        intensity={0.3}
      />

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

      {/* Agent - uses placeholder if model doesn't exist */}
      <ModelLoader
        modelPath="/models/agent.glb"
        ModelComponent={Agent}
        PlaceholderComponent={PlaceholderAgent}
      />

      {/* Car - uses placeholder if model doesn't exist */}
      <ModelLoader
        modelPath="/models/car.glb"
        ModelComponent={Car}
        PlaceholderComponent={PlaceholderCar}
      />

      {/* Bullets - uses placeholder bullets */}
      <PlaceholderBullets />
    </>
  )
}
