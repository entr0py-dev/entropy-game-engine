"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "@/context/GameStateContext";

// --- CONFIG ---
const OBSTACLE_SPAWN_RATE = 40;
const MAX_SPEED = 3.0;

export default function FlyerRunner() {
  const { session } = useGameState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- REFS ---
  const reqRef = useRef<number>(0);
  const playerX = useRef(50); 
  const gameSpeed = useRef(1.0);
  const frameCount = useRef(0);
  const obstacles = useRef<{ id: number; x: number; y: number; z: number; type: 'block' | 'coin' }[]>([]);
  const tunnelY = useRef(0); 

  // --- MOUSE CONTROL ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    const xPercent = (e.clientX / window.innerWidth) * 100;
    playerX.current = Math.max(15, Math.min(85, xPercent));
  }, [isPlaying]);

  // --- ENGINE LOOP ---
  const update = useCallback(() => {
    if (!isPlaying) return;
    frameCount.current++;
    
    // 1. SCROLL (Move Forward)
    gameSpeed.current = Math.min(MAX_SPEED, gameSpeed.current + 0.0005);
    // Move 20px per frame, reset every 1000px (assuming seamless texture)
    tunnelY.current = (tunnelY.current + (20 * gameSpeed.current)) % 1024; 

    // 2. SPAWN OBJECTS
    if (frameCount.current % Math.floor(OBSTACLE_SPAWN_RATE / gameSpeed.current) === 0) {
      obstacles.current.push({
        id: Date.now(),
        x: (Math.random() * 80) - 40,
        y: (Math.random() * 30) - 15,
        z: 3000, 
        type: Math.random() > 0.8 ? 'coin' : 'block'
      });
    }

    // 3. MOVE OBJECTS
    obstacles.current.forEach(obs => obs.z -= (25 * gameSpeed.current));
    obstacles.current = obstacles.current.filter(obs => obs.z > -100);

    // 4. COLLISION
    const playerGameX = (playerX.current - 50) * 1.5; 
    obstacles.current.forEach(obs => {
        if (obs.z < 100 && obs.z > -50) { 
             if (Math.abs(obs.x - playerGameX) < 15) {
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
        className="game-viewport"
        onMouseMove={handleMouseMove}
    >
        <div className="scene-3d">
            
            {/* CAMERA RIG */}
            <div 
                className="camera-rig"
                style={{
                    transform: `
                        translateX(${-(playerX.current - 50) * 2}px) 
                        rotateZ(${-(playerX.current - 50) * 0.25}deg)
                    `
                }}
            >
                {/* === LEFT WALL === */}
                <div className="wall left-wall">
                    <div className="texture-container">
                        <div 
                            className="texture-layer"
                            style={{ 
                                backgroundImage: "url('/assets/city_loop.png')",
                                backgroundPositionX: '0%', // SHOW LEFT HALF
                                transform: `translateY(${tunnelY.current}px) scaleY(-1)` // SCROLL + FLIP VERTICAL
                            }}
                        />
                        {/* Second copy for seamless looping */}
                        <div 
                            className="texture-layer"
                            style={{ 
                                backgroundImage: "url('/assets/city_loop.png')",
                                backgroundPositionX: '0%', // SHOW LEFT HALF
                                transform: `translateY(${tunnelY.current - 1024}px) scaleY(-1)` // OFFSET BY 1024px
                            }}
                        />
                    </div>
                    <div className="wall-mask" />
                </div>

                {/* === RIGHT WALL === */}
                <div className="wall right-wall">
                    <div className="texture-container">
                        <div 
                            className="texture-layer"
                            style={{ 
                                backgroundImage: "url('/assets/city_loop.png')",
                                backgroundPositionX: '100%', // SHOW RIGHT HALF
                                transform: `translateY(${tunnelY.current}px) scaleY(-1)` // SCROLL + FLIP VERTICAL
                            }}
                        />
                        {/* Second copy for seamless looping */}
                         <div 
                            className="texture-layer"
                            style={{ 
                                backgroundImage: "url('/assets/city_loop.png')",
                                backgroundPositionX: '100%', // SHOW RIGHT HALF
                                transform: `translateY(${tunnelY.current - 1024}px) scaleY(-1)`
                            }}
                        />
                    </div>
                    <div className="wall-mask" />
                </div>

                {/* --- FLOOR & CEILING --- */}
                <div className="floor-plane" />
                <div className="ceiling-plane" />

                {/* --- OBJECTS --- */}
                {obstacles.current.map(obs => (
                    <div
                        key={obs.id}
                        className="game-object"
                        style={{
                            transform: `translate3d(${obs.x * 10}px, ${obs.y * 5}px, ${-obs.z}px)`,
                            opacity: obs.z > 2000 ? 0 : 1,
                            borderColor: obs.type === 'coin' ? '#fbbf24' : '#ef4444',
                            boxShadow: obs.type === 'coin' ? '0 0 15px #fbbf24' : '0 0 15px #ef4444',
                            borderRadius: obs.type === 'coin' ? '50%' : '2px'
                        }}
                    >
                        {obs.type === 'coin' ? '$' : 'X'}
                    </div>
                ))}
            </div>
            
            <div className="fog-overlay" />
        </div>

        {/* --- UI --- */}
        <div className="hud-layer">
            <div 
                className="reticle"
                style={{
                    left: `${playerX.current}%`,
                    transform: `translateX(-50%) rotate(${(playerX.current - 50) * 0.5}deg)`
                }}
            >
                <div className="engine-flame" />
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
                width: 100vw; height: 100vh;
                background: #000; overflow: hidden;
                perspective: 600px;
                cursor: none;
            }
            .scene-3d { width: 100%; height: 100%; transform-style: preserve-3d; }
            .camera-rig { width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.1s linear; }

            /* --- WALL GEOMETRY --- */
            .wall {
                position: absolute;
                top: -50%; bottom: -50%;
                width: 4000px; 
                background: #050505;
                backface-visibility: visible;
                overflow: hidden;
            }

            .left-wall {
                left: -50%; /* Push it wide */
                transform-origin: left center;
                transform: rotateY(90deg);
                border-bottom: 2px solid #0f0;
            }

            .right-wall {
                right: -50%; /* Push it wide */
                transform-origin: right center;
                transform: rotateY(-90deg);
                border-bottom: 2px solid #0f0;
            }

            /* --- TEXTURE HANDLING --- */
            .texture-container {
                width: 100%; height: 100%;
                position: relative;
            }

            .texture-layer {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 1024px; /* MUST MATCH TEXTURE HEIGHT or LOOP POINT */
                
                background-repeat: repeat-y;
                /* 200% Width: This ensures we crop exactly half the image */
                background-size: 200% 100%; 
                
                opacity: 0.8;
                will-change: transform;
            }

            .wall-mask {
                position: absolute; inset: 0;
                background: linear-gradient(to right, transparent 10%, #000 95%);
                pointer-events: none;
            }

            /* --- FLOOR & CEILING --- */
            .floor-plane {
                position: absolute; bottom: -20%; left: -50%; width: 200%; height: 200%;
                transform-origin: bottom center; transform: rotateX(90deg);
                background: linear-gradient(rgba(0,0,0,0.9), #000);
                pointer-events: none;
            }
            .ceiling-plane {
                position: absolute; top: -20%; left: -50%; width: 200%; height: 200%;
                transform-origin: top center; transform: rotateX(-90deg);
                background: #000;
                pointer-events: none;
            }

            /* --- OBJECTS --- */
            .game-object {
                position: absolute; top: 50%; left: 50%;
                width: 80px; height: 80px;
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: bold; font-family: monospace; font-size: 30px;
                transform-style: preserve-3d;
                backface-visibility: visible;
            }

            .fog-overlay {
                position: absolute; inset: 0;
                background: radial-gradient(circle, transparent 40%, black 90%);
                pointer-events: none; z-index: 10;
            }

            /* --- HUD --- */
            .hud-layer { position: absolute; inset: 0; z-index: 50; }
            .reticle {
                position: absolute; bottom: 80px; width: 0; height: 0;
                border-left: 20px solid transparent; border-right: 20px solid transparent;
                border-bottom: 50px solid #0f0; filter: drop-shadow(0 0 10px #0f0);
            }
            .engine-flame {
                 position: absolute; top: 50px; left: -10px; width: 20px; height: 40px;
                 background: cyan; filter: blur(8px);
            }
            .score { position: absolute; top: 20px; left: 20px; color: #0f0; font-family: monospace; font-size: 24px; }
            .menu {
                position: absolute; inset: 0; background: rgba(0,0,0,0.85);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                pointer-events: auto;
            }
            .title { color: #0f0; font-family: monospace; font-size: 4rem; margin-bottom: 2rem; }
            .btn {
                background: transparent; border: 2px solid #0f0; color: #0f0;
                padding: 1rem 3rem; font-family: monospace; font-size: 1.5rem;
                cursor: pointer;
            }
            .btn:hover { background: #0f0; color: black; }
        `}</style>
    </div>
  );
}
