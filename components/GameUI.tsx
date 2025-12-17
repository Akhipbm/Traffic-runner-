import React, { useState } from 'react';
import { GameState, GameMetrics, User } from '../types';

interface GameUIProps {
  gameState: GameState;
  metrics: GameMetrics;
  speed: number;
  currentUser: User | null;
  allUsers: User[];
  onLogin: (username: string) => void;
  onDeleteUser: (username: string) => void;
  onLogout: () => void;
  onStart: () => void;
  onRestart: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ 
  gameState, 
  metrics, 
  speed, 
  currentUser,
  allUsers,
  onLogin,
  onDeleteUser,
  onLogout,
  onStart, 
  onRestart 
}) => {
  const [nameInput, setNameInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().length > 0) {
      onLogin(nameInput.trim());
    }
  };

  const sortedUsers = [...allUsers]
    .filter(u => u.highScore > 0) // Only show positive scores
    .sort((a, b) => b.highScore - a.highScore);
    
  const isWin = metrics.distance >= 2000;
  
  // Calculate total infractions for Perfect Game check
  const totalInfractions = (Object.values(metrics.infractions) as number[]).reduce((a, b) => a + b, 0);
  const isPerfectRun = isWin && totalInfractions === 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* HUD - Top Bar */}
      {gameState === GameState.PLAYING && (
        <div className="flex justify-between items-start">
          <div className="bg-slate-900/80 text-white p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</div>
            <div className="text-3xl font-mono font-bold text-yellow-400">{Math.floor(metrics.score)}</div>
          </div>
          
          <div className="bg-slate-900/80 text-white p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
             <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Distance</div>
             <div className="text-3xl font-mono font-bold">
               {Math.floor(metrics.distance)} <span className="text-sm text-slate-400">/ 2000m</span>
             </div>
          </div>
        </div>
      )}
      
      {/* Top Right User Info (When not playing) */}
      {gameState !== GameState.LOGIN && gameState !== GameState.PLAYING && (
         <div className="absolute top-4 right-4 pointer-events-auto flex gap-2">
            <div className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600">
               {currentUser?.username}
            </div>
            <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
              Logout
            </button>
         </div>
      )}

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

      {/* LOGIN SCREEN */}
      {gameState === GameState.LOGIN && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
           {!showAdmin ? (
             <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center shadow-2xl transform transition-all">
               <h1 className="text-4xl font-black text-slate-900 mb-6">TRAFFIC RUNNER</h1>
               <form onSubmit={handleLoginSubmit} className="space-y-4">
                 <div>
                   <label className="block text-left text-sm font-bold text-slate-700 mb-1">Enter Player Name</label>
                   <input 
                     type="text" 
                     required
                     className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                     placeholder="e.g. SpeedRacer"
                     value={nameInput}
                     onChange={(e) => setNameInput(e.target.value)}
                   />
                 </div>
                 <button 
                   type="submit"
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-lg shadow-lg transition-colors"
                 >
                   PLAY NOW
                 </button>
               </form>
               <div className="mt-6 pt-6 border-t border-slate-200">
                  <button onClick={() => setShowAdmin(true)} className="text-sm text-slate-500 hover:text-slate-800 underline">
                    Admin: Manage Users ({allUsers.length})
                  </button>
               </div>
             </div>
           ) : (
             <div className="bg-white p-6 rounded-2xl max-w-2xl w-full h-3/4 flex flex-col shadow-2xl">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                 <button onClick={() => setShowAdmin(false)} className="text-slate-500 hover:text-slate-900">Close</button>
               </div>
               <div className="flex-1 overflow-auto border rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="p-3 font-bold text-slate-700">Player</th>
                        <th className="p-3 font-bold text-slate-700">High Score</th>
                        <th className="p-3 font-bold text-slate-700 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map(u => (
                        <tr key={u.username} className="border-b border-slate-100 hover:bg-slate-50">
                           <td className="p-3 text-slate-800">{u.username}</td>
                           <td className="p-3 text-slate-800 font-mono">{u.highScore}</td>
                           <td className="p-3 text-right">
                             <button 
                               onClick={() => onDeleteUser(u.username)}
                               className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm font-bold"
                             >
                               Delete
                             </button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
               <div className="mt-4 text-sm text-slate-500">
                 Total Users: {allUsers.length}
               </div>
             </div>
           )}
        </div>
      )}

      {/* START SCREEN */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
          <div className="flex gap-6 items-start">
            {/* Main Menu */}
            <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl">
              <h1 className="text-4xl font-black text-slate-900 mb-2">TRAFFIC RUNNER</h1>
              <p className="text-slate-600 mb-6">Welcome, <span className="font-bold text-blue-600">{currentUser?.username}</span></p>
              
              <div className="space-y-4 text-left bg-slate-100 p-4 rounded-lg mb-6 text-sm text-black">
                 <div className="text-center font-bold text-slate-700 mb-2">OBJECTIVE: DRIVE 2000m</div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">STOP</span>
                  <span>at Red Lights & Stop Signs (Wait 5s)</span>
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

            {/* Leaderboard - Side Panel */}
            <div className="bg-slate-800 p-6 rounded-2xl w-64 shadow-2xl border border-slate-700 text-white">
              <h3 className="text-xl font-bold mb-4 text-yellow-400">TOP DRIVERS</h3>
              <div className="space-y-2">
                {sortedUsers.slice(0, 5).map((u, idx) => (
                  <div key={u.username} className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                    <div className="flex flex-col overflow-hidden">
                       <span className="text-xs text-slate-400 font-bold">#{idx + 1}</span>
                       <span className="text-sm truncate w-28" title={u.username}>{u.username}</span>
                    </div>
                    <span className="font-mono font-bold text-yellow-200">{u.highScore}</span>
                  </div>
                ))}
                {sortedUsers.length === 0 && <div className="text-slate-500 text-sm">No high scores yet</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER / FINISH SCREEN */}
      {gameState === GameState.GAME_OVER && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-auto backdrop-blur-sm 
          ${isPerfectRun ? 'bg-yellow-900/80' : isWin ? 'bg-green-900/80' : 'bg-red-900/80'}`}>
          <div className="flex gap-6 items-center">
            <div className={`bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl border-4 
              ${isPerfectRun ? 'border-yellow-400' : isWin ? 'border-green-500' : 'border-red-500'}`}>
              
              {/* TROPHY FOR PERFECT RUN */}
              {isPerfectRun && <div className="text-6xl mb-4 animate-bounce">🏆</div>}

              <h2 className={`text-3xl font-black mb-2 
                ${isPerfectRun ? 'text-yellow-600' : isWin ? 'text-green-600' : 'text-red-600'}`}>
                {isPerfectRun ? 'SUPER GOOD DRIVER!' : isWin ? 'COURSE COMPLETED!' : 'LICENSE REVOKED!'}
              </h2>
              
              {isPerfectRun && (
                <p className="text-slate-600 font-bold mb-4">Congratulations! Perfect Driving!</p>
              )}

              <div className="text-6xl font-black text-slate-900 mb-2">{Math.floor(metrics.score)}</div>
              <p className="text-slate-500 uppercase tracking-widest font-bold mb-6">Final Score</p>
              
              {/* Traffic Violation Report */}
              <div className="bg-slate-100 p-4 rounded-lg text-left mb-6 text-slate-800 text-sm w-full">
                <h4 className="font-bold border-b border-slate-300 pb-2 mb-2 text-slate-600 uppercase tracking-wider text-xs">Traffic Violation Report</h4>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Red Lights Run:</span> <span className={`font-mono font-bold ${metrics.infractions.redLights > 0 ? 'text-red-600' : 'text-slate-400'}`}>{metrics.infractions.redLights}</span></div>
                  <div className="flex justify-between"><span>Stop Sign Violations:</span> <span className={`font-mono font-bold ${metrics.infractions.stopSigns > 0 ? 'text-red-600' : 'text-slate-400'}`}>{metrics.infractions.stopSigns}</span></div>
                  <div className="flex justify-between"><span>Speeding Incidents:</span> <span className={`font-mono font-bold ${metrics.infractions.speeding > 0 ? 'text-red-600' : 'text-slate-400'}`}>{metrics.infractions.speeding}</span></div>
                  <div className="flex justify-between"><span>Bump Speeding:</span> <span className={`font-mono font-bold ${metrics.infractions.bumps > 0 ? 'text-red-600' : 'text-slate-400'}`}>{metrics.infractions.bumps}</span></div>
                  <div className="flex justify-between"><span>Pedestrian Safety:</span> <span className={`font-mono font-bold ${metrics.infractions.pedestrians > 0 ? 'text-red-600' : 'text-slate-400'}`}>{metrics.infractions.pedestrians}</span></div>
                  <div className="flex justify-between"><span>Crashes:</span> <span className={`font-mono font-bold ${metrics.infractions.crashes > 0 ? 'text-red-600' : 'text-slate-400'}`}>{metrics.infractions.crashes}</span></div>
                </div>
              </div>

              <button 
                onClick={onRestart}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-colors"
              >
                PLAY AGAIN
              </button>
            </div>

             {/* Leaderboard - Side Panel */}
             <div className="bg-slate-800 p-6 rounded-2xl w-64 shadow-2xl border border-slate-700 text-white">
              <h3 className="text-xl font-bold mb-4 text-yellow-400">LEADERBOARD</h3>
              <div className="space-y-2">
                {sortedUsers.slice(0, 5).map((u, idx) => (
                  <div key={u.username} className={`flex justify-between items-center p-2 rounded ${u.username === currentUser?.username ? 'bg-blue-900/50 border border-blue-500' : 'bg-slate-700/50'}`}>
                    <div className="flex flex-col overflow-hidden">
                       <span className="text-xs text-slate-400 font-bold">#{idx + 1}</span>
                       <span className="text-sm truncate w-28" title={u.username}>{u.username}</span>
                    </div>
                    <span className="font-mono font-bold text-yellow-200">{u.highScore}</span>
                  </div>
                ))}
                {sortedUsers.length === 0 && <div className="text-slate-500 text-sm">No high scores yet</div>}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Buy Me A Coffee Widget */}
      <a 
        href="https://buymeacoffee.com/akhi.pbm" 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute bottom-4 left-4 pointer-events-auto z-50 group"
        title="Buy me a coffee"
      >
        <div className="bg-[#FFDD00] hover:bg-[#FFEA00] text-slate-900 p-2 rounded-full shadow-xl border-2 border-slate-900 transition-all hover:scale-110 active:scale-95 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
            </svg>
            <span className="font-bold text-xs hidden group-hover:block whitespace-nowrap">Buy me a coffee</span>
        </div>
      </a>
    </div>
  );
};

export default GameUI;