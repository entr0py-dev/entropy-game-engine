"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "@/context/GameStateContext";

// --- CONFIG ---
const OBSTACLE_SPAWN_RATE = 60;
const INITIAL_SPEED = 1.0;
const MAX_SPEED = 3.0;

export default function FlyerRunner() {
  const { session } = useGameState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- REFS ---
  const reqRef = useRef<number>(0);
  const playerX = useRef(50); // 0-100%
  const gameSpeed = useRef(INITIAL_SPEED);
  const frameCount = useRef(0);
  
  // 3D Arrays
  const obstacles = useRef<{ id: number; x: number; y: number; z: number; type: 'block' | 'coin' }[]>([]);
  const tunnelOffset = useRef(0); // For scrolling texture

  // --- MOUSE CONTROL (Banks the Camera) ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    const xPercent = (e.clientX / window.innerWidth) * 100;
    playerX.current = Math.max(10, Math.min(90, xPercent));
  }, [isPlaying]);

  // --- ENGINE LOOP ---
  const update = useCallback(() => {
    if (!isPlaying) return;
    frameCount.current++;
    
    // 1. SCROLL THE TUNNEL
    gameSpeed.current = Math.min(MAX_SPEED, gameSpeed.current + 0.0005);
    tunnelOffset.current = (tunnelOffset.current + (10 * gameSpeed.current)) % 1024; // Loop every 1024px (assuming texture size)

    // 2. SPAWN OBJECTS
    if (frameCount.current % Math.floor(OBSTACLE_SPAWN_RATE / gameSpeed.current) === 0) {
      obstacles.current.push({
        id: Date.now(),
        // Spawn X: -40 to 40 (0 is center)
        x: (Math.random() * 80) - 40,
        y: (Math.random() * 20) - 10, // Variation in height
        z: 2000, // Spawn Deep in the distance
        type: Math.random() > 0.8 ? 'coin' : 'block'
      });
    }

    // 3. MOVE OBJECTS
    obstacles.current.forEach(obs => obs.z -= (15 * gameSpeed.current));
    obstacles.current = obstacles.current.filter(obs => obs.z > -100);

    // 4. COLLISION
    // Player is effectively at Z=0, X=(playerX - 50) scaled
    const playerGameX = (playerX.current - 50) * 0.8; // Approximate scaling

    obstacles.current.forEach(obs => {
        if (obs.z < 100 && obs.z > 0) { // Passing player
             // Hitbox check
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
        {/* --- 3D SCENE CONTAINER --- */}
        <div className="scene-3d">
            
            {/* --- THE TUNNEL (Moves with Mouse Banking) --- */}
            <div 
                className="tunnel-assembly"
                style={{
                    // Rotate the whole world opposite to mouse to simulate banking
                    transform: `rotateZ(${-(playerX.current - 50) * 0.2}deg) translateX(${-(playerX.current - 50) * 0.5}px)`
                }}
            >
                {/* LEFT WALL */}
                <div className="wall left-wall">
                    <div 
                        className="wall-texture" 
                        style={{ backgroundPositionY: `${tunnelOffset.current}px` }}
                    />
                </div>

                {/* RIGHT WALL */}
                <div className="wall right-wall">
                    <div 
                        className="wall-texture" 
                        style={{ backgroundPositionY: `${tunnelOffset.current}px` }}
                    />
                </div>

                {/* FLOOR */}
                <div className="floor-plane">
                    <div 
                        className="floor-grid"
                        style={{ backgroundPositionY: `${tunnelOffset.current}px` }} 
                    />
                </div>

                {/* CEILING (Optional reflection) */}
                <div className="ceiling-plane" />
            
                {/* --- OBJECTS IN 3D SPACE --- */}
                {obstacles.current.map(obs => (
                    <div
                        key={obs.id}
                        className="game-object"
                        style={{
                            // CSS 3D Transform to place items in depth
                            transform: `translate3d(${obs.x * 10}px, ${obs.y * 5}px, ${-obs.z}px)`,
                            opacity: obs.z > 1500 ? 0 : 1, // Fade in
                            border: obs.type === 'coin' ? '2px solid yellow' : '2px solid red',
                            backgroundColor: obs.type === 'coin' ? 'rgba(255,255,0,0.2)' : 'rgba(255,0,0,0.2)',
                            borderRadius: obs.type === 'coin' ? '50%' : '0px',
                            boxShadow: obs.type === 'coin' ? '0 0 10px yellow' : '0 0 10px red'
                        }}
                    >
                        {obs.type === 'coin' ? '$' : 'X'}
                    </div>
                ))}

            </div>

            {/* --- FOG OVERLAY (Hides the end of the tunnel) --- */}
            <div className="fog-overlay" />

        </div>


        {/* --- UI (2D Overlay) --- */}
        <div className="hud-layer">
            
            {/* RETICLE / SHIP */}
            <div 
                className="ship-hud"
                style={{
                    left: `${playerX.current}%`,
                    transform: `translateX(-50%) rotate(${(playerX.current - 50) * 0.5}deg)`
                }}
            />

            <div className="score-display">SCORE: {score.toString().padStart(6, '0')}</div>

            {!isPlaying && (
                <div className="menu-overlay">
                     <h1 className="title">DATA_RUNNER_V1</h1>
                     <button onClick={startGame} className="start-btn">
                        {gameOver ? "RETRY SYSTEM" : "START ENGINE"}
                     </button>
                </div>
            )}
        </div>

        <style jsx>{`
            /* --- CORE VIEWPORT --- */
            .game-viewport {
                width: 100vw;
                height: 100vh;
                background: #000;
                overflow: hidden;
                cursor: none;
                perspective: 800px; /* The Camera Lens */
            }

            .scene-3d {
                width: 100%;
                height: 100%;
                position: relative;
                transform-style: preserve-3d;
            }

            .tunnel-assembly {
                width: 100%;
                height: 100%;
                position: absolute;
                transform-style: preserve-3d;
            }

            /* --- WALLS (The Critical Part) --- */
            .wall {
                position: absolute;
                top: -50%; /* Extend above/below viewport to prevent gaps */
                bottom: -50%;
                width: 10000px; /* VERY DEEP wall */
                background: #050505;
                backface-visibility: hidden; /* Performance */
            }

            .left-wall {
                left: 0;
                /* Hinge on the left edge of screen, rotate 90deg away */
                transform-origin: left center;
                transform: rotateY(90deg);
                border-bottom: 2px solid #00ff00;
            }

            .right-wall {
                right: 0;
                /* Hinge on the right edge of screen, rotate -90deg away */
                transform-origin: right center;
                transform: rotateY(-90deg);
                border-bottom: 2px solid #00ff00;
            }

            .wall-texture {
                width: 100%;
                height: 100%;
                background-image: url('/assets/city_loop.png');
                /* Rotate texture so lines flow horizontally down the tunnel */
                background-repeat: repeat;
                background-size: 512px 512px; /* Adjust based on image size */
                opacity: 0.5;
                transform: rotate(-90deg); /* Orient texture to flow down the tunnel */
                transform-origin: center;
            }

            /* --- FLOOR & CEILING --- */
            .floor-plane {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 10000px; /* Deep floor */
                transform-origin: bottom center;
                transform: rotateX(90deg);
            }
            
            .floor-grid {
                width: 100%;
                height: 100%;
                background: 
                    linear-gradient(90deg, transparent 0%, rgba(0,255,0,0.1) 1px, transparent 2px),
                    linear-gradient(180deg, transparent 0%, rgba(0,255,0,0.1) 1px, transparent 2px);
                background-size: 100px 100px;
            }

            /* --- OBJECTS --- */
            .game-object {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: monospace;
                font-weight: bold;
                /* Crucial: We translate objects in Z space */
                transform-style: preserve-3d;
            }

            /* --- FOG / ATMOSPHERE --- */
            .fog-overlay {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at center, transparent 20%, #000 90%);
                pointer-events: none;
                z-index: 10;
            }

            /* --- HUD --- */
            .hud-layer {
                position: absolute;
                inset: 0;
                z-index: 20;
                pointer-events: none;
            }

            .ship-hud {
                position: absolute;
                bottom: 100px;
                width: 0; height: 0;
                border-left: 20px solid transparent;
                border-right: 20px solid transparent;
                border-bottom: 50px solid #00ff00;
                filter: drop-shadow(0 0 15px #00ff00);
            }

            .score-display {
                position: absolute;
                top: 20px; left: 20px;
                color: #00ff00;
                font-family: monospace;
                font-size: 24px;
                text-shadow: 0 0 10px #00ff00;
            }

            .menu-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.8);
                pointer-events: auto;
            }

            .title {
                color: #00ff00;
                font-family: monospace;
                font-size: 4rem;
                margin-bottom: 2rem;
                text-shadow: 0 0 20px rgba(0,255,0,0.5);
            }

            .start-btn {
                background: transparent;
                border: 2px solid #00ff00;
                color: #00ff00;
                padding: 1rem 3rem;
                font-family: monospace;
                font-size: 1.5rem;
                cursor: pointer;
                transition: 0.2s;
            }
            .start-btn:hover {
                background: #00ff00;
                color: black;
                box-shadow: 0 0 30px #00ff00;
            }
        `}</style>
    </div>
  );
}
