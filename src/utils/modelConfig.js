/**
 * Model Configuration
 *
 * Update these paths to match your actual model files.
 * Place your .glb files in the public/models/ directory.
 */

export const MODEL_PATHS = {
  agent: '/models/agent.glb',
  car: '/models/car.glb',
  bullet: '/models/bullet.glb',
}

/**
 * Animation name mappings for the Agent model
 * Update these to match the actual animation names in your Blender export
 */
export const AGENT_ANIMATIONS = {
  idle: 'Idle',       // Standing still animation
  walk: 'Walk',       // Walking/running animation
  drawGun: 'DrawGun', // Drawing weapon animation
  shoot: 'Shoot',     // Firing animation
}

/**
 * Car component names for wheels and glass
 * Update these to match your Blender model's object names
 */
export const CAR_COMPONENTS = {
  wheels: {
    frontLeft: 'FrontWheelL',
    frontRight: 'FrontWheelR',
    rearLeft: 'RearWheelL',
    rearRight: 'RearWheelR',
  },
  glass: {
    windshield: 'Glass_Windshield',
    rear: 'Glass_Rear',
    leftFront: 'Glass_Left_Front',
    leftRear: 'Glass_Left_Rear',
    rightFront: 'Glass_Right_Front',
    rightRear: 'Glass_Right_Rear',
  },
}
