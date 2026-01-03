"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "@/context/GameStateContext";

// --- CONFIG ---
const OBSTACLE_SPAWN_RATE = 100; // Frames between spawns
const GAME_SPEED_INCREMENT = 0.0001;

export default function FlyerRunner() {
  const { session } = useGameState();
  
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Refs for Game Loop
  const reqRef = useRef<number>(0);
  const playerX = useRef(50); // 0 to 100%
  const obstacles = useRef<{ id: number; x: number; y: number; type: 'block' | 'coin' }[]>([]);
  const frameCount = useRef(0);
  const gameSpeed = useRef(1.0);

  // --- CONTROLS ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    const xPercent = (e.clientX / window.innerWidth) * 100;
    playerX.current = xPercent;
  }, [isPlaying]);

  // --- GAME ENGINE ---
  const update = useCallback(() => {
    if (!isPlaying) return;

    // 1. Spawn Obstacles
    frameCount.current++;
    if (frameCount.current % Math.floor(OBSTACLE_SPAWN_RATE / gameSpeed.current) === 0) {
      obstacles.current.push({
        id: Date.now(),
        x: Math.random() * 80 + 10, 
        y: -10, // Start at horizon (top of 3D plane)
        type: Math.random() > 0.8 ? 'coin' : 'block'
      });
    }

    // 2. Increase Speed
    gameSpeed.current += GAME_SPEED_INCREMENT;

    // 3. Update Obstacles (Move them "down" the screen / closer to player)
    obstacles.current.forEach(obs => {
      // As objects get closer (y increases), they should visually scale up (simulated 3D)
      // For now, we just move them linear Y
      obs.y += 0.5 * gameSpeed.current; 
    });

    // 4. Cleanup
    obstacles.current = obstacles.current.filter(obs => obs.y < 120);

    // 5. Collision Detection
    // Player is fixed at Y ~ 85%
    obstacles.current.forEach(obs => {
      if (
        obs.y > 80 && obs.y < 95 && // Y overlap
        Math.abs(obs.x - playerX.current) < 8 // X overlap
      ) {
        if (obs.type === 'coin') {
            obs.y = 200; // Remove
            setScore(prev => prev + 50);
        } else if (obs.type === 'block') {
            endGame();
        }
      }
    });

    setScore(prev => prev + 1);
    reqRef.current = requestAnimationFrame(update);
  }, [isPlaying]);

  // --- START / STOP ---
  useEffect(() => {
    if (isPlaying) {
      reqRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(reqRef.current);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [isPlaying, update]);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    obstacles.current = [];
    gameSpeed.current = 1.0;
    playerX.current = 50;
    setIsPlaying(true);
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) setHighScore(score);
  };

  return (
    <div 
        className="w-full h-screen bg-black overflow-hidden relative cursor-none perspective-container"
        onMouseMove={handleMouseMove}
    >
        {/* --- 1. THE 3D WORLD LAYER --- */}
        <div className="world-plane">
             
             {/* THE MOVING FLOOR (Infinite Loop) */}
             <div className="floor-track">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="/assets/city_loop.png" className="floor-image" alt="" />
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="/assets/city_loop.png" className="floor-image" alt="" />
             </div>

             {/* FOG to hide the horizon line */}
             <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-black via-black to-transparent z-10" />
        </div>


        {/* --- 2. GAME ENTITIES (2D Overlay on top of 3D world) --- */}
        
        {/* PLAYER SHIP */}
        <div 
            className="absolute bottom-[10%] w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[40px] border-b-green-500 transition-transform duration-75 z-20"
            style={{ 
                left: `${playerX.current}%`,
                transform: `translateX(-50%) rotate(${(playerX.current - 50) * 0.5}deg)`,
                filter: 'drop-shadow(0 0 15px #0f0)'
            }}
        >
            {/* Engine Glow */}
            <div className="absolute top-full left-[-10px] w-[20px] h-[20px] bg-blue-500 blur-md" />
        </div>

        {/* OBSTACLES */}
        {obstacles.current.map(obs => (
            <div
                key={obs.id}
                className={`absolute z-20 flex items-center justify-center font-bold text-xs ${obs.type === 'coin' ? 'text-yellow-500' : 'text-red-500'}`}
                style={{
                    left: `${obs.x}%`,
                    top: `${obs.y}%`,
                    transform: `translate(-50%, -50%) scale(${0.5 + (obs.y / 100)})`, // Fake 3D scaling (smaller at top, bigger at bottom)
                    opacity: obs.y < 10 ? 0 : 1 // Fade in at horizon
                }}
            >
                {obs.type === 'coin' ? (
                    <div className="w-8 h-8 rounded-full border-4 border-yellow-500 shadow-[0_0_15px_yellow] bg-yellow-900/50 flex items-center justify-center">
                        $
                    </div>
                ) : (
                    <div className="w-12 h-12 border-2 border-red-500 bg-red-900/50 shadow-[0_0_15px_red] flex items-center justify-center">
                        [X]
                    </div>
                )}
            </div>
        ))}


        {/* --- 3. UI --- */}
        <div className="absolute top-4 left-4 font-mono text-green-500 text-xl z-50 mix-blend-difference">
            SCORE: {score.toString().padStart(6, '0')}
        </div>

        {(!isPlaying) && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                <h1 className="text-4xl md:text-6xl font-bold text-green-500 mb-4 font-mono tracking-widest text-shadow-glow">
                    FLYER_RUNNER
                </h1>
                
                {gameOver && (
                    <div className="text-center mb-8 border border-red-500 p-8 bg-red-900/20">
                        <p className="text-red-500 text-xl mb-2 font-bold">MISSION FAILED</p>
                        <p className="text-white text-2xl font-mono">SCORE: {score}</p>
                    </div>
                )}

                <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-green-600 text-black font-bold font-mono text-xl hover:bg-green-500 hover:scale-105 transition-all border-2 border-white shadow-[0_0_20px_#0f0]"
                >
                    {gameOver ? "RETRY" : "START ENGINE"}
                </button>
            </div>
        )}

        {/* --- 4. CSS ENGINE --- */}
        <style jsx>{`
            .perspective-container {
                perspective: 600px; /* How "deep" the 3D world looks */
                overflow: hidden;
            }

            .world-plane {
                position: absolute;
                top: 50%; /* Horizon line */
                left: 0;
                width: 100%;
                height: 50%; /* Bottom half of screen */
                transform-style: preserve-3d;
                transform: rotateX(60deg); /* This tilts the floor back! */
                transform-origin: top center;
            }

            .floor-track {
                position: absolute;
                top: 0;
                left: -50%; /* Make it wider than screen so edges don't show when tilted */
                width: 200%; 
                display: flex;
                flex-direction: column; /* Stack images */
                animation: scrollFloor 2s linear infinite; /* Speed of the floor */
            }

            .floor-image {
                width: 100%;
                height: 100vh; /* One screen height per tile */
                object-fit: cover;
                opacity: 0.6;
            }

            @keyframes scrollFloor {
                from { transform: translateY(0); }
                to { transform: translateY(-50%); } /* Move exactly one tile height */
            }

            .text-shadow-glow {
                text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
            }
        `}</style>
    </div>
  );
}
