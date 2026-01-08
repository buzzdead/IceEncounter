import { create } from 'zustand'

// Game phases
export const GAME_PHASES = {
  APPROACH_CAR: 'approach_car',       // Player walks to driver door
  CAR_REVERSING: 'car_reversing',     // Car turns wheels and reverses
  TRANSITION: 'transition',            // VFX transition between agents
  THIRD_AGENT: 'third_agent',         // Control switches to third agent
  CAR_CHARGE: 'car_charge',           // Car charges towards agent then veers right
}

// Agent IDs
export const AGENT_IDS = {
  NPC_STANDING: 'npc_standing',       // Standing NPC to the left
  PLAYER: 'player',                   // Initial player agent
  THIRD_AGENT: 'third_agent',         // Agent walking to front of car
}

export const useGameStore = create((set, get) => ({
  // Game phase
  gamePhase: GAME_PHASES.APPROACH_CAR,
  activeAgentId: AGENT_IDS.PLAYER,

  // Multiple agents state
  agents: {
    [AGENT_IDS.NPC_STANDING]: {
      position: [-6, 0, 2],
      rotation: [0, Math.PI / 4, 0],
      animation: 'idle',
      isGunDrawn: false,
    },
    [AGENT_IDS.PLAYER]: {
      position: [-5, 0, -3],
      rotation: [0, Math.PI / 2, 0],
      animation: 'idle',
      isGunDrawn: false,
    },
    [AGENT_IDS.THIRD_AGENT]: {
      position: [-1, 0, 9],
      rotation: [0, -Math.PI / 4, 0],
      animation: 'walk',
      isGunDrawn: false,
    },
  },

  // Bullets
  bullets: [],
  nextBulletId: 0,

  // Car state
  carPosition: [0, 0, 0],
  carRotation: [0, 0, 0],
  carSpeed: 0,
  wheelRotation: 0,
  steeringAngle: 0,  // Front wheel steering angle
  brokenGlassPanels: [],

  // Driver door trigger position (near front left wheel)
  driverDoorPosition: [-1.5, 0, 0],
  driverDoorRadius: 1.2,

  // Front of car trigger (for third agent phase)
  frontTriggerOffset: 4, // Distance in front of car center
  frontTriggerRadius: 1.5,

  // Transition state
  transitionProgress: 0,
  isTransitioning: false,

  // Actions
  setGamePhase: (phase) => set({ gamePhase: phase }),

  setActiveAgent: (agentId) => set({ activeAgentId: agentId }),

  // Agent actions
  setAgentPosition: (agentId, position) => {
    const { agents } = get()
    set({
      agents: {
        ...agents,
        [agentId]: { ...agents[agentId], position },
      },
    })
  },

  setAgentRotation: (agentId, rotation) => {
    const { agents } = get()
    set({
      agents: {
        ...agents,
        [agentId]: { ...agents[agentId], rotation },
      },
    })
  },

  setAgentAnimation: (agentId, animation) => {
    const { agents } = get()
    set({
      agents: {
        ...agents,
        [agentId]: { ...agents[agentId], animation },
      },
    })
  },

  drawGun: (agentId) => {
    const { agents } = get()
    set({
      agents: {
        ...agents,
        [agentId]: { ...agents[agentId], isGunDrawn: true, animation: 'drawGun' },
      },
    })
  },

  holsterGun: (agentId) => {
    const { agents } = get()
    set({
      agents: {
        ...agents,
        [agentId]: { ...agents[agentId], isGunDrawn: false, animation: 'idle' },
      },
    })
  },

  // Get active agent state
  getActiveAgent: () => {
    const { agents, activeAgentId } = get()
    return agents[activeAgentId]
  },

  // Check if player reached driver door
  checkDriverDoorTrigger: () => {
    const { agents, driverDoorPosition, driverDoorRadius, gamePhase } = get()
    if (gamePhase !== GAME_PHASES.APPROACH_CAR) return false

    const playerPos = agents[AGENT_IDS.PLAYER].position
    const dx = playerPos[0] - driverDoorPosition[0]
    const dz = playerPos[2] - driverDoorPosition[2]
    const distance = Math.sqrt(dx * dx + dz * dz)

    return distance < driverDoorRadius
  },

  // Trigger car reverse sequence
  triggerCarReverse: () => {
    set({ gamePhase: GAME_PHASES.CAR_REVERSING })
  },

  // Check if third agent reached front of car trigger
  checkFrontTrigger: () => {
    const { agents, carPosition, carRotation, frontTriggerOffset, frontTriggerRadius, gamePhase } = get()
    if (gamePhase !== GAME_PHASES.THIRD_AGENT) return false

    const thirdAgentPos = agents[AGENT_IDS.THIRD_AGENT].position

    // Calculate front trigger position based on car position and rotation
    // Car faces -Z when rotation is 0, so front is in -Z direction
    const carRot = carRotation[1]
    const frontX = carPosition[0] + Math.sin(carRot) * frontTriggerOffset
    const frontZ = carPosition[2] - Math.cos(carRot) * frontTriggerOffset

    const dx = thirdAgentPos[0] - frontX
    const dz = thirdAgentPos[2] - frontZ
    const distance = Math.sqrt(dx * dx + dz * dz)

    return distance < frontTriggerRadius
  },

  // Trigger car charge sequence
  triggerCarCharge: () => {
    set({ gamePhase: GAME_PHASES.CAR_CHARGE })
  },

  // Start transition effect
  startTransition: () => {
    set({
      gamePhase: GAME_PHASES.TRANSITION,
      isTransitioning: true,
      transitionProgress: 0,
    })
  },

  updateTransitionProgress: (progress) => {
    set({ transitionProgress: Math.min(1, progress) })
    if (progress >= 1) {
      set({
        isTransitioning: false,
        gamePhase: GAME_PHASES.THIRD_AGENT,
        activeAgentId: AGENT_IDS.THIRD_AGENT,
      })
    }
  },

  // Shooting
  shoot: (origin, direction) => {
    const { bullets, nextBulletId } = get()
    const newBullet = {
      id: nextBulletId,
      position: [...origin],
      direction: [...direction],
      speed: 50,
      createdAt: Date.now(),
    }
    set({
      bullets: [...bullets, newBullet],
      nextBulletId: nextBulletId + 1,
    })
  },

  removeBullet: (id) => {
    const { bullets } = get()
    set({ bullets: bullets.filter((b) => b.id !== id) })
  },

  // Car actions
  setCarPosition: (position) => set({ carPosition: position }),
  setCarRotation: (rotation) => set({ carRotation: rotation }),
  setCarSpeed: (speed) => set({ carSpeed: speed }),
  setSteeringAngle: (angle) => set({ steeringAngle: angle }),

  updateWheelRotation: (delta) => {
    const { wheelRotation, carSpeed } = get()
    set({ wheelRotation: wheelRotation + carSpeed * delta * 5 })
  },

  breakGlass: (panelId) => {
    const { brokenGlassPanels } = get()
    if (!brokenGlassPanels.includes(panelId)) {
      set({ brokenGlassPanels: [...brokenGlassPanels, panelId] })
    }
  },

  resetGlass: () => set({ brokenGlassPanels: [] }),

  // Reset game
  resetGame: () => {
    set({
      gamePhase: GAME_PHASES.APPROACH_CAR,
      activeAgentId: AGENT_IDS.PLAYER,
      agents: {
        [AGENT_IDS.NPC_STANDING]: {
          position: [-6, 0, 2],
          rotation: [0, Math.PI / 4, 0],
          animation: 'idle',
          isGunDrawn: false,
        },
        [AGENT_IDS.PLAYER]: {
          position: [-5, 0, -3],
          rotation: [0, Math.PI / 2, 0],
          animation: 'idle',
          isGunDrawn: false,
        },
        [AGENT_IDS.THIRD_AGENT]: {
          position: [-8, 0, 6],
          rotation: [0, -Math.PI / 4, 0],
          animation: 'walk',
          isGunDrawn: false,
        },
      },
      carPosition: [0, 0, 0],
      carRotation: [0, 0, 0],
      carSpeed: 0,
      steeringAngle: 0,
      transitionProgress: 0,
      isTransitioning: false,
      brokenGlassPanels: [],
    })
  },
}))
