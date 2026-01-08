import { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Gun({ modelPath = '/models/gun.glb', ...props }) {
  const { scene } = useGLTF(modelPath)
  const clonedScene = useMemo(() => scene.clone(), [scene])

  return (
    <group {...props}>
      <primitive 
        object={clonedScene} 
        // Adjust these until the gun fits perfectly in the hand
        scale={15} 
        rotation={[0, 0,  -Math.PI / 2]} 
        position={[0, 20.5, 0]} 
      />
    </group>
  )
}
// Preload the model
useGLTF.preload('/models/gun.glb')
