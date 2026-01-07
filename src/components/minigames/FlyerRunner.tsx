"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";

// TILE_WIDTH: 728px (Scaled 25% for retro crispness)
const TILE_WIDTH = "728px"; 

// GAMEPLAY CONFIG
const SPAWN_DISTANCE = -5000; 
const DESPAWN_Z = 200; 

interface GameItem {
  id: number;
  lane: number; 
  z: number;    
  type: 'BARRIER' | 'COIN';
  active: boolean;
}

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lane, setLane] = useState(0); 
  const [gameOver, setGameOver] = useState(false);
  
  const [items, setItems] = useState<GameItem[]>([]);
  
  const mainRef = useRef<HTMLElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const speedRef = useRef(0); 

  // --- INITIALIZE POOL ---
  useEffect(() => {
    const initialItems: GameItem[] = [];
    for (let i = 0; i < 15; i++) {
      initialItems.push({
        id: i,
        lane: Math.floor(Math.random() * 5) - 2, 
        z: SPAWN_DISTANCE - (i * 500), // Spaced out further for slower speed
        type: Math.random() > 0.7 ? 'BARRIER' : 'COIN',
        active: true
      });
    }
    setItems(initialItems);
  }, []);

  // SPEED CURVE FIX:
  // Slower Start (2.0s), Slower Max (0.5s), Longer Ramp (15000 points)
  const calculateAnimationSpeed = () => {
    if (!isPlaying) return "0s";
    const maxSpeed = 0.5; 
    const minSpeed = 2.0; 
    const decay = Math.min(1, score / 15000); 
    const current = minSpeed - (decay * (minSpeed - maxSpeed));
    return `${current}s`;
  };
  
  // LOGIC SPEED (Pixels per frame) - Synced to Animation
  const updateLogicSpeed = () => {
    // These numbers are tuned to match the visual "2.0s to 0.5s" loop
    const maxPx = 40; 
    const minPx = 10; 
    const decay = Math.min(1, score / 15000); 
    speedRef.current = minPx + (decay * (maxPx - minPx));
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
        z: SPAWN_DISTANCE - (i * 500),
        active: true
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

          if (newZ > DESPAWN_Z) {
            newZ = SPAWN_DISTANCE; 
            newLane = Math.floor(Math.random() * 5) - 2; 
            newType = Math.random() > 0.8 ? 'BARRIER' : 'COIN'; 
            newActive = true; 
          }

          // Collision Box: Z +/- 60px covers the ship depth
          if (newActive && newZ > -60 && newZ < 60 && item.lane === lane) {
            if (item.type === 'BARRIER') {
              setGameOver(true);
              setIsPlaying(false);
            } else if (item.type === 'COIN') {
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
  }, [isPlaying, gameOver, lane]);

  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [isPlaying, gameOver]);

  // --- STYLES ---
  const getWallStyle = (img: string, side: 'left' | 'right'): React.CSSProperties => {
      const isLeft = side === 'left';
      return {
        position: "absolute", 
        bottom: "50%", 
        width: "50000px", 
        height: "500px", 
        backgroundImage: `url('${img}')`,
        imageRendering: "pixelated",
        backgroundSize: `${TILE_WIDTH} 100%`, 
        backgroundRepeat: "repeat-x",
        backgroundPosition: "left bottom", 
        willChange: "background-position", 
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
        backfaceVisibility: "visible", 
        filter: "brightness(0.95)"
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
          // CURVATURE RESTORED: High camera (20%) + Aggressive Tilt
          perspectiveOrigin: "50% 20%", 
          overflow: "hidden",
          pointerEvents: "none",
      }}>
        <style>
            {`
            @keyframes moveWallForward { from { background-position-x: 0px; } to { background-position-x: ${TILE_WIDTH}; } }
            @keyframes moveWallReverse { from { background-position-x: 0px; } to { background-position-x: -${TILE_WIDTH}; } }
            @keyframes moveRoad { from { background-position-y: 0px; } to { background-position-y: 80px; } }
            @keyframes spin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
            `}
        </style>

        {/* WORLD WRAPPER - CURVATURE */}
        <div style={{
            position: "absolute", inset: 0,
            transformStyle: "preserve-3d",
            // TILTED WORLD: 15deg creates the "Subway Surfers" horizon drop
            transform: "rotateX(15deg)" 
        }}>

            {/* ROAD */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                width: "50vw", height: "800vh",
                backgroundColor: "#333",
                backgroundImage: `
                    /* LANES: 5 Sections perfectly evenly spaced */
                    linear-gradient(90deg, 
                        transparent 19%, #fff 19%, #fff 21%, transparent 21%,
                        transparent 39%, #fff 39%, #fff 41%, transparent 41%,
                        transparent 59%, #fff 59%, #fff 61%, transparent 61%,
                        transparent 79%, #fff 79%, #fff 81%, transparent 81%
                    ),
                    /* KERBS */
                    linear-gradient(90deg, #fb0 0%, #fb0 2%, #000 2%, #000 4%, transparent 4%, transparent 96%, #000 96%, #000 98%, #fb0 98%, #fb0 100%),
                    /* ASPHALT */
                    repeating-linear-gradient(0deg, transparent 0px, transparent 40px, rgba(0,0,0,0.3) 40px, rgba(0,0,0,0.3) 80px)
                `,
                backgroundSize: "100% 80px, 100% 80px, 100% 80px",
                imageRendering: "pixelated",
                transform: "translate(-50%, -50%) rotateX(90deg)",
                animation: `moveRoad ${isPlaying ? calculateAnimationSpeed() : "0s"} linear infinite`, // Synced road speed
            }} />

            {/* WALLS */}
            <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />
            <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

            {/* OBJECTS */}
            {items.map((item) => {
              if (!item.active) return null;
              // ALIGNMENT FIX: 
              // Road is 50vw wide. 5 Lanes.
              // Lane Width = 10vw.
              // Center (Lane 0) is at 0 offset.
              // Lane -1 is -10vw, Lane 1 is +10vw.
              // This calculation is now EXACT matches to the visual lines.
              const xPos = item.lane * 10; 
              
              return (
                <div key={item.id} style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: "80px", height: "80px",
                    transform: `translate3d(calc(-50% + ${xPos}vw), -50%, ${item.z}px)`,
                    display: "flex", justifyContent: "center", alignItems: "flex-end",
                    willChange: "transform"
                }}>
                    {item.type === 'BARRIER' ? (
                        <div style={{
                            width: "100%", height: "60px",
                            background: "repeating-linear-gradient(45deg, #cc0000, #cc0000 10px, #ffffff 10px, #ffffff 20px)",
                            border: "4px solid black", boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                        }} />
                    ) : (
                        <div style={{
                            width: "40px", height: "40px",
                            background: "#FFD700", borderRadius: "50%", border: "4px solid #FFA500",
                            boxShadow: "0 0 15px #FFD700", animation: "spin 1s linear infinite"
                        }} />
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
                // ALIGNMENT MATCH:
                // Ship moves exactly 10vw per lane step.
                // This perfectly matches the object xPos logic above.
                transform: `translateX(-50%) translateX(${lane * 10}vw)`, 
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
