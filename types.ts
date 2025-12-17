export enum GameState {
  LOGIN = 'LOGIN',
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum Lane {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

export enum TrafficObjectType {
  TRAFFIC_LIGHT = 'TRAFFIC_LIGHT',
  STOP_SIGN = 'STOP_SIGN',
  SPEED_LIMIT = 'SPEED_LIMIT',
  OBSTACLE_CAR = 'OBSTACLE_CAR',
  SPEED_BUMP = 'SPEED_BUMP',
  TREE = 'TREE',
  ZEBRA_CROSSING = 'ZEBRA_CROSSING',
}

export interface User {
  email: string;
  highScore: number;
  lastPlayed: number; // Timestamp
}

export interface Pedestrian {
  id: string;
  x: number;
  speed: number;
  direction: 1 | -1; // 1 = right, -1 = left
  walkingPhase: number; // For simple animation
}

export interface TrafficObject {
  id: string;
  type: TrafficObjectType;
  y: number; // Distance from player (starts positive, moves to 0 then negative)
  x?: number; // Specific X position for trees/decorations
  lane?: Lane; // If null, applies to all lanes
  state?: 'RED' | 'YELLOW' | 'GREEN';
  nextState?: 'RED' | 'GREEN'; // To track cycle direction (Red->Yellow->Green vs Green->Yellow->Red)
  timer?: number; // For light cycling
  hasPassed?: boolean;
  hasStopped?: boolean; // For stop signs
  processed?: boolean; // To prevent double scoring
  
  // New properties
  limit?: number; // For speed limit signs and bumps
  speed?: number; // For obstacle cars
  color?: string; // For obstacle cars
  pedestrians?: Pedestrian[]; // For Zebra Crossing
  stopTimer?: number; // For stop sign countdown (frames)
}

export interface PlayerState {
  lane: Lane;
  speed: number;
  maxSpeed: number;
  x: number; // For smooth lane transitions
  y: number; // Fixed visual position usually
}

export interface GameMetrics {
  score: number;
  distance: number;
  message: string;
  messageType: 'neutral' | 'good' | 'bad';
  combo: number;
}