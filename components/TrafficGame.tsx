import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Lane, TrafficObject, TrafficObjectType, PlayerState, GameMetrics } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_X, LANE_WIDTH, ROAD_WIDTH,
  PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT, MAX_SPEED, ACCELERATION,
  BRAKING, FRICTION, COLOR_GRASS, COLOR_ROAD, COLOR_MARKING
} from '../constants';
import GameUI from './GameUI';

const TrafficGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (for Loop)
  const gameStateRef = useRef<GameState>(GameState.START);
  const playerRef = useRef<PlayerState>({
    lane: Lane.CENTER,
    speed: 0,
    maxSpeed: MAX_SPEED,
    x: ROAD_X + LANE_WIDTH * 1 + (LANE_WIDTH - PLAYER_WIDTH) / 2,
    y: PLAYER_Y
  });
  const inputRef = useRef({ left: false, right: false, up: false, down: false });
  const objectsRef = useRef<TrafficObject[]>([]);
  const metricsRef = useRef<GameMetrics>({
    score: 0,
    distance: 0,
    message: '',
    messageType: 'neutral',
    combo: 0
  });
  const spawnTimerRef = useRef(0);
  const messageTimerRef = useRef(0);
  
  // React State for UI Re-renders
  const [uiState, setUiState] = useState<{
    gameState: GameState;
    metrics: GameMetrics;
    speed: number;
  }>({
    gameState: GameState.START,
    metrics: metricsRef.current,
    speed: 0
  });

  const setMessage = (msg: string, type: 'good' | 'bad' | 'neutral') => {
    metricsRef.current.message = msg;
    metricsRef.current.messageType = type;
    messageTimerRef.current = 120; // Show for 2 seconds (60fps * 2)
  };

  const startGame = () => {
    gameStateRef.current = GameState.PLAYING;
    metricsRef.current = { score: 0, distance: 0, message: 'Drive Safely!', messageType: 'neutral', combo: 0 };
    playerRef.current.speed = 0;
    playerRef.current.lane = Lane.CENTER;
    playerRef.current.x = ROAD_X + LANE_WIDTH * 1 + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    objectsRef.current = [];
    spawnTimerRef.current = 0;
    
    // Initial spawn
    spawnObject(TrafficObjectType.TRAFFIC_LIGHT, -600);
  };

  const spawnObject = (type: TrafficObjectType, offset: number = -CANVAS_HEIGHT) => {
    const id = Math.random().toString(36).substr(2, 9);
    let newObj: TrafficObject = {
      id,
      type,
      y: offset,
      processed: false
    };

    if (type === TrafficObjectType.TRAFFIC_LIGHT) {
      newObj.state = 'RED';
      newObj.timer = 300; // 5 seconds red
    } else if (type === TrafficObjectType.STOP_SIGN) {
      newObj.hasStopped = false;
    } else if (type === TrafficObjectType.SPEED_LIMIT) {
      newObj.limit = Math.random() > 0.5 ? 8 : 12; // Maps to ~80kmh or ~120kmh roughly on speedometer
    } else if (type === TrafficObjectType.SPEED_BUMP) {
      newObj.limit = 5; // Slow down to ~50kmh or less
    } else if (type === TrafficObjectType.OBSTACLE_CAR) {
      newObj.lane = Math.floor(Math.random() * 3);
      newObj.speed = 5 + Math.random() * 3; // Moves slower than max speed
      newObj.color = Math.random() > 0.5 ? '#3b82f6' : '#22c55e'; // Blue or Green cars
    }

    objectsRef.current.push(newObj);
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== GameState.PLAYING) return;
      
      switch(e.key) {
        case 'ArrowLeft': 
          if (!inputRef.current.left && playerRef.current.lane > Lane.LEFT) {
            playerRef.current.lane--;
          }
          inputRef.current.left = true;
          break;
        case 'ArrowRight':
          if (!inputRef.current.right && playerRef.current.lane < Lane.RIGHT) {
            playerRef.current.lane++;
          }
          inputRef.current.right = true;
          break;
        case 'ArrowUp': inputRef.current.up = true; break;
        case 'ArrowDown': inputRef.current.down = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowLeft': inputRef.current.left = false; break;
        case 'ArrowRight': inputRef.current.right = false; break;
        case 'ArrowUp': inputRef.current.up = false; break;
        case 'ArrowDown': inputRef.current.down = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const player = playerRef.current;
      const metrics = metricsRef.current;

      // 1. Physics & Movement
      if (gameStateRef.current === GameState.PLAYING) {
        if (inputRef.current.up) {
          player.speed = Math.min(player.speed + ACCELERATION, player.maxSpeed);
        } else if (inputRef.current.down) {
          player.speed = Math.max(player.speed - BRAKING, 0);
        } else {
          // Friction
          if (player.speed > 0) player.speed = Math.max(player.speed - FRICTION, 0);
        }

        // Smooth Lane Transition
        const targetX = ROAD_X + (player.lane * LANE_WIDTH) + (LANE_WIDTH - PLAYER_WIDTH) / 2;
        player.x += (targetX - player.x) * 0.15;

        // Move World (Objects)
        metrics.distance += (player.speed / 100);
        // Score for safe driving (if moving)
        if (player.speed > 2) metrics.score += 0.05;

        // Message Timer
        if (messageTimerRef.current > 0) {
          messageTimerRef.current--;
          if (messageTimerRef.current === 0) metrics.message = '';
        }

        // Object Spawning Logic
        spawnTimerRef.current++;
        if (spawnTimerRef.current > 400) { // Frequency
           const lastObj = objectsRef.current[objectsRef.current.length - 1];
           // Ensure spacing
           if (!lastObj || lastObj.y > 100) {
             const rand = Math.random();
             if (rand < 0.2) spawnObject(TrafficObjectType.TRAFFIC_LIGHT, -200);
             else if (rand < 0.4) spawnObject(TrafficObjectType.STOP_SIGN, -200);
             else if (rand < 0.6) spawnObject(TrafficObjectType.SPEED_LIMIT, -200);
             else if (rand < 0.8) spawnObject(TrafficObjectType.SPEED_BUMP, -200);
             else spawnObject(TrafficObjectType.OBSTACLE_CAR, -300);
             spawnTimerRef.current = 0;
           }
        }

        // Update Objects
        objectsRef.current.forEach(obj => {
          // Move object down relative to player speed
          // If it's a car, it also moves forward (so it comes towards player slower)
          let relativeSpeed = player.speed;
          
          if (obj.type === TrafficObjectType.OBSTACLE_CAR && obj.speed) {
             relativeSpeed = player.speed - obj.speed; 
          }
          
          obj.y += relativeSpeed;

          // Traffic Light Logic
          if (obj.type === TrafficObjectType.TRAFFIC_LIGHT) {
            if (obj.timer && obj.timer > 0) {
              obj.timer--;
              if (obj.timer === 0) {
                 if (obj.state === 'RED') obj.state = 'GREEN';
                 else if (obj.state === 'GREEN') {
                    obj.state = 'YELLOW';
                    obj.timer = 120;
                 } else if (obj.state === 'YELLOW') {
                    obj.state = 'RED';
                    obj.timer = 300;
                 }
              }
            }
          }

          // --- RULE & COLLISION CHECKS ---
          
          const playerNoseY = player.y;
          const playerRearY = player.y + PLAYER_HEIGHT;
          
          // 1. Red Light Check
          if (obj.type === TrafficObjectType.TRAFFIC_LIGHT && !obj.processed) {
             const stopLineY = obj.y + 100;
             if (stopLineY > playerNoseY - 200 && stopLineY < playerNoseY && obj.state === 'RED') {
                if (metrics.message !== 'STOP!') setMessage('STOP!', 'neutral');
             }

             if (playerRearY < stopLineY && playerNoseY + 10 > stopLineY) {
               if (obj.state === 'RED') {
                 metrics.score -= 50;
                 setMessage('RAN RED LIGHT! -50', 'bad');
                 obj.processed = true;
               } else if (obj.state === 'GREEN') {
                 metrics.score += 20;
                 setMessage('Good Crossing! +20', 'good');
                 obj.processed = true;
               }
             }

             if (stopLineY > playerNoseY && stopLineY < playerNoseY + 150 && player.speed === 0 && obj.state === 'RED') {
                if (metrics.message !== 'WAITING...') {
                  setMessage('WAITING...', 'good');
                  metrics.score += 0.5; 
                }
             }
          }

          // 2. Stop Sign Check
          if (obj.type === TrafficObjectType.STOP_SIGN && !obj.processed) {
            const signLineY = obj.y + 50;
            if (playerNoseY > signLineY - 150 && playerNoseY < signLineY) {
               if (metrics.message !== 'STOP AHEAD') setMessage('STOP AHEAD', 'neutral');
               if (player.speed < 1) {
                 obj.hasStopped = true;
                 setMessage('Perfect Stop!', 'good');
               }
            }
            if (playerRearY < signLineY) {
               if (!obj.hasStopped) {
                 metrics.score -= 30;
                 setMessage('IGNORED STOP SIGN! -30', 'bad');
               } else {
                 metrics.score += 50;
                 setMessage('Obeyed Stop Sign +50', 'good');
               }
               obj.processed = true;
            }
          }

          // 3. Speed Limit Check
          if (obj.type === TrafficObjectType.SPEED_LIMIT && !obj.processed) {
             const signY = obj.y + 50;
             // When passing the sign
             if (playerRearY < signY && playerNoseY + 20 > signY) {
                if (obj.limit && player.speed > obj.limit) {
                  metrics.score -= 20;
                  setMessage(`SPEEDING! Limit ${obj.limit * 10} -20`, 'bad');
                } else {
                  metrics.score += 10;
                  setMessage('Safe Speed +10', 'good');
                }
                obj.processed = true;
             }
          }

          // 4. Speed Bump Check
          if (obj.type === TrafficObjectType.SPEED_BUMP && !obj.processed) {
            const bumpY = obj.y + 20; // Middle of bump roughly
            // Check if player is passing over it
            if (playerRearY < bumpY && playerNoseY + 20 > bumpY) {
               if (obj.limit && player.speed > obj.limit) {
                 metrics.score -= 20;
                 setMessage('BUMP TOO FAST! -20', 'bad');
               } else {
                 metrics.score += 15;
                 setMessage('Nice & Slow +15', 'good');
               }
               obj.processed = true;
            }
          }

          // 5. Car Collision Check
          if (obj.type === TrafficObjectType.OBSTACLE_CAR) {
             const carX = ROAD_X + ((obj.lane || 0) * LANE_WIDTH) + (LANE_WIDTH - PLAYER_WIDTH) / 2;
             const carY = obj.y;
             
             // Simple AABB collision
             if (
                player.x < carX + PLAYER_WIDTH &&
                player.x + PLAYER_WIDTH > carX &&
                player.y < carY + PLAYER_HEIGHT &&
                player.y + PLAYER_HEIGHT > carY
             ) {
                metrics.score -= 50;
                gameStateRef.current = GameState.GAME_OVER;
                setMessage('CRASHED!', 'bad');
             }
          }

        });

        // Cleanup off-screen objects
        objectsRef.current = objectsRef.current.filter(obj => obj.y < CANVAS_HEIGHT + 200);

        // Game Over Condition
        if (metrics.score < -100) {
          gameStateRef.current = GameState.GAME_OVER;
        }
      }

      // --- RENDERING ---

      // Clear
      ctx.fillStyle = COLOR_GRASS;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Road
      ctx.fillStyle = COLOR_ROAD;
      ctx.fillRect(ROAD_X, 0, ROAD_WIDTH, CANVAS_HEIGHT);

      // Lane Markers
      ctx.strokeStyle = COLOR_MARKING;
      ctx.lineWidth = 4;
      ctx.setLineDash([40, 40]);
      
      const dashOffset = (Date.now() / 2) * (player.speed / 10) % 80;
      ctx.lineDashOffset = -dashOffset;

      ctx.beginPath();
      ctx.moveTo(ROAD_X + LANE_WIDTH, -80);
      ctx.lineTo(ROAD_X + LANE_WIDTH, CANVAS_HEIGHT);
      ctx.moveTo(ROAD_X + LANE_WIDTH * 2, -80);
      ctx.lineTo(ROAD_X + LANE_WIDTH * 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]); 

      // Road Borders
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(ROAD_X, 0);
      ctx.lineTo(ROAD_X, CANVAS_HEIGHT);
      ctx.moveTo(ROAD_X + ROAD_WIDTH, 0);
      ctx.lineTo(ROAD_X + ROAD_WIDTH, CANVAS_HEIGHT);
      ctx.stroke();

      // --- Draw Floor Objects (Signs, Lines, Bumps) ---
      objectsRef.current.forEach(obj => {
         
         // STOP SIGN LINE
         if (obj.type === TrafficObjectType.STOP_SIGN) {
            const lineY = obj.y + 50;
            ctx.fillStyle = '#fff';
            ctx.fillRect(ROAD_X, lineY, ROAD_WIDTH, 10);
            
            ctx.save();
            ctx.translate(ROAD_X + ROAD_WIDTH + 40, lineY);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            const size = 30;
            for (let i = 0; i < 6; i++) {
              ctx.lineTo(size * Math.cos(i * Math.PI / 3), size * Math.sin(i * Math.PI / 3));
            }
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('STOP', 0, 0);
            ctx.restore();
         }

         // SPEED BUMP
         if (obj.type === TrafficObjectType.SPEED_BUMP) {
            const bumpY = obj.y;
            // Draw striped bump
            const bumpHeight = 30;
            const stripeWidth = 40;
            const numStripes = Math.ceil(ROAD_WIDTH / stripeWidth);
            
            ctx.save();
            // Clip to road
            ctx.beginPath();
            ctx.rect(ROAD_X, bumpY, ROAD_WIDTH, bumpHeight);
            ctx.clip();

            ctx.fillStyle = '#f59e0b'; // Yellow base
            ctx.fillRect(ROAD_X, bumpY, ROAD_WIDTH, bumpHeight);
            
            ctx.fillStyle = '#1f2937'; // Dark stripes
            for (let i = 0; i < numStripes; i++) {
                if (i % 2 === 0) {
                    ctx.fillRect(ROAD_X + (i * stripeWidth), bumpY, stripeWidth, bumpHeight);
                }
            }
            
            // Bevel effect
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ROAD_X, bumpY);
            ctx.lineTo(ROAD_X + ROAD_WIDTH, bumpY);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(ROAD_X, bumpY + bumpHeight);
            ctx.lineTo(ROAD_X + ROAD_WIDTH, bumpY + bumpHeight);
            ctx.stroke();

            ctx.restore();
         }

         // SPEED LIMIT SIGN
         if (obj.type === TrafficObjectType.SPEED_LIMIT) {
           const signY = obj.y + 50;
           ctx.save();
           // Draw on right side of road
           ctx.translate(ROAD_X + ROAD_WIDTH + 40, signY);
           
           // Pole
           ctx.fillStyle = '#64748b';
           ctx.fillRect(-5, 0, 10, 60);

           // Circle
           ctx.beginPath();
           ctx.arc(0, 0, 30, 0, Math.PI * 2);
           ctx.fillStyle = 'white';
           ctx.fill();
           ctx.strokeStyle = '#ef4444'; // Red border
           ctx.lineWidth = 5;
           ctx.stroke();

           // Text
           ctx.fillStyle = 'black';
           ctx.font = 'bold 20px Arial';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           ctx.fillText(`${(obj.limit || 8) * 10}`, 0, 0);
           
           ctx.restore();
         }
      });

      // --- Draw Cars (Obstacles) ---
      objectsRef.current.forEach(obj => {
        if (obj.type === TrafficObjectType.OBSTACLE_CAR) {
           const carX = ROAD_X + ((obj.lane || 0) * LANE_WIDTH) + (LANE_WIDTH - PLAYER_WIDTH) / 2;
           const carY = obj.y;
           const carColor = obj.color || '#3b82f6';

           ctx.shadowColor = 'rgba(0,0,0,0.5)';
           ctx.shadowBlur = 10;
           
           // Simple Car Shape for AI
           ctx.fillStyle = '#111'; // Tires
           ctx.fillRect(carX - 4, carY + 10, 8, 15);
           ctx.fillRect(carX + PLAYER_WIDTH - 4, carY + 10, 8, 15);
           ctx.fillRect(carX - 4, carY + PLAYER_HEIGHT - 25, 8, 15);
           ctx.fillRect(carX + PLAYER_WIDTH - 4, carY + PLAYER_HEIGHT - 25, 8, 15);

           ctx.fillStyle = carColor; // Body
           ctx.fillRect(carX, carY, PLAYER_WIDTH, PLAYER_HEIGHT);
           
           // Roof
           ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
           ctx.fillRect(carX + 4, carY + 20, PLAYER_WIDTH - 8, PLAYER_HEIGHT - 30);
           
           // Headlights
           ctx.fillStyle = '#fef08a';
           ctx.fillRect(carX + 2, carY + PLAYER_HEIGHT - 5, 10, 5); // Rear lights (facing player)
           ctx.fillRect(carX + PLAYER_WIDTH - 12, carY + PLAYER_HEIGHT - 5, 10, 5);
           
           ctx.shadowBlur = 0;
        }
      });


      // --- Draw Player ---
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ef4444'; // Red Car Body
      const px = player.x;
      const py = player.y;
      
      // Tires
      ctx.fillStyle = '#111';
      ctx.fillRect(px - 4, py + 10, 8, 15);
      ctx.fillRect(px + PLAYER_WIDTH - 4, py + 10, 8, 15);
      ctx.fillRect(px - 4, py + PLAYER_HEIGHT - 25, 8, 15);
      ctx.fillRect(px + PLAYER_WIDTH - 4, py + PLAYER_HEIGHT - 25, 8, 15);

      // Body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px, py, PLAYER_WIDTH, PLAYER_HEIGHT);
      
      // Roof/Windshield
      ctx.fillStyle = '#7f1d1d'; // Darker red
      ctx.fillRect(px + 4, py + 20, PLAYER_WIDTH - 8, PLAYER_HEIGHT - 30);
      ctx.fillStyle = '#93c5fd'; // Glass
      ctx.fillRect(px + 6, py + 25, PLAYER_WIDTH - 12, 15); // Front glass
      ctx.fillRect(px + 6, py + 55, PLAYER_WIDTH - 12, 10); // Back glass

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 15;
      ctx.fillRect(px + 2, py, 10, 5);
      ctx.fillRect(px + PLAYER_WIDTH - 12, py, 10, 5);
      ctx.shadowBlur = 0;

      // Brake Lights
      if (inputRef.current.down) {
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillRect(px + 2, py + PLAYER_HEIGHT - 5, 10, 5);
        ctx.fillRect(px + PLAYER_WIDTH - 12, py + PLAYER_HEIGHT - 5, 10, 5);
        ctx.shadowBlur = 0;
      }

      // --- Draw Overhead Objects (Lights) ---
      objectsRef.current.forEach(obj => {
        if (obj.type === TrafficObjectType.TRAFFIC_LIGHT) {
          const lineY = obj.y + 100;
          
          ctx.fillStyle = '#fff';
          ctx.fillRect(ROAD_X, lineY, ROAD_WIDTH, 10);

          const boxW = 120;
          const boxH = 40;
          const boxX = (CANVAS_WIDTH - boxW) / 2;
          const boxY = lineY - 150; 

          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(CANVAS_WIDTH, lineY);
          ctx.lineTo(CANVAS_WIDTH - 50, lineY);
          ctx.lineTo(CANVAS_WIDTH - 50, boxY + 20);
          ctx.lineTo(boxX + boxW, boxY + 20);
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(boxX, boxY, boxW, boxH);
          
          const drawLight = (color: string, active: boolean, xOffset: number) => {
             ctx.fillStyle = active ? color : '#334155';
             ctx.beginPath();
             ctx.arc(boxX + xOffset, boxY + boxH/2, 12, 0, Math.PI * 2);
             ctx.fill();
             if (active) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(boxX + xOffset, boxY + boxH/2, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
             }
          };

          drawLight('#ef4444', obj.state === 'RED', 30);
          drawLight('#eab308', obj.state === 'YELLOW', 60);
          drawLight('#22c55e', obj.state === 'GREEN', 90);
        }
      });

      setUiState({
        gameState: gameStateRef.current,
        metrics: { ...metricsRef.current },
        speed: playerRef.current.speed
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-full h-screen flex justify-center bg-gray-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="h-full w-auto max-w-full shadow-2xl"
      />
      <GameUI 
        gameState={uiState.gameState} 
        metrics={uiState.metrics}
        speed={uiState.speed}
        onStart={startGame}
        onRestart={startGame}
      />
    </div>
  );
};

export default TrafficGame;