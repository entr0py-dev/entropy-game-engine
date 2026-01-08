"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
const TILE_WIDTH = "728px"; 

// GAMEPLAY CONFIG
// Spawn closer so user sees them immediately
const SPAWN_DISTANCE = -2000; 
const DESPAWN_Z = 200; 

// MOVEMENT SPEEDS (Pixels per frame)
const MOVE_SPEED_START = 20; 
const MOVE_SPEED_MAX = 60;

// PATTERNS (0=Empty, 1=Barrier, 2=Entrobuck)
const PATTERNS: number[][] = [
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [2, 2, 2, 2, 2], // Money Row
    [1, 1, 0, 1, 1], // The "Gap"
    [0, 2, 0, 2, 0], 
];

interface GameItem {
  id: number;
  lane: number; 
  z: number;    
  type: 'BARRIER' | 'ENTROBUCK';
  active: boolean;
}

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lane, setLane] = useState(0); 
  const [gameOver, setGameOver] = useState(false);
  
  const [items, setItems] = useState<GameItem[]>([]);
  
  const mainRef = useRef<HTMLElement>(null);
  const requestRef = useRef<number>(0); 
  const lastTimeRef = useRef<number>(0);
  const speedRef = useRef(MOVE_SPEED_START); 
  
  const patternQueue = useRef<number[]>([]); 

  // --- PATTERN GENERATOR ---
  const getNextLaneFromPattern = useCallback(() => {
    if (patternQueue.current.length === 0) {
        const patternIndex = Math.floor(Math.random() * PATTERNS.length);
        const chunk = PATTERNS[patternIndex];
        chunk.forEach((val, index) => {
            const laneIndex = index - 2; 
            if (val === 1) patternQueue.current.push(laneIndex); 
            else if (val === 2) patternQueue.current.push(laneIndex + 100); 
        });
        patternQueue.current.push(99); 
        patternQueue.current.push(99); 
        patternQueue.current.push(99); 
    }
    return patternQueue.current.shift() ?? 99;
  }, []);

  // --- INITIALIZE POOL ---
  useEffect(() => {
    const initialItems: GameItem[] = [];
    // Initialize 20 items to ensure continuous flow
    for (let i = 0; i < 20; i++) {
      initialItems.push({
        id: i,
        lane: 0, 
        z: SPAWN_DISTANCE - (i * 300), 
        type: 'BARRIER',
        active: false 
      });
    }
    setItems(initialItems);
  }, []);

  // SPEED CALCULATION
  const calculateAnimationSpeed = () => {
    if (!isPlaying) return "0s";
    const maxSpeed = 0.5; 
    const minSpeed = 2.0; 
    const decay = Math.min(1, score / 15000); 
    const current = minSpeed - (decay * (minSpeed - maxSpeed));
    return `${current}s`;
  };
  
  const updateLogicSpeed = () => {
    const decay = Math.min(1, score / 15000); 
    speedRef.current = MOVE_SPEED_START + (decay * (MOVE_SPEED_MAX - MOVE_SPEED_START));
  };

  // --- CONTROLS ---
  const startGame = () => {
    if (!isPlaying && !gameOver) {
      console.log("🚀 STARTING ENGINE...");
      setIsPlaying(true);
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
      setTimeout(() => mainRef.current?.focus(), 10);
    } else if (gameOver) {
      setGameOver(false);
      setScore(0);
      setLane(0);
      setItems(prev => prev.map((item, i) => ({
        ...item,
        z: SPAWN_DISTANCE - (i * 300),
        active: false
      })));
      setIsPlaying(true);
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") startGame();
      if (isPlaying && !gameOver) {
        if (e.key === "ArrowLeft" || e.key === "a") setLane(p => Math.max(p - 1, -2)); 
        if (e.key === "ArrowRight" || e.key === "d") setLane(p => Math.min(p + 1, 2));  
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, gameOver]);

  // --- GAME LOOP ---
  const gameLoop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;

    if (deltaTime > 16) { 
      updateLogicSpeed();
      setScore(prev => prev + 1); 

      setItems(prevItems => {
        return prevItems.map(item => {
          let newZ = item.z + speedRef.current; 
          let newActive = item.active;
          let newLane = item.lane;
          let newType = item.type;

          // RECYCLE
          if (newZ > DESPAWN_Z) {
            newZ = SPAWN_DISTANCE; 
            const spawnData = getNextLaneFromPattern();
            if (spawnData === 99) {
                newActive = false; 
            } else if (spawnData >= 100) {
                newActive = true;
                newType = 'ENTROBUCK';
                newLane = spawnData - 100;
            } else {
                newActive = true;
                newType = 'BARRIER';
                newLane = spawnData;
            }
          }

          // COLLISION
          if (newActive && newZ > -60 && newZ < 60 && item.lane === lane) {
            if (item.type === 'BARRIER') {
              setGameOver(true);
              setIsPlaying(false);
            } else if (item.type === 'ENTROBUCK') {
              setScore(s => s + 500);
              newActive = false; 
            }
          }
          return { ...item, z: newZ, active: newActive, lane: newLane, type: newType };
        });
      });
      lastTimeRef.current = time;
    }
    if (isPlaying && !gameOver) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isPlaying, gameOver, lane, getNextLaneFromPattern]);

  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [isPlaying, gameOver]);

  // --- STYLES ---
  const getWallStyle = (img: string, side: 'left' | 'right'): React.CSSProperties => {
      const isLeft = side === 'left';
      return {
        position: "absolute", bottom: "50%", width: "50000px", height: "500px", 
        backgroundImage: `url('${img}')`, imageRendering: "pixelated",
        backgroundSize: `${TILE_WIDTH} 100%`, backgroundRepeat: "repeat-x",
        backgroundPosition: "left bottom", willChange: "background-position", 
        animation: isLeft 
            ? `moveWallForward ${calculateAnimationSpeed()} linear infinite`
            : `moveWallReverse ${calculateAnimationSpeed()} linear infinite`,
        ...(isLeft ? {
            right: "50%", marginRight: "25vw", transformOrigin: "right bottom",
            transform: "translateZ(1000px) rotateY(-90deg)"
        } : {
            left: "50%", marginLeft: "25vw", transformOrigin: "left bottom",
            transform: "translateZ(1000px) rotateY(90deg)"
        }),
        backfaceVisibility: "visible", filter: "brightness(0.95)"
      };
  };

  return (
    <main 
        ref={mainRef}
        tabIndex={0} 
        onClick={startGame} 
        style={{ 
            width: "100vw", height: "100vh", position: "relative", 
            overflow: "hidden", outline: "none", userSelect: "none",
            background: "#87CEEB" 
        }}
    >
      <div style={{
          position: "absolute", inset: 0,
          perspective: "300px", 
          // HIGH CAMERA + TILT = CURVATURE
          perspectiveOrigin: "50% 20%", 
          overflow: "hidden",
          pointerEvents: "none",
      }}>
        <style>
            {`
            @keyframes moveWallForward { from { background-position-x: 0px; } to { background-position-x: ${TILE_WIDTH}; } }
            @keyframes moveWallReverse { from { background-position-x: 0px; } to { background-position-x: -${TILE_WIDTH}; } }
            @keyframes moveRoad { from { background-position-y: 0px; } to { background-position-y: 80px; } }
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
            `}
        </style>

        {/* WORLD WRAPPER - TILTED */}
        <div style={{
            position: "absolute", inset: 0,
            transformStyle: "preserve-3d",
            transform: "rotateX(15deg)" 
        }}>

            {/* ROAD */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                width: "50vw", height: "800vh",
                backgroundColor: "#333",
                backgroundImage: `
                    linear-gradient(90deg, 
                        transparent 19%, #fff 19%, #fff 21%, transparent 21%,
                        transparent 39%, #fff 39%, #fff 41%, transparent 41%,
                        transparent 59%, #fff 59%, #fff 61%, transparent 61%,
                        transparent 79%, #fff 79%, #fff 81%, transparent 81%
                    ),
                    linear-gradient(90deg, #fb0 0%, #fb0 2%, #000 2%, #000 4%, transparent 4%, transparent 96%, #000 96%, #000 98%, #fb0 98%, #fb0 100%),
                    repeating-linear-gradient(0deg, transparent 0px, transparent 40px, rgba(0,0,0,0.3) 40px, rgba(0,0,0,0.3) 80px)
                `,
                backgroundSize: "100% 80px, 100% 80px, 100% 80px",
                imageRendering: "pixelated",
                transform: "translate(-50%, -50%) rotateX(90deg)",
                animation: `moveRoad ${isPlaying ? calculateAnimationSpeed() : "0s"} linear infinite`, 
            }} />

            {/* WALLS */}
            <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />
            <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

            {/* --- OBJECT LAYER --- */}
            {items.map((item) => {
              if (!item.active) return null;
              // ALIGNMENT FIX: 
              // Increased spreading from 10vw to 12.5vw to push outer lanes wider
              const xPos = item.lane * 12.5; 
              
              return (
                <div key={item.id} style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: "80px", height: "80px",
                    // Move Z forward to ensure visibility
                    transform: `translate3d(calc(-50% + ${xPos}vw), -50%, ${item.z}px)`,
                    display: "flex", justifyContent: "center", alignItems: "flex-end",
                    willChange: "transform",
                    transformStyle: "preserve-3d" // Ensure they render in 3D
                }}>
                    {item.type === 'BARRIER' ? (
                        <div style={{
                            width: "100%", height: "60px",
                            background: "repeating-linear-gradient(45deg, #cc0000, #cc0000 10px, #ffffff 10px, #ffffff 20px)",
                            border: "4px solid black", boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                        }} />
                    ) : (
                        // ENTROBUCK (Green Digital Bill)
                        <div style={{
                            width: "50px", height: "30px",
                            background: "#00ff99",
                            border: "2px solid #fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#000", fontWeight: "bold", fontSize: "12px", fontFamily: "monospace",
                            boxShadow: "0 0 10px #00ff99",
                            animation: "float 1s ease-in-out infinite"
                        }}>
                            $$$
                        </div>
                    )}
                </div>
              );
            })}
        </div>
      </div>

      {/* SHIP */}
      {!gameOver && (
          <div style={{
                position: "absolute", bottom: "10%", left: "50%",
                // ALIGNMENT FIX: 
                // Increased lane step to 12.5vw to match the objects/road
                transform: `translateX(-50%) translateX(${lane * 12.5}vw)`, 
                transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                zIndex: 50, pointerEvents: "none"
          }}>
            <div style={{
                position: "absolute", bottom: "-20px", left: "50%", transform: "translateX(-50%) scale(1, 0.3)",
                width: "80px", height: "80px", background: "black", borderRadius: "50%", opacity: 0.5,
                filter: "blur(8px)"
            }} />
            <div style={{ 
                width: "0", height: "0", 
                borderLeft: "30px solid transparent", 
                borderRight: "30px solid transparent",
                borderBottom: "80px solid #00ff99", 
                filter: "drop-shadow(0 0 10px #00ff99)"
            }} />
          </div>
      )}

      {/* UI */}
      <div style={{ position: "relative", zIndex: 100, height: "100%", pointerEvents: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px", color: "white", fontFamily: "monospace", textShadow: "1px 1px 2px #000" }}>
            <div>
                <span style={{ background: isPlaying ? "red" : "gray", padding: "2px 6px", marginRight: "10px", borderRadius: "4px" }}>
                  {isPlaying ? "LIVE" : "PAUSED"}
                </span> 
                SCORE: {score.toString().padStart(5, '0')}
            </div>
            <Link href="/" style={{ pointerEvents: "auto", textDecoration: "none" }}>
                <div style={{ background: "white", color: "black", padding: "4px 12px", border: "2px solid black", fontWeight: "bold", cursor: "pointer" }}>EXIT</div>
            </Link>
        </div>
        {(!isPlaying || gameOver) && (
            <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                textAlign: "center", color: "white", fontFamily: "monospace", pointerEvents: "none", width: "100%"
            }}>
                <h1 style={{ fontSize: "5rem", margin: "0 0 20px 0", textShadow: "4px 4px 0px #000", letterSpacing: "-2px" }}>
                    {gameOver ? "CRASHED!" : "CALL LANE"}
                </h1>
                <div className="animate-pulse" style={{ background: "black", color: gameOver ? "red" : "#00ff99", padding: "15px 30px", fontSize: "1.5rem", border: `2px solid ${gameOver ? "red" : "#00ff99"}`, display: "inline-block", boxShadow: `0 0 20px ${gameOver ? "red" : "#00ff99"}` }}>
                    {gameOver ? "SPACE TO RETRY" : "PRESS SPACE TO START"}
                </div>
            </div>
        )}
      </div>

      {!isPlaying && !gameOver && (
        <div style={{ position: "absolute", inset: 0, zIndex: 9999, cursor: "pointer" }} onClick={startGame} />
      )}
    </main>
  );
}
