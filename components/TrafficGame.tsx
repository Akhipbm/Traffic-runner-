// ... (imports)
import React, { useRef, useEffect, useState } from 'react';
import { GameState, Lane, TrafficObject, TrafficObjectType, PlayerState, GameMetrics, Pedestrian, User } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_X, LANE_WIDTH, ROAD_WIDTH,
  PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT, MAX_SPEED, ACCELERATION,
  BRAKING, FRICTION, COLOR_GRASS, COLOR_ROAD, COLOR_MARKING,
  TREE_WIDTH, TREE_HEIGHT, TROLL_FACE_URI
} from '../constants';
import { getStoredUsers, saveUser, updateUserScore, deleteUser } from '../utils/storage';
import GameUI from './GameUI';

const TrafficGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceImageRef = useRef<HTMLImageElement | null>(null);
  
  // Game State Refs
  const gameStateRef = useRef<GameState>(GameState.LOGIN);
  const playerRef = useRef<PlayerState>({
    lane: Lane.CENTER,
    speed: 0,
    maxSpeed: MAX_SPEED,
    x: ROAD_X + LANE_WIDTH * 1 + (LANE_WIDTH - PLAYER_WIDTH) / 2,
    y: PLAYER_Y
  });
  
  const currentZoneLimitRef = useRef<number>(MAX_SPEED); 
  const overspeedTimerRef = useRef<number>(0); 

  const inputRef = useRef({ left: false, right: false, up: false, down: false });
  const objectsRef = useRef<TrafficObject[]>([]);
  const metricsRef = useRef<GameMetrics>({
    score: 0,
    distance: 0,
    message: '',
    messageType: 'neutral',
    combo: 0,
    infractions: {
      redLights: 0,
      stopSigns: 0,
      speeding: 0,
      bumps: 0,
      pedestrians: 0,
      crashes: 0
    }
  });
  
  const spawnTimerRef = useRef(0);
  const treeSpawnTimerRef = useRef(0);
  const messageTimerRef = useRef(0);
  
  // React State for UI Re-renders
  const [uiState, setUiState] = useState<{
    gameState: GameState;
    metrics: GameMetrics;
    speed: number;
    currentUser: User | null;
    allUsers: User[];
  }>({
    gameState: GameState.LOGIN,
    metrics: metricsRef.current,
    speed: 0,
    currentUser: null,
    allUsers: []
  });

  const setMessage = (msg: string, type: 'good' | 'bad' | 'neutral') => {
    metricsRef.current.message = msg;
    metricsRef.current.messageType = type;
    messageTimerRef.current = 120; 
  };

  // Preload Image & Users
  useEffect(() => {
    const img = new Image();
    img.src = TROLL_FACE_URI;
    img.onload = () => {
      faceImageRef.current = img;
    };
    
    // Load users from storage
    const users = getStoredUsers();
    setUiState(prev => ({ ...prev, allUsers: users }));
  }, []);

  // --- User Management Functions ---
  const handleLogin = (username: string) => {
    const user = saveUser(username);
    const users = getStoredUsers();
    gameStateRef.current = GameState.START;
    setUiState(prev => ({ 
      ...prev, 
      currentUser: user, 
      allUsers: users,
      gameState: GameState.START 
    }));
  };

  const handleDeleteUser = (username: string) => {
    const updatedUsers = deleteUser(username);
    setUiState(prev => ({ 
      ...prev, 
      allUsers: updatedUsers,
      // If we deleted the current user, logout
      currentUser: prev.currentUser?.username === username ? null : prev.currentUser,
      gameState: prev.currentUser?.username === username ? GameState.LOGIN : prev.gameState
    }));
    if (uiState.currentUser?.username === username) {
      gameStateRef.current = GameState.LOGIN;
    }
  };

  const handleLogout = () => {
    gameStateRef.current = GameState.LOGIN;
    setUiState(prev => ({ ...prev, currentUser: null, gameState: GameState.LOGIN }));
  };

  const startGame = () => {
    gameStateRef.current = GameState.PLAYING;
    metricsRef.current = { 
      score: 0, 
      distance: 0, 
      message: 'Drive Safely! Reach 2000m', 
      messageType: 'neutral', 
      combo: 0,
      infractions: {
        redLights: 0,
        stopSigns: 0,
        speeding: 0,
        bumps: 0,
        pedestrians: 0,
        crashes: 0
      }
    };
    playerRef.current.speed = 0;
    playerRef.current.lane = Lane.CENTER;
    playerRef.current.x = ROAD_X + LANE_WIDTH * 1 + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    objectsRef.current = [];
    spawnTimerRef.current = 0;
    currentZoneLimitRef.current = MAX_SPEED;
    
    // Initial spawn
    spawnObject(TrafficObjectType.TRAFFIC_LIGHT, -600);
  };

  const spawnTree = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const side = Math.random() > 0.5 ? 'left' : 'right';
    let xPos = 0;

    if (side === 'left') {
      xPos = Math.random() * (ROAD_X - TREE_WIDTH);
    } else {
      xPos = (ROAD_X + ROAD_WIDTH) + Math.random() * (CANVAS_WIDTH - (ROAD_X + ROAD_WIDTH) - TREE_WIDTH);
    }

    const newObj: TrafficObject = {
      id,
      type: TrafficObjectType.TREE,
      y: -200, 
      x: xPos,
      processed: false
    };
    objectsRef.current.push(newObj);
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
      newObj.timer = 300; 
    } else if (type === TrafficObjectType.STOP_SIGN) {
      newObj.hasStopped = false;
      newObj.stopTimer = 300; // 5 seconds wait time (60 frames * 5)
    } else if (type === TrafficObjectType.SPEED_LIMIT) {
      newObj.limit = Math.random() > 0.5 ? 8 : 12; // 80kmh or 120kmh
    } else if (type === TrafficObjectType.SPEED_BUMP) {
      newObj.limit = 5; // ~50kmh
    } else if (type === TrafficObjectType.ZEBRA_CROSSING) {
      // Spawn 1 to 3 pedestrians
      const numPeds = 1 + Math.floor(Math.random() * 2);
      const peds: Pedestrian[] = [];
      for(let i=0; i<numPeds; i++) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        peds.push({
          id: id + '_p_' + i,
          x: direction === 1 ? ROAD_X - 30 - (Math.random() * 50) : ROAD_X + ROAD_WIDTH + 30 + (Math.random() * 50),
          // Slower speed: 0.5 to 1.0 (was 1.0 to 2.5)
          speed: 0.5 + Math.random() * 0.5,
          direction: direction,
          walkingPhase: 0
        });
      }
      newObj.pedestrians = peds;
    } else if (type === TrafficObjectType.OBSTACLE_CAR) {
      newObj.lane = Math.floor(Math.random() * 3);
      const isStationary = Math.random() < 0.2;
      newObj.speed = isStationary ? 0 : 4 + Math.random() * 4; 
      newObj.color = Math.random() > 0.5 ? '#3b82f6' : '#22c55e';
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

      if (gameStateRef.current === GameState.PLAYING) {
        // --- 1. Physics ---
        if (inputRef.current.up) {
          player.speed = Math.min(player.speed + ACCELERATION, player.maxSpeed);
        } else if (inputRef.current.down) {
          player.speed = Math.max(player.speed - BRAKING, 0);
        } else {
          if (player.speed > 0) player.speed = Math.max(player.speed - FRICTION, 0);
        }

        const targetX = ROAD_X + (player.lane * LANE_WIDTH) + (LANE_WIDTH - PLAYER_WIDTH) / 2;
        player.x += (targetX - player.x) * 0.15;

        metrics.distance += (player.speed / 100);
        
        // --- Distance Check for Win Condition ---
        if (metrics.distance >= 2000) {
           gameStateRef.current = GameState.GAME_OVER;
           setMessage('COURSE COMPLETED!', 'good');
        }
        
        // Speed Checks
        if (player.speed > currentZoneLimitRef.current + 1) {
          overspeedTimerRef.current++;
          if (overspeedTimerRef.current > 60) {
            metrics.score -= 10;
            metrics.infractions.speeding++; // Track infraction
            setMessage(`SLOW DOWN! Limit ${(currentZoneLimitRef.current * 10).toFixed(0)}`, 'bad');
            overspeedTimerRef.current = 0;
          }
        } else {
          overspeedTimerRef.current = 0;
        }

        if (player.speed > 2 && player.speed <= currentZoneLimitRef.current) {
          metrics.score += 0.05; 
        }

        if (messageTimerRef.current > 0) {
          messageTimerRef.current--;
          if (messageTimerRef.current === 0) metrics.message = '';
        }

        // --- 3. Spawning Logic ---
        spawnTimerRef.current++;
        treeSpawnTimerRef.current++;

        if (treeSpawnTimerRef.current > 20) {
          spawnTree();
          treeSpawnTimerRef.current = 0;
        }

        if (spawnTimerRef.current > 350) { 
           const lastRoadObj = objectsRef.current.filter(o => o.type !== TrafficObjectType.TREE).pop();
           
           if (!lastRoadObj || lastRoadObj.y > 50) {
             const rand = Math.random();
             if (rand < 0.15) spawnObject(TrafficObjectType.TRAFFIC_LIGHT, -200);
             else if (rand < 0.25) spawnObject(TrafficObjectType.STOP_SIGN, -200);
             else if (rand < 0.35) spawnObject(TrafficObjectType.SPEED_LIMIT, -200);
             else if (rand < 0.45) spawnObject(TrafficObjectType.ZEBRA_CROSSING, -200);
             else if (rand < 0.55) spawnObject(TrafficObjectType.SPEED_BUMP, -200);
             else spawnObject(TrafficObjectType.OBSTACLE_CAR, -300);
             spawnTimerRef.current = 0;
           }
        }

        // --- 4. Update Objects & Collision ---
        objectsRef.current.forEach(obj => {
          let relativeSpeed = player.speed;
          
          if (obj.type === TrafficObjectType.OBSTACLE_CAR && obj.speed !== undefined) {
             relativeSpeed = player.speed - obj.speed; 
          }
          
          obj.y += relativeSpeed;

          // Pedestrian Update
          if (obj.type === TrafficObjectType.ZEBRA_CROSSING && obj.pedestrians) {
            obj.pedestrians.forEach(ped => {
               // Only move pedestrians if they are close to being on screen or on screen
               if (obj.y > -200 && obj.y < CANVAS_HEIGHT) {
                  ped.x += ped.speed * ped.direction;
                  ped.walkingPhase += 0.2;
               }
            });
          }

          // Traffic Light Cycling
          if (obj.type === TrafficObjectType.TRAFFIC_LIGHT) {
            if (obj.timer && obj.timer > 0) {
              obj.timer--;
              if (obj.timer === 0) {
                 if (obj.state === 'RED') {
                   // From Red -> Yellow (Get Ready)
                   obj.state = 'YELLOW';
                   obj.nextState = 'GREEN';
                   obj.timer = 90; // 1.5 sec prep
                 } else if (obj.state === 'YELLOW') {
                   if (obj.nextState === 'GREEN') {
                     // From Yellow(Prep) -> Green
                     obj.state = 'GREEN';
                     obj.nextState = 'YELLOW';
                     obj.timer = 400; // Long green
                   } else {
                     // From Yellow(Stop) -> Red
                     obj.state = 'RED';
                     obj.nextState = 'YELLOW';
                     obj.timer = 300; // Red
                   }
                 } else if (obj.state === 'GREEN') {
                    // From Green -> Yellow (Stop)
                    obj.state = 'YELLOW';
                    obj.nextState = 'RED';
                    obj.timer = 120; // 2 sec warn
                 }
              }
            }
          }

          // --- LOGIC CHECKS ---
          if (obj.type === TrafficObjectType.TREE) return;

          const playerNoseY = player.y;
          const playerRearY = player.y + PLAYER_HEIGHT;
          
          // Traffic Light Collision
          if (obj.type === TrafficObjectType.TRAFFIC_LIGHT && !obj.processed) {
             const stopLineY = obj.y + 100;
             const isRed = obj.state === 'RED';
             const isYellowToGreen = obj.state === 'YELLOW' && obj.nextState === 'GREEN';
             const isYellowToRed = obj.state === 'YELLOW' && obj.nextState === 'RED';

             // approaching warning
             if (stopLineY > playerNoseY - 200 && stopLineY < playerNoseY) {
               if (isRed || isYellowToGreen) {
                  if (metrics.message !== 'STOP!') setMessage('STOP!', 'neutral');
               } else if (isYellowToRed) {
                  if (metrics.message !== 'PREPARE TO STOP') setMessage('PREPARE TO STOP', 'neutral');
               }
             }

             // Crossing check
             if (playerRearY < stopLineY && playerNoseY + 10 > stopLineY) {
               if (isRed || isYellowToGreen) {
                 metrics.score -= 50;
                 metrics.infractions.redLights++; // Track
                 setMessage('RAN RED LIGHT! -50', 'bad');
                 obj.processed = true;
               } else if (isYellowToRed) {
                 metrics.score -= 10;
                 setMessage('RISKY YELLOW! -10', 'neutral');
                 obj.processed = true;
               } else if (obj.state === 'GREEN') {
                 metrics.score += 20;
                 setMessage('Good Crossing! +20', 'good');
                 obj.processed = true;
               }
             }
             
             // Waiting bonus
             if (stopLineY > playerNoseY && stopLineY < playerNoseY + 150 && player.speed === 0) {
               if (isRed || isYellowToGreen) {
                  if (metrics.message !== 'WAITING...') {
                    setMessage('WAITING...', 'good');
                    metrics.score += 0.5; 
                  }
               }
             }
          }

          // Stop Sign with 5 Second Timer
          if (obj.type === TrafficObjectType.STOP_SIGN && !obj.processed) {
            const signLineY = obj.y + 50;
            // WIDENED STOP ZONE: From 150px before to 300px before
            const stopZoneStart = signLineY - 300; 
            
            // Check if player is in stop zone
            if (playerNoseY > stopZoneStart && playerNoseY < signLineY + 20) {
               // INCREASED THRESHOLD: Check if player is effectively stopped (speed < 1.0)
               if (player.speed < 1.0) {
                   if (obj.stopTimer !== undefined && obj.stopTimer > 0) {
                       obj.stopTimer--;
                       const secondsLeft = Math.ceil(obj.stopTimer / 60);
                       // Update message less frequently to avoid flicker, or just show it
                       if (obj.stopTimer % 60 === 0) {
                         // Optional: You could update UI message here, but the road text is better
                       }
                   } else {
                       obj.hasStopped = true;
                       if (metrics.message !== 'GO!') setMessage('GO!', 'good');
                   }
               } else {
                   // Moving in stop zone logic
                   if (!obj.hasStopped && metrics.messageType !== 'bad') {
                       // Only spam this if we really need to warn
                       if (Math.random() < 0.05) setMessage('STOP FOR 5s', 'neutral');
                   }
               }
            }

            // Passing the stop line
            if (playerRearY < signLineY) {
               if (!obj.hasStopped) {
                 metrics.score -= 50;
                 metrics.infractions.stopSigns++; // Track
                 setMessage('DID NOT WAIT 5s! -50', 'bad');
               } else {
                 metrics.score += 50;
                 setMessage('Perfect Stop +50', 'good');
               }
               obj.processed = true;
            }
          }

          // Zebra Crossing Logic
          if (obj.type === TrafficObjectType.ZEBRA_CROSSING) {
             const crossY = obj.y;
             const crossHeight = 60;
             const dangerZoneStart = crossY - 10;
             const dangerZoneEnd = crossY + crossHeight + 10;

             // Check collision with pedestrians
             if (obj.pedestrians) {
                obj.pedestrians.forEach(ped => {
                   // Pedestrian HIT box
                   const pedHitX = ped.x;
                   const pedHitY = crossY + 10; // Vertical center of zebra
                   
                   // Player Bounding Box
                   const pLeft = player.x;
                   const pRight = player.x + PLAYER_WIDTH;
                   const pTop = player.y;
                   const pBottom = player.y + PLAYER_HEIGHT;

                   // Simple box collision
                   if (pedHitX > pLeft - 10 && pedHitX < pRight + 10 && 
                       pedHitY > pTop && pedHitY < pBottom) {
                       metrics.score = -999;
                       metrics.infractions.pedestrians++; // Track
                       gameStateRef.current = GameState.GAME_OVER;
                       setMessage('HIT PEDESTRIAN! LICENSE REVOKED', 'bad');
                   }
                });
             }

             // Check Crossing Rules
             if (!obj.processed && playerRearY < crossY) {
               // Player passed the crossing line
               // Check if any pedestrians were on the road
               const anyoneOnRoad = obj.pedestrians?.some(p => p.x > ROAD_X && p.x < ROAD_X + ROAD_WIDTH);
               
               if (anyoneOnRoad) {
                 metrics.score -= 50;
                 metrics.infractions.pedestrians++; // Track
                 setMessage('FAILED TO YIELD! -50', 'bad');
               } else {
                 // Bonus if we waited properly (heuristic: user stopped near it)
                 if (obj.hasStopped) {
                    metrics.score += 20;
                    setMessage('Yielded to Pedestrians +20', 'good');
                 }
               }
               obj.processed = true;
             }
             
             // Check if waiting
             if (!obj.processed && playerNoseY > dangerZoneStart - 100 && playerNoseY < dangerZoneStart) {
                const anyoneOnRoad = obj.pedestrians?.some(p => p.x > ROAD_X - 20 && p.x < ROAD_X + ROAD_WIDTH + 20);
                if (anyoneOnRoad && player.speed < 0.5) {
                   obj.hasStopped = true; 
                   setMessage('Yielding...', 'good');
                }
             }
          }

          // Speed Limit Signs
          if (obj.type === TrafficObjectType.SPEED_LIMIT && !obj.processed) {
             const signY = obj.y + 50;
             if (playerRearY < signY) {
                if (obj.limit) {
                  currentZoneLimitRef.current = obj.limit;
                  setMessage(`LIMIT SET TO ${obj.limit * 10}`, 'neutral');
                }
                obj.processed = true;
             }
          }

          // Speed Bump with Warning and Penalty
          if (obj.type === TrafficObjectType.SPEED_BUMP && !obj.processed) {
            const bumpY = obj.y + 20;
            const dist = bumpY - playerNoseY;
            
            // Warning Zone (400px before bump)
            if (dist > 0 && dist < 400 && player.speed > 5) {
                if (metrics.message === '' || metrics.messageType === 'good') {
                    setMessage('BUMP AHEAD! SLOW TO 5', 'neutral');
                }
            }
            
            // Hitting bump
            if (playerRearY < bumpY && playerNoseY + 20 > bumpY) {
               const maxBumpSpeed = obj.limit || 5; 
               if (player.speed > maxBumpSpeed) {
                 metrics.score -= 30;
                 metrics.infractions.bumps++; // Track
                 setMessage('HIT BUMP TOO FAST! -30', 'bad');
                 playerRef.current.speed *= 0.8;
               } else {
                 metrics.score += 15;
                 setMessage('Good Bump Speed +15', 'good');
               }
               obj.processed = true;
            }
          }

          // Car Collision
          if (obj.type === TrafficObjectType.OBSTACLE_CAR) {
             const carX = ROAD_X + ((obj.lane || 0) * LANE_WIDTH) + (LANE_WIDTH - PLAYER_WIDTH) / 2;
             const carY = obj.y;
             
             if (
                player.x < carX + PLAYER_WIDTH &&
                player.x + PLAYER_WIDTH > carX &&
                player.y < carY + PLAYER_HEIGHT &&
                player.y + PLAYER_HEIGHT > carY
             ) {
                metrics.score -= 50;
                metrics.infractions.crashes++; // Track
                gameStateRef.current = GameState.GAME_OVER;
                setMessage('CRASHED!', 'bad');
             }
          }
        });

        // Cleanup
        objectsRef.current = objectsRef.current.filter(obj => obj.y < CANVAS_HEIGHT + 200);

        if (metrics.score < -100) {
          gameStateRef.current = GameState.GAME_OVER;
        }
      }

      // Handle Game Over Logic (Save Score Once)
      if (gameStateRef.current === GameState.GAME_OVER && uiState.gameState !== GameState.GAME_OVER) {
         if (uiState.currentUser) {
            const updatedUsers = updateUserScore(uiState.currentUser.username, metrics.score);
            setUiState(prev => ({ ...prev, allUsers: updatedUsers }));
         }
      }

      // --- RENDERING ---

      // Background
      ctx.fillStyle = COLOR_GRASS;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Trees
      objectsRef.current.forEach(obj => {
        if (obj.type === TrafficObjectType.TREE && obj.x !== undefined) {
           ctx.save();
           const treeX = obj.x;
           const treeY = obj.y;
           
           ctx.shadowColor = 'rgba(0,0,0,0.2)';
           ctx.shadowBlur = 5;
           ctx.fillStyle = '#5d4037';
           ctx.fillRect(treeX + TREE_WIDTH/2 - 5, treeY + TREE_HEIGHT - 15, 10, 15);
           ctx.fillStyle = '#15803d'; 
           ctx.beginPath();
           ctx.moveTo(treeX, treeY + TREE_HEIGHT - 10);
           ctx.lineTo(treeX + TREE_WIDTH, treeY + TREE_HEIGHT - 10);
           ctx.lineTo(treeX + TREE_WIDTH/2, treeY + 20);
           ctx.fill();
           ctx.fillStyle = '#16a34a';
           ctx.beginPath();
           ctx.moveTo(treeX + 5, treeY + 40);
           ctx.lineTo(treeX + TREE_WIDTH - 5, treeY + 40);
           ctx.lineTo(treeX + TREE_WIDTH/2, treeY);
           ctx.fill();
           ctx.restore();
        }
      });

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

      // Floor Objects
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

            // Draw Countdown Timer if active or approaching
            if (obj.stopTimer !== undefined && !obj.hasStopped && obj.y > 0 && obj.y < CANVAS_HEIGHT) {
                const distToSign = obj.y - (player.y);
                // Increased visual range: from -300 to 500 relative to player (so player sees it coming)
                if (distToSign < 500 && distToSign > -200) {
                    ctx.save();
                    ctx.translate(ROAD_X + ROAD_WIDTH / 2, lineY - 40);
                    
                    // background circle
                    ctx.beginPath();
                    ctx.arc(0, 0, 40, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.85)';
                    ctx.fill();
                    ctx.strokeStyle = player.speed < 1.0 ? '#22c55e' : '#ef4444'; // Green if stopped, Red if moving
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    if (player.speed >= 1.0) {
                      ctx.fillStyle = '#ef4444'; 
                      ctx.font = 'bold 20px Arial';
                      ctx.fillText("STOP", 0, -10);
                      ctx.font = 'bold 24px Arial';
                      ctx.fillText("HERE", 0, 15);
                    } else {
                      const seconds = Math.ceil(obj.stopTimer / 60);
                      ctx.fillStyle = '#ffffff'; 
                      ctx.font = 'bold 40px monospace';
                      ctx.fillText(seconds.toString(), 0, 2);
                    }
                    ctx.restore();
                }
            }
         }

         // ZEBRA CROSSING
         if (obj.type === TrafficObjectType.ZEBRA_CROSSING) {
           const y = obj.y;
           const h = 60;
           ctx.fillStyle = '#ffffff';
           const stripeW = 30;
           const gap = 20;
           for(let lx = ROAD_X + 10; lx < ROAD_X + ROAD_WIDTH; lx += (stripeW + gap)) {
              ctx.fillRect(lx, y, stripeW, h);
           }

           // Draw Pedestrians
           if (obj.pedestrians) {
              obj.pedestrians.forEach(ped => {
                 const px = ped.x;
                 const py = y + 15;
                 
                 // BLACK STICK FIGURE
                 ctx.strokeStyle = '#000000';
                 ctx.lineWidth = 3;
                 ctx.lineCap = 'round';
                 
                 // Head (Image)
                 if (faceImageRef.current) {
                   // Draw Image at head position
                   ctx.drawImage(faceImageRef.current, px - 12, py - 12, 24, 24);
                 } else {
                    // Fallback Head
                    ctx.beginPath();
                    ctx.arc(px, py, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.stroke();
                 }
                 
                 // Body
                 ctx.beginPath();
                 ctx.moveTo(px, py + 12);
                 ctx.lineTo(px, py + 30);
                 ctx.stroke();

                 // Legs (Animate)
                 const phase = Math.sin(ped.walkingPhase);
                 ctx.beginPath();
                 ctx.moveTo(px, py + 30);
                 ctx.lineTo(px - (5 * phase), py + 45);
                 ctx.moveTo(px, py + 30);
                 ctx.lineTo(px + (5 * phase), py + 45);
                 ctx.stroke();
                 
                 // Arms
                 ctx.beginPath();
                 ctx.moveTo(px, py + 18);
                 ctx.lineTo(px - (5 * -phase), py + 26);
                 ctx.moveTo(px, py + 18);
                 ctx.lineTo(px + (5 * -phase), py + 26);
                 ctx.stroke();
              });
           }
         }

         // SPEED BUMP
         if (obj.type === TrafficObjectType.SPEED_BUMP) {
            const bumpY = obj.y;
            const bumpHeight = 30;
            const stripeWidth = 40;
            const numStripes = Math.ceil(ROAD_WIDTH / stripeWidth);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(ROAD_X, bumpY, ROAD_WIDTH, bumpHeight);
            ctx.clip();
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(ROAD_X, bumpY, ROAD_WIDTH, bumpHeight);
            ctx.fillStyle = '#1f2937';
            for (let i = 0; i < numStripes; i++) {
                if (i % 2 === 0) {
                    ctx.fillRect(ROAD_X + (i * stripeWidth), bumpY, stripeWidth, bumpHeight);
                }
            }
            // Bevel
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ROAD_X, bumpY);
            ctx.lineTo(ROAD_X + ROAD_WIDTH, bumpY);
            ctx.stroke();
            ctx.restore();
         }

         // SPEED LIMIT SIGN
         if (obj.type === TrafficObjectType.SPEED_LIMIT) {
           const signY = obj.y + 50;
           ctx.save();
           ctx.translate(ROAD_X + ROAD_WIDTH + 40, signY);
           
           ctx.fillStyle = '#64748b';
           ctx.fillRect(-5, 0, 10, 60);

           ctx.beginPath();
           ctx.arc(0, 0, 30, 0, Math.PI * 2);
           ctx.fillStyle = 'white';
           ctx.fill();
           ctx.strokeStyle = '#ef4444';
           ctx.lineWidth = 5;
           ctx.stroke();

           ctx.fillStyle = 'black';
           ctx.font = 'bold 20px Arial';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           ctx.fillText(`${(obj.limit || 8) * 10}`, 0, 0);
           ctx.restore();
         }
      });

      // Cars
      objectsRef.current.forEach(obj => {
        if (obj.type === TrafficObjectType.OBSTACLE_CAR) {
           const carX = ROAD_X + ((obj.lane || 0) * LANE_WIDTH) + (LANE_WIDTH - PLAYER_WIDTH) / 2;
           const carY = obj.y;
           const carColor = obj.color || '#3b82f6';

           ctx.shadowColor = 'rgba(0,0,0,0.5)';
           ctx.shadowBlur = 10;
           
           ctx.fillStyle = '#111';
           ctx.fillRect(carX - 4, carY + 10, 8, 15);
           ctx.fillRect(carX + PLAYER_WIDTH - 4, carY + 10, 8, 15);
           ctx.fillRect(carX - 4, carY + PLAYER_HEIGHT - 25, 8, 15);
           ctx.fillRect(carX + PLAYER_WIDTH - 4, carY + PLAYER_HEIGHT - 25, 8, 15);

           ctx.fillStyle = carColor;
           ctx.fillRect(carX, carY, PLAYER_WIDTH, PLAYER_HEIGHT);
           
           ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
           ctx.fillRect(carX + 4, carY + 20, PLAYER_WIDTH - 8, PLAYER_HEIGHT - 30);
           
           ctx.fillStyle = '#fef08a';
           ctx.fillRect(carX + 2, carY + PLAYER_HEIGHT - 5, 10, 5); 
           ctx.fillRect(carX + PLAYER_WIDTH - 12, carY + PLAYER_HEIGHT - 5, 10, 5);
           
           ctx.shadowBlur = 0;
        }
      });

      // Player
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ef4444';
      const px = player.x;
      const py = player.y;
      
      ctx.fillStyle = '#111';
      ctx.fillRect(px - 4, py + 10, 8, 15);
      ctx.fillRect(px + PLAYER_WIDTH - 4, py + 10, 8, 15);
      ctx.fillRect(px - 4, py + PLAYER_HEIGHT - 25, 8, 15);
      ctx.fillRect(px + PLAYER_WIDTH - 4, py + PLAYER_HEIGHT - 25, 8, 15);

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px, py, PLAYER_WIDTH, PLAYER_HEIGHT);
      
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(px + 4, py + 20, PLAYER_WIDTH - 8, PLAYER_HEIGHT - 30);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(px + 6, py + 25, PLAYER_WIDTH - 12, 15);
      ctx.fillRect(px + 6, py + 55, PLAYER_WIDTH - 12, 10);

      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 15;
      ctx.fillRect(px + 2, py, 10, 5);
      ctx.fillRect(px + PLAYER_WIDTH - 12, py, 10, 5);
      ctx.shadowBlur = 0;

      if (inputRef.current.down) {
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillRect(px + 2, py + PLAYER_HEIGHT - 5, 10, 5);
        ctx.fillRect(px + PLAYER_WIDTH - 12, py + PLAYER_HEIGHT - 5, 10, 5);
        ctx.shadowBlur = 0;
      }

      // Overhead Objects
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

      setUiState(prev => ({
        ...prev,
        gameState: gameStateRef.current,
        metrics: { ...metricsRef.current },
        speed: playerRef.current.speed
      }));

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
        currentUser={uiState.currentUser}
        allUsers={uiState.allUsers}
        onLogin={handleLogin}
        onDeleteUser={handleDeleteUser}
        onLogout={handleLogout}
        onStart={startGame}
        onRestart={startGame}
      />
    </div>
  );
};

export default TrafficGame;