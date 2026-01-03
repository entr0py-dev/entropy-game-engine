"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "@/context/GameStateContext";

// --- CONFIG ---
const OBSTACLE_SPAWN_RATE = 100;
const GAME_SPEED_INCREMENT = 0.0001;

export default function FlyerRunner() {
  const { session } = useGameState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const reqRef = useRef<number>(0);
  const playerX = useRef(50); 
  const obstacles = useRef<{ id: number; x: number; y: number; type: 'block' | 'coin' }[]>([]);
  const frameCount = useRef(0);
  const gameSpeed = useRef(1.0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    const xPercent = (e.clientX / window.innerWidth) * 100;
    // Limit player movement to the "safe zone" between walls (20% to 80%)
    playerX.current = Math.max(20, Math.min(80, xPercent));
  }, [isPlaying]);

  const update = useCallback(() => {
    if (!isPlaying) return;
    frameCount.current++;

    // 1. Spawn Obstacles (Only spawn in the center lane 20%-80%)
    if (frameCount.current % Math.floor(OBSTACLE_SPAWN_RATE / gameSpeed.current) === 0) {
      obstacles.current.push({
        id: Date.now(),
        x: Math.random() * 60 + 20, 
        y: -10, 
        type: Math.random() > 0.8 ? 'coin' : 'block'
      });
    }

    // 2. Game Loop Logic
    gameSpeed.current += GAME_SPEED_INCREMENT;
    obstacles.current.forEach(obs => obs.y += 0.5 * gameSpeed.current);
    obstacles.current = obstacles.current.filter(obs => obs.y < 120);

    // 3. Collision
    obstacles.current.forEach(obs => {
      if (obs.y > 80 && obs.y < 95 && Math.abs(obs.x - playerX.current) < 8) {
        if (obs.type === 'coin') {
            obs.y = 200; 
            setScore(prev => prev + 50);
        } else if (obs.type === 'block') {
            endGame();
        }
      }
    });

    setScore(prev => prev + 1);
    reqRef.current = requestAnimationFrame(update);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) reqRef.current = requestAnimationFrame(update);
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
        {/* --- 1. THE 3D CORRIDOR --- */}
        <div className="corridor-wrapper">
             
             {/* LEFT WALL */}
             <div className="wall left-wall">
                 <div className="wall-texture" />
             </div>

             {/* RIGHT WALL */}
             <div className="wall right-wall">
                 <div className="wall-texture" />
             </div>

             {/* FLOOR GRID (Wireframe) */}
             <div className="floor-grid" />
        </div>

        {/* --- 2. GAME OBJECTS --- */}
        <div 
            className="absolute bottom-[10%] w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[40px] border-b-green-500 z-50"
            style={{ 
                left: `${playerX.current}%`,
                transform: `translateX(-50%) rotate(${(playerX.current - 50) * 0.5}deg)`,
                filter: 'drop-shadow(0 0 10px #0f0)'
            }}
        />

        {obstacles.current.map(obs => (
            <div
                key={obs.id}
                className={`absolute z-40 flex items-center justify-center font-bold text-xs`}
                style={{
                    left: `${obs.x}%`,
                    top: `${obs.y}%`,
                    transform: `translate(-50%, -50%) scale(${0.2 + (obs.y / 100)})`, 
                    opacity: obs.y < 0 ? 0 : 1
                }}
            >
                {obs.type === 'coin' ? (
                     <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-white shadow-[0_0_15px_yellow]" />
                ) : (
                     <div className="w-12 h-12 bg-red-600 border-2 border-white shadow-[0_0_15px_red]" />
                )}
            </div>
        ))}

        {/* --- 3. UI --- */}
        <div className="absolute top-4 left-4 font-mono text-green-500 text-xl z-50">
            SCORE: {score.toString().padStart(6, '0')}
        </div>

        {!isPlaying && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] backdrop-blur-sm">
                 <h1 className="text-4xl text-green-500 font-mono mb-8 tracking-widest">DATA_RUNNER</h1>
                 <button onClick={startGame} className="border border-green-500 text-green-500 px-8 py-3 font-mono hover:bg-green-500 hover:text-black">
                    {gameOver ? "RETRY" : "START"}
                 </button>
            </div>
        )}

        <style jsx>{`
            .perspective-container {
                perspective: 400px;
                background: linear-gradient(to bottom, #000 0%, #111 100%);
            }

            .corridor-wrapper {
                position: absolute;
                inset: 0;
                transform-style: preserve-3d;
            }

            .wall {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 500vh; /* Make walls super long */
                background: #050505;
                transform-origin: center center;
            }

            /* IMPORTANT: These transforms create the "Trench" 
               Left Wall is rotated 90deg Y and pushed to the left.
               Right Wall is rotated -90deg Y and pushed to the right.
            */
            .left-wall {
                left: 0;
                transform: rotateY(90deg) translateX(-50%);
                transform-origin: left center;
            }

            .right-wall {
                right: 0;
                transform: rotateY(-90deg) translateX(50%);
                transform-origin: right center;
            }

            .wall-texture {
                width: 100%;
                height: 100%;
                background-image: url('/assets/city_loop.png');
                background-size: auto 100%;
                animation: slideWall 5s linear infinite;
                opacity: 0.5;
            }

            .floor-grid {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 50%;
                background: 
                    linear-gradient(transparent 0%, rgba(0,255,0,0.2) 100%),
                    linear-gradient(90deg, transparent 49%, rgba(0,255,0,0.1) 50%, transparent 51%);
                background-size: 100% 100%, 100px 100%;
                transform: rotateX(60deg);
                transform-origin: bottom center;
            }

            @keyframes slideWall {
                from { background-position: 0 0; }
                to { background-position: -100vh 0; }
            }
        `}</style>
    </div>
  );
}
