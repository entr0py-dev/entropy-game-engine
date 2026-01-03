"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameState } from "@/context/GameStateContext";

// --- CONFIG ---
const OBSTACLE_SPAWN_RATE = 80;
const GAME_SPEED_START = 1.0;
const MAX_BANK_ANGLE = 25; // How much the world tilts (Degrees)

export default function FlyerRunner() {
  const { session } = useGameState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // --- REFS (Performance) ---
  const reqRef = useRef<number>(0);
  const playerX = useRef(50); // 0-100% position
  const bankAngle = useRef(0); // Current world tilt
  const obstacles = useRef<{ id: number; x: number; y: number; z: number; type: 'block' | 'coin' }[]>([]);
  const speedLines = useRef<{ id: number; x: number; y: number; speed: number }[]>([]);
  const frameCount = useRef(0);
  const gameSpeed = useRef(GAME_SPEED_START);

  // --- CONTROLS ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    // Map mouse X to 0-100 range
    const xPercent = (e.clientX / window.innerWidth) * 100;
    playerX.current = Math.max(10, Math.min(90, xPercent));
    
    // Calculate Banking Angle based on position (Center = 0, Left = -25, Right = 25)
    // We reverse it (-1) so moving left banks left
    bankAngle.current = ((playerX.current - 50) / 50) * -MAX_BANK_ANGLE;
  }, [isPlaying]);

  // --- GAME LOOP ---
  const update = useCallback(() => {
    if (!isPlaying) return;
    frameCount.current++;

    // 1. SPAWN OBSTACLES (Further away in Z-space)
    if (frameCount.current % Math.floor(OBSTACLE_SPAWN_RATE / gameSpeed.current) === 0) {
      obstacles.current.push({
        id: Date.now(),
        x: (Math.random() * 60) - 30, // X range: -30 to 30 (Center 0)
        y: (Math.random() * 20) - 10, // Y range: -10 to 10
        z: 1000, // Spawn far away
        type: Math.random() > 0.8 ? 'coin' : 'block'
      });
    }

    // 2. SPAWN SPEED LINES (For sensation of speed)
    if (frameCount.current % 2 === 0) {
        speedLines.current.push({
            id: Math.random(),
            x: (Math.random() * 200) - 100,
            y: (Math.random() * 200) - 100,
            speed: Math.random() * 20 + 30
        });
    }

    // 3. MOVE EVERYTHING
    gameSpeed.current += 0.0005;

    // Move Obstacles towards camera (Z decreases)
    obstacles.current.forEach(obs => {
        obs.z -= 10 * gameSpeed.current;
    });
    // Remove obstacles behind camera
    obstacles.current = obstacles.current.filter(obs => obs.z > -100);

    // Move Speed Lines
    speedLines.current.forEach(line => line.speed *= 1.05); // Accelerate lines
    speedLines.current = speedLines.current.filter(line => line.speed < 1000); // Life cycle check

    // 4. COLLISION (Simple 2D check when object is close "Z < 50")
    // Player is roughly at X: (playerX - 50)
    const playerGameX = (playerX.current - 50); // Convert 0-100 to -50 to 50
    
    obstacles.current.forEach(obs => {
        if (obs.z < 100 && obs.z > 0) { // Object is passing player
            // Check X proximity
            if (Math.abs(obs.x - playerGameX) < 10) {
                 if (obs.type === 'coin') {
                    obs.z = -500; // Hide
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
    speedLines.current = [];
    gameSpeed.current = GAME_SPEED_START;
    playerX.current = 50;
    bankAngle.current = 0;
    setIsPlaying(true);
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) setHighScore(score);
  };

  return (
    <div 
        className="w-full h-screen bg-black overflow-hidden relative cursor-none"
        onMouseMove={handleMouseMove}
        style={{ perspective: "600px" }} // The camera lens
    >
        {/* --- WORLD CONTAINER (Banks/Tilts) --- */}
        <div 
            className="world-container"
            style={{ 
                transform: `rotateZ(${bankAngle.current}deg)`
            }}
        >
            {/* 1. INFINITE WALLS */}
            {/* Left Wall (Mirrored) */}
            <div className="wall left-wall">
                <div className="texture-scroller" />
            </div>
            {/* Right Wall */}
            <div className="wall right-wall">
                 <div className="texture-scroller" />
            </div>
            {/* Floor Grid */}
            <div className="floor-grid" />

            {/* 2. SPEED LINES (Starfield) */}
            {isPlaying && speedLines.current.map(line => (
                <div 
                    key={line.id}
                    className="absolute bg-white rounded-full opacity-50"
                    style={{
                        left: '50%', top: '50%',
                        width: '2px', height: `${line.speed}px`,
                        transform: `translate(${line.x}vw, ${line.y}vh) rotate(0deg) translateZ(${line.speed * 2}px)`
                    }}
                />
            ))}

            {/* 3. OBSTACLES (3D Transformed) */}
            {obstacles.current.map(obs => (
                <div
                    key={obs.id}
                    className={`absolute flex items-center justify-center font-bold border-2 transition-opacity`}
                    style={{
                        left: '50%', top: '60%', // Horizon point
                        width: '80px', height: '80px',
                        // 3D Transform: Move X, Move Z (towards camera)
                        transform: `translateX(${obs.x * 10}px) translateY(0px) translateZ(${600 - obs.z}px)`,
                        opacity: obs.z < 1000 ? 1 : 0,
                        borderColor: obs.type === 'coin' ? '#fbbf24' : '#ef4444',
                        backgroundColor: obs.type === 'coin' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        boxShadow: obs.type === 'coin' ? '0 0 20px #fbbf24' : '0 0 20px #ef4444',
                        borderRadius: obs.type === 'coin' ? '50%' : '4px'
                    }}
                >
                    {obs.type === 'coin' ? '$' : 'X'}
                </div>
            ))}
        </div>

        {/* --- UI LAYER (Static, does not tilt) --- */}
        
        {/* PLAYER COCKPIT/RETICLE */}
        <div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-0 h-0 z-50 pointer-events-none transition-transform duration-75"
             style={{ 
                borderLeft: '20px solid transparent',
                borderRight: '20px solid transparent',
                borderBottom: '50px solid #00ff00',
                filter: 'drop-shadow(0 0 10px #00ff00)',
                // Slight counter-rotation to keep ship somewhat level while world banks
                transform: `translateX(-50%) rotate(${-bankAngle.current * 0.5}deg)`
            }}
        />
        
        {/* SCORE */}
        <div className="absolute top-4 left-4 font-mono text-green-500 text-xl z-50 text-shadow-glow">
            SCORE: {score.toString().padStart(6, '0')}
        </div>

        {/* MENU */}
        {!isPlaying && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] backdrop-blur-md">
                 <h1 className="text-6xl text-transparent bg-clip-text bg-gradient-to-t from-green-600 to-green-300 font-mono mb-2 tracking-widest text-shadow-glow italic">
                    DATA_RUNNER
                 </h1>
                 <p className="text-gray-400 font-mono mb-8 text-xs tracking-[0.5em]">INFINITE LOOP PROTOCOL</p>
                 
                 {gameOver && <div className="text-red-500 font-mono text-xl mb-4 blink">CRASH DETECTED - SCORE: {score}</div>}
                 
                 <button onClick={startGame} className="border border-green-500 text-green-500 px-12 py-4 font-mono text-xl hover:bg-green-500 hover:text-black transition-all shadow-[0_0_30px_rgba(0,255,0,0.3)]">
                    {gameOver ? "REBOOT SYSTEM" : "INITIALIZE"}
                 </button>
            </div>
        )}

        <style jsx>{`
            .world-container {
                position: absolute;
                inset: 0;
                transform-style: preserve-3d; /* Vital for 3D elements */
                transition: transform 0.1s ease-out; /* Smooth banking */
            }

            .wall {
                position: absolute;
                top: -50%; bottom: -50%; /* Tall walls */
                width: 400vh; /* Long walls */
                background: #000;
                transform-style: preserve-3d;
            }

            .left-wall {
                left: 0;
                /* Rotate 90deg to stand up, ScaleX -1 to flip texture (mirroring) */
                transform: translateX(-50%) rotateY(90deg) scaleX(-1);
                transform-origin: left center;
                border-bottom: 2px solid #00ff00; /* Neon floor line */
            }

            .right-wall {
                right: 0;
                transform: translateX(50%) rotateY(-90deg);
                transform-origin: right center;
                border-bottom: 2px solid #00ff00; /* Neon floor line */
            }

            .texture-scroller {
                width: 100%;
                height: 100%;
                /* Seamless texture settings */
                background-image: url('/assets/city_loop.png');
                background-size: auto 100%; 
                opacity: 0.6;
                /* The movement animation */
                animation: wallScroll 2s linear infinite;
            }

            .floor-grid {
                position: absolute;
                bottom: -50%; left: -50%; right: -50%; top: 50%;
                background: 
                    linear-gradient(transparent 0%, rgba(0,255,0,0.1) 1px, transparent 2px),
                    linear-gradient(90deg, transparent 0%, rgba(0,255,0,0.1) 1px, transparent 2px);
                background-size: 100px 100px;
                transform: rotateX(90deg);
                transform-origin: top center;
                animation: floorScroll 1s linear infinite;
            }

            @keyframes wallScroll {
                from { background-position: 0 0; }
                to { background-position: -100vh 0; } /* Move texture horizontally */
            }
             @keyframes floorScroll {
                from { transform: rotateX(90deg) translateY(0); }
                to { transform: rotateX(90deg) translateY(100px); }
            }

            .text-shadow-glow { text-shadow: 0 0 10px #0f0; }
            .blink { animation: blinker 1s linear infinite; }
            @keyframes blinker { 50% { opacity: 0; } }
        `}</style>
    </div>
  );
}
