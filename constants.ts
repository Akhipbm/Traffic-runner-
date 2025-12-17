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

// Assets
export const TROLL_FACE_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAqFBMVEUAAAD///8AAAAAAAAAAAAAAAAAAAAAAAD+/v4AAAAAAAD////8/PwAAAAAAAAAAAD///8AAAAAAAD+/v7////8/Pz///8AAAD+/v78/Pz///////8AAAAAAAAAAAD///8AAAD8/PwAAAD///8AAAAAAAD8/Pz///////8AAAD///8AAAD///////8AAAAAAAD///////////8AAAAAAAD///8AAAD///+n672CAAAAMHRSTlMA/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8ArfXCkwAAAphJREFUSMe1lsdy2zAQhu8CBEiQAwmQAAmw995777333v//CwdQspXYSZzOG0+O40+73+4ukJSVlZ/tT6e11lq/V/5W9G5J75b0bkn/n6T0X1q/W9K7Jb1b0rsly1+3fi8pM8vL98rfil5S/6X1u0l5Pz2f9E767aT3k/J+0n9p/W5S3k/6L63fTcr7Se+k3056PykhI41+t6R3S3q3pHdLerekt0t6t6R3S3q35N+Q/H5S3k96J/120vtJeT/pv7R+NynvJ72Tfjvp/aS8n/RfWr+blPeT3km/nfR+Ut5P+i+t303K+0nvpN9Oej8p7yf9l9bvJuX9pHfSbye9n5T3k/5L63eT8n7SO+m3k95PyvtJ/6X1u0l5P+md9NtJ7yfl/aT/0vrdpLyf9E767aT3k/J+0n9p/W5S3k96J/120vtJeT/pv7R+NynvJ72Tfjvp/aS8n/RfWr+blPeT3km/nfR+Ut5P+i+t303K+0nvpN9Oej8p7yf9l9bvJuX9pHfSbye9n5T3k/5L63eT8n7SO+m3k95PyvtJ/6X1u0l5P+md9NtJ7yfl/aT/0vrdpLyf9E767aT3k/J+0n9p/W5S3k96J/120vtJeT/pv7R+NynvJ72Tfjvp/aS8n/RfWr+blPeT3km/nfR+Ut5P+i+t303K+0nvpN9Oej8p7yf9l9bvJuX9pHfSbye9n5T3k/5L63eT8n7SO+m3k95PyvtJ/6X1u0l5P+md9NtJ7yfl/aT/0vrdpLyf9E767aT3k/J+0n9p/W5S3k96J/120vtJeT/pv7R+NynvJ72Tfjvp/aS8n/RfWr+blPeT3km/nfR+Ut5P+i+t303K+0nvpN9Oej8p7yf9l9bvJuX9pHfSbye9n5T3k/5L63eT8n7SO+m3k95PyvtJ/6X1u0l5P+md9NtJ7yfl/aT/0vq9pPyfWk8q/wD2H52H6K5x8gAAAABJRU5ErkJggg==";
