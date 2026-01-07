"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
const TILE_WIDTH = "2912px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lane, setLane] = useState(0); // -2 to 2
  
  const mainRef = useRef<HTMLElement>(null);

  // SPEED CURVE
  const calculateSpeed = () => {
    if (!isPlaying) return "0s";
    const maxSpeed = 0.8; 
    const minSpeed = 3.0;
    const decay = Math.min(1, score / 8000); 
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
        top: "50%",
        left: "50%",
        
        // DIMENSIONS:
        // Height: 250vh (Vertical coverage)
        // Width: 1000vw (Depth of tunnel)
        height: "250vh", 
        width: "1000vw", 
        
        backgroundImage: `url('${img}')`,
        imageRendering: "pixelated",
        
        // TEXTURE FIX: 
        // We force the width to TILE_WIDTH (2912px).
        // This prevents the "Giant Blurry Pixel" issue by ignoring the container width.
        backgroundSize: `${TILE_WIDTH} 100%`, 
        backgroundRepeat: "repeat-x",
        backgroundPosition: "left bottom", 

        willChange: "background-position", 
        animation: isLeft 
            ? `moveWallLeft ${animationDuration} linear infinite`
            : `moveWallRight ${animationDuration} linear infinite`,

        // PLACEMENT FIX (The Hinge Method):
        // 1. We position the DIV so it starts exactly at the road edge (+/- 30vw).
        // 2. We set the pivot point (transformOrigin) to that edge.
        // 3. We rotate 90 degrees back.
        
        // Left Wall: Positioned left of center (-30vw). Hinged on its RIGHT edge.
        // Right Wall: Positioned right of center (+30vw). Hinged on its LEFT edge.
        marginLeft: isLeft ? "-30vw" : "30vw", 
        transformOrigin: isLeft ? "right center" : "left center",
        
        transform: isLeft
            // Move -100% (its own width) to the left so its right edge touches the road
            ? `translate(-100%, -50%) rotateY(90deg)` 
            // Right wall starts at the road edge, so no X-translation needed
            : `translate(0%, -50%) rotateY(-90deg)`, 

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
      {/* ========================================================
          VISUAL ENGINE
         ======================================================== */}
      <div style={{
          position: "absolute", inset: 0,
          perspective: "300px", 
          // HIGH CAMERA: 20% height looks down at the road, emphasizing the curve.
          perspectiveOrigin: "50% 20%", 
          overflow: "hidden",
          pointerEvents: "none",
      }}>
        <style>
            {`
            @keyframes moveWallLeft { from { background-position-x: 0px; } to { background-position-x: -${TILE_WIDTH}; } }
            @keyframes moveWallRight { from { background-position-x: 0px; } to { background-position-x: ${TILE_WIDTH}; } }
            @keyframes moveRoad { from { background-position-y: 0px; } to { background-position-y: 200px; } }
            `}
        </style>

        {/* WORLD WRAPPER (The Curve Mechanic) */}
        <div style={{
            position: "absolute", inset: 0,
            transformStyle: "preserve-3d",
            // THE CURVE: 15deg tilt drops the horizon significantly.
            transform: "rotateX(15deg)" 
        }}>

            {/* ROAD */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                
                // ROAD WIDTH: 60vw
                width: "60vw", 
                
                height: "800vh",
                backgroundColor: "#222",
                
                // 5 LANES
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

                // GEOMETRY
                transform: "translate(-50%, -50%) rotateX(90deg)",
                
                animation: `moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite`,
            }} />

            {/* WALLS */}
            <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />
            <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        </div>

      </div>

      {/* ========================================================
          UI & SHIP
         ======================================================== */}
      
      {/* SHIP */}
      <div style={{
            position: "absolute", bottom: "10%", left: "50%",
            // MOVEMENT CALC:
            // Road is 60vw wide. 5 lanes.
            // 60 / 5 = 12vw per lane.
            transform: `translateX(-50%) translateX(${lane * 12}vw)`, 
            transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            zIndex: 50, pointerEvents: "none"
      }}>
        {/* Shadow */}
        <div style={{
            position: "absolute", bottom: "-20px", left: "50%", transform: "translateX(-50%) scale(1, 0.3)",
            width: "80px", height: "80px", background: "black", borderRadius: "50%", opacity: 0.5,
            filter: "blur(8px)"
        }} />
        {/* Ship Body */}
        <div style={{ 
            width: "0", height: "0", 
            borderLeft: "30px solid transparent", 
            borderRight: "30px solid transparent",
            borderBottom: "80px solid #00ff99", 
            filter: "drop-shadow(0 0 10px #00ff99)"
        }} />
      </div>

      {/* HUD */}
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
