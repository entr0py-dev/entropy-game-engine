"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "@/context/GameStateContext";

// --- CONFIG ---
const SHIP_SPEED = 0.1;
const OBSTACLE_SPAWN_RATE = 100; // Frames between spawns
const GAME_SPEED_INCREMENT = 0.0001;

export default function FlyerRunner() {
  const { addEntrobucks, session } = useGameState();
  
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Refs for Game Loop (Mutable state without re-renders)
  const reqRef = useRef<number>(0);
  const playerX = useRef(50); // 0 to 100%
  const obstacles = useRef<{ id: number; x: number; y: number; type: 'block' | 'coin' }[]>([]);
  const frameCount = useRef(0);
  const gameSpeed = useRef(1.0);

  // --- CONTROLS ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    // Map screen X to percentage (0-100)
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
        x: Math.random() * 80 + 10, // Keep within 10-90% width
        y: -10, // Start above screen
        type: Math.random() > 0.8 ? 'coin' : 'block'
      });
    }

    // 2. Increase Speed
    gameSpeed.current += GAME_SPEED_INCREMENT;

    // 3. Update Obstacles
    obstacles.current.forEach(obs => {
      obs.y += 0.5 * gameSpeed.current; // Move down
    });

    // 4. Cleanup old obstacles
    obstacles.current = obstacles.current.filter(obs => obs.y < 120);

    // 5. Collision Detection
    const playerHitbox = { x: playerX.current, y: 85, width: 5 }; // Approx % width
    
    obstacles.current.forEach(obs => {
      // Simple box collision
      if (
        obs.y > 80 && obs.y < 95 && // Y overlap
        Math.abs(obs.x - playerX.current) < 8 // X overlap
      ) {
        if (obs.type === 'coin') {
            // Collect Coin logic (remove coin, add score)
            obs.y = 200; // Move off screen
            setScore(prev => prev + 50);
        } else if (obs.type === 'block') {
            // Crash logic
            endGame();
        }
      }
    });

    // 6. Score Tick
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
    if (session?.user) {
        // Reward Player (10% of score as XP/Cash)
        const reward = Math.floor(score / 10);
        // We can call context functions here if desired
        // addEntrobucks(reward, "Flyer Runner Reward");
    }
    if (score > highScore) setHighScore(score);
  };

  return (
    <div 
        className="w-full h-screen bg-black overflow-hidden relative cursor-none"
        onMouseMove={handleMouseMove}
    >
        {/* --- 1. BACKGROUND LAYER (The City Loop) --- */}
        <div className="absolute inset-0 opacity-50 pointer-events-none">
             <div className="loop-track">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="/assets/city_loop.png" className="loop-image" alt="" />
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="/assets/city_loop.png" className="loop-image" alt="" />
             </div>
        </div>

        {/* --- 2. GAME LAYER (Entities) --- */}
        
        {/* PLAYER SHIP */}
        <div 
            className="absolute bottom-[10%] w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-green-500 transition-transform duration-75"
            style={{ 
                left: `${playerX.current}%`,
                transform: `translateX(-50%) rotate(${(playerX.current - 50) * 0.5}deg)`, // Tilt effect
                filter: 'drop-shadow(0 0 10px #0f0)'
            }}
        />

        {/* OBSTACLES */}
        {obstacles.current.map(obs => (
            <div
                key={obs.id}
                className={`absolute w-10 h-10 transition-transform ${obs.type === 'coin' ? 'bg-yellow-400 rounded-full' : 'bg-red-600 border border-white'}`}
                style={{
                    left: `${obs.x}%`,
                    top: `${obs.y}%`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: obs.type === 'coin' ? '0 0 15px yellow' : '0 0 10px red'
                }}
            >
                {obs.type === 'coin' ? '$' : 'X'}
            </div>
        ))}


        {/* --- 3. UI OVERLAY --- */}
        <div className="absolute top-4 left-4 font-mono text-green-500 text-xl z-50">
            SCORE: {score.toString().padStart(6, '0')}
        </div>

        {/* --- 4. GAME OVER / START MENU --- */}
        {(!isPlaying) && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4 font-mono">
                    FLYER_RUNNER
                </h1>
                
                {gameOver && (
                    <div className="text-center mb-8">
                        <p className="text-red-500 text-xl mb-2">CRITICAL FAILURE</p>
                        <p className="text-white text-2xl">FINAL SCORE: {score}</p>
                        <p className="text-gray-400 text-sm">High Score: {highScore}</p>
                    </div>
                )}

                <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-green-600 text-black font-bold font-mono text-xl hover:bg-green-500 hover:scale-105 transition-all border-2 border-white"
                >
                    {gameOver ? "RETRY MISSION" : "INITIATE LAUNCH"}
                </button>
            </div>
        )}

        {/* CSS FOR BACKGROUND LOOP */}
        <style jsx>{`
            @keyframes infiniteScroll {
                from { transform: translateY(0); }
                to { transform: translateY(-100vh); } 
            }
            .loop-track {
                display: flex;
                flex-direction: column;
                width: 100%;
                animation: infiniteScroll 5s linear infinite; /* Fast speed for racing feel */
            }
            .loop-image {
                width: 100%;
                height: 100vh;
                object-fit: cover;
                display: block;
                margin-bottom: -1px;
            }
        `}</style>
    </div>
  );
}
