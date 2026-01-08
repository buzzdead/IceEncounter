import { Canvas } from '@react-three/fiber'
import { GameScene } from './components/scene/GameScene'
import './App.css'

function App() {
  return (
    <div className="game-container">
      <Canvas
        shadows
        camera={{
          position: [0, 10, 20],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <GameScene />
      </Canvas>

      {/* UI Overlay */}
      <div className="ui-overlay">
        <div className="controls-info">
          <h3>Controls</h3>
          <p><strong>W/S</strong> - Move forward/backward</p>
          <p><strong>A/D</strong> - Rotate left/right</p>
          <p><strong>Q/E</strong> - Strafe left/right</p>
          <p><strong>G</strong> - Draw/holster gun</p>
          <p><strong>Space</strong> - Shoot (when gun drawn)</p>
        </div>
      </div>
    </div>
  )
}

export default App
