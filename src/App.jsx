import { Canvas } from '@react-three/fiber'
import { GameScene } from './components/scene/GameScene'
import { useGameStore, GAME_PHASES } from './stores/gameStore'
import './App.css'

// Game UI Component
function GameUI() {
  const gamePhase = useGameStore((state) => state.gamePhase)
  const resetGame = useGameStore((state) => state.resetGame)

  const phaseMessages = {
    [GAME_PHASES.APPROACH_CAR]: 'Walk to the driver door (blue agent)',
    [GAME_PHASES.CAR_REVERSING]: 'Car is reversing...',
    [GAME_PHASES.TRANSITION]: 'Switching perspective...',
    [GAME_PHASES.THIRD_AGENT]: 'You now control the green agent',
  }

  return (
    <div className="ui-overlay">
      {/* Objective display */}
      <div className="objective-info">
        <div className="objective-label">Objective</div>
        <div className="objective-text">{phaseMessages[gamePhase]}</div>
      </div>

      {/* Controls info */}
      <div className="controls-info">
        <h3>Controls</h3>
        <p><strong>W/S</strong> - Move forward/backward</p>
        <p><strong>A/D</strong> - Rotate left/right</p>
        <p><strong>Q/E</strong> - Strafe left/right</p>
        <p><strong>Right-click (hold)</strong> - Aim</p>
        <p><strong>Left-click</strong> - Shoot (when aiming)</p>
        <button className="reset-button" onClick={resetGame}>
          Reset Game
        </button>
      </div>

      {/* Agent colors legend */}
      <div className="legend-info">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#6b7280' }}></span>
          <span>NPC (gray)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
          <span>You (blue)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
          <span>Third Agent (green)</span>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="game-container" onContextMenu={(e) => e.preventDefault()}> 
      <Canvas
        shadows
        camera={{
          position: [-10, 8, 15],
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

      <GameUI />
    </div>
  )
}

export default App
