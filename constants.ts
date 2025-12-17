export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;

export const LANE_WIDTH = 120;
export const ROAD_WIDTH = LANE_WIDTH * 3;
export const ROAD_X = (CANVAS_WIDTH - ROAD_WIDTH) / 2;

export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 90;
export const PLAYER_Y = CANVAS_HEIGHT - 150; // Fixed player position from top

// Physics - Adjusted for better control
export const MAX_SPEED = 15;
// Reduced acceleration significantly to make speed controllable
export const ACCELERATION = 0.05; 
export const BRAKING = 1.0; // Strong braking for emergency stops
export const FRICTION = 0.02;

// Visuals
export const TREE_WIDTH = 60;
export const TREE_HEIGHT = 60;

// Visual Colors
export const COLOR_GRASS = '#4ade80'; // Tailwind green-400
export const COLOR_ROAD = '#374151'; // Tailwind gray-700
export const COLOR_MARKING = '#e5e7eb'; // Tailwind gray-200
export const COLOR_PLAYER = '#ef4444'; // Tailwind red-500
export const COLOR_DASHBOARD = '#1f2937'; // Tailwind gray-800