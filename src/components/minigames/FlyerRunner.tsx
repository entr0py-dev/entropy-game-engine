"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
const TILE_WIDTH = "728px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lane, setLane] = useState(0); // -2 to 2
  
  const mainRef = useRef<HTMLElement>(null);

  // SPEED (Jog to Sprint)
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
        bottom: "50%", 
        width: "50000px", 
        height: "500px", 
        
        backgroundImage: `url('${img}')`,
        imageRendering: "pixelated",
        
        backgroundSize: `${TILE_WIDTH} 100%`, 
        backgroundRepeat: "repeat-x",
        backgroundPosition: "left bottom", 

        willChange: "background-position", 
        
        // DIRECTION FIX:
        // Left Wall: Uses standard forward animation.
        // Right Wall: Uses REVERSE animation because it is rotated 180 degrees relative to the left.
        animation: isLeft 
            ? `moveWallForward ${animationDuration} linear infinite`
            : `moveWallReverse ${animationDuration} linear infinite`,

        ...(isLeft ? {
            right: "50%",
            marginRight: "25vw", // 50vw Road Width / 2
            transformOrigin: "right bottom",
            transform: "translateZ(1000px) rotateY(-90deg)"
        } : {
            left: "50%",
            marginLeft: "25vw", 
            transformOrigin: "left bottom",
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
            /* LEFT WALL (Standard Slide) */
            @keyframes moveWallForward { 
                from { background-position-x: 0px; } 
                to { background-position-x: ${TILE_WIDTH}; } 
            }
            
            /* RIGHT WALL (Inverted Slide to match perspective) */
            @keyframes moveWallReverse { 
                from { background-position-x: 0px; } 
                to { background-position-x: -${TILE_WIDTH}; } 
            }

            /* ROAD ANIMATION (Moves the scanlines) */
            @keyframes moveRoad { 
                from { background-position-y: 0px; } 
                to { background-position-y: 80px; } 
            }
            `}
        </style>

        {/* WORLD WRAPPER */}
        <div style={{
            position: "absolute", inset: 0,
            transformStyle: "preserve-3d",
            transform: "rotateX(10deg)" 
        }}>

            {/* ROAD (8-BIT RETRO STYLE) */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                width: "50vw", 
                height: "800vh",
                
                // BASE ASPHALT COLOR
                backgroundColor: "#333",
                
                backgroundImage: `
                    /* 1. LANE MARKERS (Chunky White Dashes) */
                    linear-gradient(90deg, 
                        transparent 19%, #fff 19%, #fff 21%, transparent 21%,
                        transparent 39%, #fff 39%, #fff 41%, transparent 41%,
                        transparent 59%, #fff 59%, #fff 61%, transparent 61%,
                        transparent 79%, #fff 79%, #fff 81%, transparent 81%
                    ),
                    
                    /* 2. YELLOW CURBS (Arcade Style Borders) */
                    linear-gradient(90deg, 
                        #fb0 0%, #fb0 2%, #000 2%, #000 4%, transparent 4%, 
                        transparent 96%, #000 96%, #000 98%, #fb0 98%, #fb0 100%
                    ),

                    /* 3. ASPHALT SCANLINES (Repeating horizontal bars for speed feel) */
                    repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 40px,
                        rgba(0,0,0,0.3) 40px,
                        rgba(0,0,0,0.3) 80px
                    )
                `,
                
                // SIZE: 
                // Layer 1 (Lanes) = 100% Width
                // Layer 2 (Curbs) = 100% Width
                // Layer 3 (Scanlines) = 80px tall pattern
                backgroundSize: "100% 80px, 100% 80px, 100% 80px",
                
                imageRendering: "pixelated",

                transform: "translate(-50%, -50%) rotateX(90deg)",
                
                // ROAD MOVEMENT
                animation: `moveRoad ${isPlaying ? "0.3s" : "0s"} linear infinite`,
            }} />

            {/* WALLS */}
            <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />
            <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        </div>
      </div>

      {/* SHIP & HUD */}
      <div style={{
            position: "absolute", bottom: "10%", left: "50%",
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
