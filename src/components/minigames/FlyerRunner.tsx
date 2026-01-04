"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "@/context/GameStateContext";

// --- CONFIG ---
const OBSTACLE_SPAWN_RATE = 60; // Slower spawn since speed is lower
const INITIAL_SPEED = 0.5; // Reduced speed for testing
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
  
  // Scroll Position (0% to -50%)
  const scrollX = useRef(0);

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
    
    // 1. SCROLL ENGINE
    gameSpeed.current = Math.min(MAX_SPEED, gameSpeed.current + 0.0001); // Very slow acceleration
    
    // Move LEFT (negative X)
    // At speed 1.0, move 0.2% per frame
    scrollX.current -= (0.2 * gameSpeed.current);
    
    // Reset loop when we've scrolled past the first image width (-50% of the container)
    // The container holds 2 images, so 50% is exactly one full image width.
    if (scrollX.current <= -50) {
        scrollX.current += 50;
    }

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
    obstacles.current.forEach(obs => obs.z -= (20 * gameSpeed.current));
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
    gameSpeed.current = INITIAL_SPEED;
    playerX.current = 50;
    scrollX.current = 0;
    setIsPlaying(true);
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) setHighScore(score);
  };

  return (
    <div className="game-viewport" onMouseMove={handleMouseMove}>
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
                    {/* Track Container: Holds 2 images side-by-side. Width 200% relative to wall. */}
                    <div className="track-container" style={{ transform: `translate3d(${scrollX.current}%, 0, 0)` }}>
                        
                        {/* Image 1: Left Crop */}
                        <div className="image-panel">
                            <img src="/assets/city_loop.png" className="texture-img left-crop flipped-x" alt="" />
                        </div>
                        
                        {/* Image 2: Seamless Follower */}
                        <div className="image-panel">
                             <img src="/assets/city_loop.png" className="texture-img left-crop flipped-x" alt="" />
                        </div>
                    </div>
                </div>

                {/* === RIGHT WALL === */}
                <div className="wall right-wall">
                    <div className="track-container" style={{ transform: `translate3d(${scrollX.current}%, 0, 0)` }}>
                        
                        {/* Image 1: Right Crop */}
                        <div className="image-panel">
                            <img src="/assets/city_loop.png" className="texture-img right-crop flipped-x" alt="" />
                        </div>
                        
                        {/* Image 2: Seamless Follower */}
                        <div className="image-panel">
                             <img src="/assets/city_loop.png" className="texture-img right-crop flipped-x" alt="" />
                        </div>
                    </div>
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
                            opacity: obs.z > 2500 ? 0 : 1,
                            borderColor: obs.type === 'coin' ? '#fbbf24' : '#ef4444',
                            boxShadow: obs.type === 'coin' ? '0 0 20px #fbbf24' : '0 0 20px #ef4444',
                            borderRadius: obs.type === 'coin' ? '50%' : '2px'
                        }}
                    >
                        {obs.type === 'coin' ? '$' : 'X'}
                    </div>
                ))}
            </div>
            
            <div className="fog-overlay" />
        </div>

        {/* --- HUD --- */}
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
                /* RAISED SKYBOX: -250% Top makes the wall extend extremely high up */
                top: -250%; 
                bottom: -50%;
                width: 5000px; /* Depth into screen */
                background: #050505;
                backface-visibility: hidden; /* Fixes flickering */
                overflow: hidden; 
            }

            .left-wall {
                left: 0;
                transform-origin: left center;
                transform: rotateY(90deg);
                border-bottom: 2px solid #0f0;
            }

            .right-wall {
                right: 0;
                transform-origin: right center;
                transform: rotateY(-90deg);
                border-bottom: 2px solid #0f0;
            }

            /* --- TRACK CONTAINER --- */
            .track-container {
                display: flex; /* Horizontal Layout */
                width: 200%; /* Holds exactly 2 images */
                height: 100%;
                will-change: transform; /* Hint for GPU accel */
            }

            .image-panel {
                width: 50%; /* Each panel is 50% of container (100% of wall width) */
                height: 100%;
                position: relative;
                overflow: hidden; 
            }

            .texture-img {
                position: absolute;
                height: 100%; 
                width: 200%; /* Double width for cropping */
                max-width: none;
                /* Ensure no pixel gaps */
                display: block; 
                transform-style: preserve-3d;
            }

            /* --- CROP & FLIP --- */
            .left-crop { left: 0; }
            .right-crop { left: -100%; }
            .flipped-x { transform: scaleX(-1); }

            /* --- FLOOR & CEILING --- */
            .floor-plane {
                position: absolute; bottom: 0; left: -50%; width: 200%; height: 200%;
                transform-origin: bottom center; transform: rotateX(90deg);
                background: linear-gradient(rgba(0,0,0,0.9), #000);
                pointer-events: none;
            }
            .ceiling-plane {
                position: absolute; top: 0; left: -50%; width: 200%; height: 200%;
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
