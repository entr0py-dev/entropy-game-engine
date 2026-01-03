"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "@/context/GameStateContext";

// --- CONFIG ---
const OBSTACLE_SPAWN_RATE = 50;
const INITIAL_SPEED = 0.5;
const MAX_SPEED = 2.0;

export default function FlyerRunner() {
  const { session } = useGameState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- REFS ---
  const reqRef = useRef<number>(0);
  const playerX = useRef(50); 
  const gameSpeed = useRef(INITIAL_SPEED);
  const frameCount = useRef(0);
  const obstacles = useRef<{ id: number; x: number; y: number; z: number; type: 'block' | 'coin' }[]>([]);
  const tunnelZ = useRef(0); // Position of the texture scroll

  // --- MOUSE CONTROL ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    const xPercent = (e.clientX / window.innerWidth) * 100;
    playerX.current = Math.max(10, Math.min(90, xPercent));
  }, [isPlaying]);

  // --- ENGINE LOOP ---
  const update = useCallback(() => {
    if (!isPlaying) return;
    frameCount.current++;
    
    // 1. SCROLL THE TUNNEL TEXTURE
    // We move the background-position-x to simulate moving forward
    gameSpeed.current = Math.min(MAX_SPEED, gameSpeed.current + 0.0002);
    tunnelZ.current -= (20 * gameSpeed.current); 

    // 2. SPAWN OBJECTS
    if (frameCount.current % Math.floor(OBSTACLE_SPAWN_RATE / gameSpeed.current) === 0) {
      obstacles.current.push({
        id: Date.now(),
        x: (Math.random() * 60) - 30, // -30 to 30
        y: (Math.random() * 20) - 10, 
        z: 2000, // Spawn far away
        type: Math.random() > 0.8 ? 'coin' : 'block'
      });
    }

    // 3. MOVE OBJECTS
    obstacles.current.forEach(obs => obs.z -= (15 * gameSpeed.current));
    obstacles.current = obstacles.current.filter(obs => obs.z > -200);

    // 4. COLLISION
    const playerGameX = (playerX.current - 50) * 0.8; 
    obstacles.current.forEach(obs => {
        if (obs.z < 50 && obs.z > -50) { // Crossing player plane
             if (Math.abs(obs.x - playerGameX) < 10) {
                  if (obs.type === 'coin') {
                      obs.z = -999;
                      setScore(s => s + 50);
                  } else {
                      endGame();
                  }
             }
        }
    });

    setScore(s => s + 1);
    reqRef.current = requestAnimationFrame(update);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) reqRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isPlaying, update]);

  // --- ACTIONS ---
  const startGame = () => {
    setScore(0);
    setGameOver(false);
    obstacles.current = [];
    gameSpeed.current = INITIAL_SPEED;
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
        className="game-viewport"
        onMouseMove={handleMouseMove}
    >
        {/* --- 3D SCENE --- */}
        <div className="scene-3d">
            
            {/* 1. LEFT WALL (The Image) */}
            <div 
                className="wall left-wall"
                style={{ backgroundPositionX: `${tunnelZ.current}px` }} // Animate horizontal scroll
            />

            {/* 2. RIGHT WALL (Mirrored Image) */}
            <div 
                className="wall right-wall"
                style={{ backgroundPositionX: `${tunnelZ.current}px` }} // Animate horizontal scroll
            />

            {/* 3. FLOOR (Wireframe Grid) */}
            <div className="floor-plane">
                <div 
                    className="floor-grid"
                    style={{ backgroundPositionY: `${-tunnelZ.current}px` }} // Sync floor speed
                />
            </div>

            {/* 4. OBJECTS */}
            {obstacles.current.map(obs => (
                <div
                    key={obs.id}
                    className="game-object"
                    style={{
                        transform: `translate3d(${obs.x * 10}px, ${obs.y * 5}px, ${-obs.z}px)`,
                        borderColor: obs.type === 'coin' ? '#fbbf24' : '#ef4444',
                        background: obs.type === 'coin' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        borderRadius: obs.type === 'coin' ? '50%' : '2px',
                        boxShadow: obs.type === 'coin' ? '0 0 20px #fbbf24' : '0 0 20px #ef4444'
                    }}
                >
                    {obs.type === 'coin' ? '$' : 'X'}
                </div>
            ))}

            {/* 5. FOG (Hides the end) */}
            <div className="fog-overlay" />
        </div>


        {/* --- HUD --- */}
        <div className="hud-layer">
            {/* Player Ship */}
            <div 
                className="player-ship"
                style={{
                    left: `${playerX.current}%`,
                    transform: `translateX(-50%) rotate(${(playerX.current - 50) * 0.4}deg)`
                }}
            >
                <div className="engine-glow" />
            </div>

            <div className="score">SCORE: {score.toString().padStart(6, '0')}</div>

            {!isPlaying && (
                <div className="menu">
                     <h1 className="title">DATA_RUNNER</h1>
                     <button onClick={startGame} className="btn">
                        {gameOver ? "RETRY" : "START"}
                     </button>
                </div>
            )}
        </div>

        <style jsx>{`
            .game-viewport {
                width: 100vw;
                height: 100vh;
                background: #000;
                overflow: hidden;
                perspective: 600px; /* CAMERA DEPTH */
            }

            .scene-3d {
                width: 100%;
                height: 100%;
                position: relative;
                transform-style: preserve-3d;
            }

            /* --- WALLS --- */
            .wall {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 4000px; /* Long wall length */
                
                /* TEXTURE MAPPING */
                background-image: url('/assets/city_loop.png');
                background-repeat: repeat-x; /* Tile horizontally */
                background-size: auto 100%; /* Keep height 100%, let width scale naturally */
                
                backface-visibility: visible;
                opacity: 0.8;
                border-bottom: 2px solid #00ff00; /* Neon baseline */
            }

            .left-wall {
                left: 0;
                transform-origin: left center;
                /* Rotate 90deg to face center */
                transform: rotateY(90deg);
            }

            .right-wall {
                right: 0;
                transform-origin: right center;
                /* Rotate -90deg to face center */
                transform: rotateY(-90deg) scaleX(-1); /* Mirror texture */
            }

            /* --- FLOOR --- */
            .floor-plane {
                position: absolute;
                bottom: -20%; /* Lower floor slightly for better view */
                left: -50%;
                width: 200%;
                height: 100%;
                transform: rotateX(90deg);
                transform-origin: bottom center;
                background: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%);
                pointer-events: none;
            }

            .floor-grid {
                width: 100%;
                height: 4000px;
                background: 
                    linear-gradient(90deg, transparent 0%, rgba(0,255,0,0.2) 1px, transparent 2px),
                    linear-gradient(180deg, transparent 0%, rgba(0,255,0,0.2) 1px, transparent 2px);
                background-size: 100px 100px;
            }

            /* --- OBJECTS --- */
            .game-object {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 60px; height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: monospace;
                font-weight: bold;
                font-size: 24px;
                transform-style: preserve-3d;
            }

            .fog-overlay {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle, transparent 30%, black 90%);
                pointer-events: none;
                z-index: 10;
            }

            /* --- HUD --- */
            .hud-layer { position: absolute; inset: 0; pointer-events: none; z-index: 20; }
            
            .player-ship {
                position: absolute;
                bottom: 80px;
                width: 0; height: 0;
                border-left: 20px solid transparent;
                border-right: 20px solid transparent;
                border-bottom: 50px solid #00ff00;
                filter: drop-shadow(0 0 10px #00ff00);
            }

            .engine-glow {
                position: absolute;
                top: 50px; left: -10px;
                width: 20px; height: 10px;
                background: cyan;
                filter: blur(5px);
            }

            .score {
                position: absolute; top: 20px; left: 20px;
                color: #00ff00; font-family: monospace; font-size: 24px;
                text-shadow: 0 0 10px #00ff00;
            }

            .menu {
                position: absolute; inset: 0;
                background: rgba(0,0,0,0.8);
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                pointer-events: auto;
            }

            .title {
                color: #00ff00; font-family: monospace; font-size: 4rem;
                margin-bottom: 2rem; text-shadow: 0 0 20px rgba(0,255,0,0.5);
            }

            .btn {
                background: transparent; border: 2px solid #00ff00;
                color: #00ff00; padding: 1rem 3rem; font-family: monospace;
                font-size: 1.5rem; cursor: pointer; transition: 0.2s;
            }
            .btn:hover { background: #00ff00; color: black; box-shadow: 0 0 30px #00ff00; }
        `}</style>
    </div>
  );
}
