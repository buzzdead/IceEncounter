import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  // Agent state
  agentPosition: [0, 0, 0],
  agentRotation: [0, 0, 0],
  agentAnimation: 'idle', // 'idle' | 'walk' | 'drawGun' | 'shoot'
  isGunDrawn: false,

  // Bullets
  bullets: [],
  nextBulletId: 0,

  // Car state
  carPosition: [5, 0, 0],
  carRotation: [0, 0, 0],
  carSpeed: 0,
  wheelRotation: 0,
  brokenGlassPanels: [], // Array of broken glass panel ids

  // Actions
  setAgentPosition: (position) => set({ agentPosition: position }),
  setAgentRotation: (rotation) => set({ agentRotation: rotation }),

  setAgentAnimation: (animation) => set({ agentAnimation: animation }),

  drawGun: () => set({ isGunDrawn: true, agentAnimation: 'drawGun' }),
  holsterGun: () => set({ isGunDrawn: false, agentAnimation: 'idle' }),

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
      agentAnimation: 'shoot',
    })
  },

  removeBullet: (id) => {
    const { bullets } = get()
    set({ bullets: bullets.filter(b => b.id !== id) })
  },

  // Car actions
  setCarPosition: (position) => set({ carPosition: position }),
  setCarRotation: (rotation) => set({ carRotation: rotation }),
  setCarSpeed: (speed) => set({ carSpeed: speed }),
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
}))
