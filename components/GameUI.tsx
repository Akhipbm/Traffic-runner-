import React from 'react';
import { GameState, GameMetrics } from '../types';

interface GameUIProps {
  gameState: GameState;
  metrics: GameMetrics;
  speed: number;
  onStart: () => void;
  onRestart: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, metrics, speed, onStart, onRestart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* HUD - Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-slate-900/80 text-white p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</div>
          <div className="text-3xl font-mono font-bold text-yellow-400">{Math.floor(metrics.score)}</div>
        </div>
        
        <div className="bg-slate-900/80 text-white p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
           <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Distance</div>
           <div className="text-3xl font-mono font-bold">{Math.floor(metrics.distance)}m</div>
        </div>
      </div>

      {/* Message Feedback Center */}
      {metrics.message && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 animate-bounce">
          <div className={`
            px-6 py-3 rounded-full font-bold text-xl shadow-lg border-2 backdrop-blur-md
            ${metrics.messageType === 'good' ? 'bg-green-500/90 border-green-300 text-white' : ''}
            ${metrics.messageType === 'bad' ? 'bg-red-500/90 border-red-300 text-white' : ''}
            ${metrics.messageType === 'neutral' ? 'bg-blue-500/90 border-blue-300 text-white' : ''}
          `}>
            {metrics.message}
          </div>
        </div>
      )}

      {/* Speedometer - Bottom Right */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-6 right-6">
           <div className="bg-slate-900/90 rounded-full w-32 h-32 border-4 border-slate-700 relative shadow-2xl flex items-center justify-center">
             <div className="text-center">
               <div className="text-4xl font-black text-white">{Math.floor(speed * 10)}</div>
               <div className="text-xs text-slate-400 font-bold">KM/H</div>
             </div>
             {/* Simple gauge needle simulation */}
             <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle 
                  cx="64" cy="64" r="60" 
                  fill="none" 
                  stroke="#334155" 
                  strokeWidth="8"
                />
                <circle 
                  cx="64" cy="64" r="60" 
                  fill="none" 
                  stroke={speed > 12 ? '#ef4444' : '#3b82f6'} 
                  strokeWidth="8"
                  strokeDasharray={`${(speed / 15) * 377} 377`}
                  className="transition-all duration-300"
                />
             </svg>
           </div>
        </div>
      )}

      {/* Screens */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl transform transition-all hover:scale-105">
            <h1 className="text-4xl font-black text-slate-900 mb-2">TRAFFIC RUNNER</h1>
            <p className="text-slate-600 mb-6">Obey the rules. Earn the points.</p>
            
            <div className="space-y-4 text-left bg-slate-100 p-4 rounded-lg mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">STOP</span>
                <span>at Red Lights & Stop Signs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">GO</span>
                <span>on Green Lights</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">KEYS</span>
                <span>⬆ Accel ⬇ Brake ⬅ ➡ Lane</span>
              </div>
            </div>

            <button 
              onClick={onStart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg shadow-blue-500/30 transition-colors"
            >
              START DRIVING
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl border-4 border-red-500">
            <h2 className="text-3xl font-black text-red-600 mb-2">LICENSE REVOKED!</h2>
            <div className="text-6xl font-black text-slate-900 mb-2">{Math.floor(metrics.score)}</div>
            <p className="text-slate-500 uppercase tracking-widest font-bold mb-8">Final Score</p>
            
            <button 
              onClick={onRestart}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;