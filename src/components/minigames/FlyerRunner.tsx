"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";

// TILE_WIDTH: 728px (Scaled for crisp look)
const TILE_WIDTH = "728px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lane, setLane] = useState(0); // -2 to 2
  
  const mainRef = useRef<HTMLElement>(null);

  // SPEED FIX:
  // Doubled the values to slow the loop down by half.
  // 1.0s = Start Speed (Jog)
  // 0.2s = Max Speed (Sprint)
  const calculateSpeed = () => {
    if (!isPlaying) return "0s";
    const maxSpeed = 0.2; 
    const minSpeed = 1.0;
    const decay = Math.min(1, score / 5000); 
    const current = minSpeed - (decay * (minSpeed - maxSpeed));
    return `${current}s`;
  };
  const animationDuration = calculateSpeed();

  // --- CONTROLS ---
  const startGame = () => {
    if (!isPlaying) {
      console.log("🚀 STARTING ENGINE...");
      setIsPlaying(true);
      setTimeout(() => mainRef.current?.focus(), 10);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isPlaying) startGame();
      if (isPlaying) {
        if (e.key === "ArrowLeft" || e.key === "a") setLane(p => Math.max(p - 1, -2)); 
        if (e.key === "ArrowRight" || e.key === "d") setLane(p => Math.min(p + 1, 2));  
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => setScore(prev => prev + 10), 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // --- WALL STYLE GENERATOR ---
  const getWallStyle = (img: string, side: 'left' | 'right'): React.CSSProperties => {
      const isLeft = side === 'left';
      
      return {
        position: "absolute", 
        bottom: "50%", // Safe Patch Alignment
        
        // DIMENSIONS:
        width: "50000px", 
        height: "500px", 
        
        backgroundImage: `url('${img}')`,
        imageRendering: "pixelated",
        
        backgroundSize: `${TILE_WIDTH} 100%`, 
        backgroundRepeat: "repeat-x",
        backgroundPosition: "left bottom", 

        willChange: "background-position", 
        
        animation: isLeft 
            ? `moveWallForward ${animationDuration} linear infinite`
            : `moveWallForward ${animationDuration} linear infinite`,

        // --- GEOMETRY & NARROWING FIX ---
        // Road Width = 50vw.
        // Wall Offset = 25vw (Half of 50vw).
        
        ...(isLeft ? {
            right: "50%",
            marginRight: "25vw", // Narrowed from 30vw
            transformOrigin: "right bottom",
            // Foreground fill: translateZ(1000px)
            transform: "translateZ(1000px) rotateY(-90deg)"
        } : {
            left: "50%",
            marginLeft: "25vw", // Narrowed from 30vw
            transformOrigin: "left bottom",
            // Foreground fill: translateZ(1000px)
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
          perspectiveOrigin: "50% 25%", 
          overflow: "hidden",
          pointerEvents: "none",
      }}>
        <style>
            {`
            @keyframes moveWallForward { 
                from { background-position-x: 0px; } 
                to { background-position-x: ${TILE_WIDTH}; } 
            }
            @keyframes moveRoad { 
                from { background-position-y: 0px; } 
                to { background-position-y: 200px; } 
            }
            `}
        </style>

        {/* WORLD WRAPPER */}
        <div style={{
            position: "absolute", inset: 0,
            transformStyle: "preserve-3d",
            transform: "rotateX(10deg)" // Safe Patch Curve
        }}>

            {/* ROAD */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                
                // WIDTH FIX: Narrowed from 60vw to 50vw
                width: "50vw", 
                
                height: "800vh",
                backgroundColor: "#222",
                
                backgroundImage: `
                    linear-gradient(to right, 
                        transparent 19%, rgba(255,255,255,0.5) 20%, transparent 21%,
                        transparent 39%, rgba(255,255,255,0.5) 40%, transparent 41%,
                        transparent 59%, rgba(255,255,255,0.5) 60%, transparent 61%,
                        transparent 79%, rgba(255,255,255,0.5) 80%, transparent 81%
                    ),
                    repeating-linear-gradient(to bottom, #2a2a2a 0, #2a2a2a 20px, #222 20px, #222 40px)
                `,
                backgroundSize: "100% 100%, 100% 40px",
                imageRendering: "pixelated",

                transform: "translate(-50%, -50%) rotateX(90deg)",
                animation: `moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite`,
            }} />

            {/* WALLS */}
            <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />
            <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        </div>
      </div>

      {/* SHIP & HUD */}
      <div style={{
            position: "absolute", bottom: "10%", left: "50%",
            // MOVEMENT FIX: 
            // 50vw / 5 lanes = 10vw per lane.
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

      <div style={{ position: "relative", zIndex: 100, height: "100%", pointerEvents: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px", color: "white", fontFamily: "monospace", textShadow: "1px 1px 2px #000" }}>
            <div>
                <span style={{ background: isPlaying ? "red" : "gray", padding: "2px 6px", marginRight: "10px", borderRadius: "4px" }}>
                  {isPlaying ? "LIVE" : "PAUSED"}
                </span> 
                SCORE: {score.toString().padStart(5, '0')}
            </div>
            <Link href="/" style={{ pointerEvents: "auto", textDecoration: "none" }}>
                <div style={{ background: "white", color: "black", padding: "4px 12px", border: "2px solid black", fontWeight: "bold", cursor: "pointer" }}>
                    EXIT
                </div>
            </Link>
        </div>
        {!isPlaying && (
            <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                textAlign: "center", color: "white", fontFamily: "monospace", pointerEvents: "none", width: "100%"
            }}>
                <h1 style={{ fontSize: "5rem", margin: "0 0 20px 0", textShadow: "4px 4px 0px #000", letterSpacing: "-2px" }}>
                    CALL LANE
                </h1>
                <div className="animate-pulse" style={{ background: "black", color: "#00ff99", padding: "15px 30px", fontSize: "1.5rem", border: "2px solid #00ff99", display: "inline-block", boxShadow: "0 0 20px #00ff99" }}>
                    CLICK TO START
                </div>
            </div>
        )}
      </div>

      {!isPlaying && (
        <div style={{
            position: "absolute", inset: 0, zIndex: 9999, cursor: "pointer"
        }} onClick={startGame} />
      )}
    </main>
  );
}
