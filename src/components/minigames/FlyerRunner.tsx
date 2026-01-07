"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";

// IMPORTANT: This must match your image width exactly to prevent skipping.
// Since we are scaling height to 100%, the width might scale dynamically.
// We use a large percent for movement to ensure smooth loops.
const TILE_WIDTH = "2048px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  // LANE SYSTEM: -2 (Far Left) to 2 (Far Right)
  // 0 is Center. 5 Lanes Total.
  const [lane, setLane] = useState(0); 
  
  const mainRef = useRef<HTMLElement>(null);
  const animationDuration = isPlaying ? "4s" : "0s"; // Slower loop for smoothness

  // --- GAME START ---
  const startGame = () => {
    if (!isPlaying) {
      console.log("🚀 STARTING ENGINE...");
      setIsPlaying(true);
      setTimeout(() => mainRef.current?.focus(), 10);
    }
  };

  // --- CONTROLS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isPlaying) startGame();

      if (isPlaying) {
        if (e.key === "ArrowLeft" || e.key === "a") {
          setLane(prev => Math.max(prev - 1, -2)); // Cap at Lane -2
        }
        if (e.key === "ArrowRight" || e.key === "d") {
          setLane(prev => Math.min(prev + 1, 2));  // Cap at Lane 2
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  // --- SCORE ---
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => setScore(prev => prev + 10), 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // --- WALL STYLE ---
  const getWallStyle = (img: string, side: 'left' | 'right'): React.CSSProperties => ({
      position: "absolute", 
      top: "50%", 
      left: "50%",
      
      // CONTAINER: Massive height to ensure roofs are never clipped
      width: "1000vw", 
      height: "400vh", 
      
      backgroundImage: `url('${img}')`,
      
      // FIX FOR CLIPPING & STRETCHING:
      // Height = 100% (Fills the 400vh container).
      // Width = Auto (Scales proportionally so buildings don't look fat/thin).
      backgroundSize: `auto 100%`, 
      
      backgroundRepeat: "repeat-x",
      backgroundPosition: "left bottom", // Anchor to road

      // ANIMATION
      willChange: "background-position", 
      animation: side === 'left' 
        ? `moveWallLeft ${animationDuration} linear infinite`
        : `moveWallRight ${animationDuration} linear infinite`,

      // TRANSFORM (The "Funnel" Perspective)
      transform: `
        translate(-50%, -55%) 
        rotateY(${side === 'left' ? '89deg' : '-89deg'}) 
        translateZ(-50vw)
      `,
      
      backfaceVisibility: "hidden",
      filter: "brightness(0.8)" // Slightly dark to blend with fog
  });

  return (
    <main 
        ref={mainRef}
        tabIndex={0} 
        onClick={startGame} 
        style={{ 
            width: "100vw", height: "100vh", position: "relative", 
            overflow: "hidden", outline: "none", userSelect: "none",
            background: "black" // PURE BLACK BACKGROUND (No Blue Vignette)
        }}
    >
      {/* ========================================================
          VISUAL ENGINE
         ======================================================== */}
      <div style={{
          position: "absolute", inset: 0,
          perspective: "300px", 
          overflow: "hidden",
          pointerEvents: "none"
      }}>
        <style>
            {`
            @keyframes moveWallLeft {
                from { background-position-x: 0px; }
                to { background-position-x: -${TILE_WIDTH}; } 
            }
            @keyframes moveWallRight {
                from { background-position-x: 0px; }
                to { background-position-x: ${TILE_WIDTH}; } 
            }
            @keyframes moveRoad {
                from { background-position-y: 0px; }
                to { background-position-y: 200px; } 
            }
            `}
        </style>

        {/* ROAD (5 LANES) */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "180vw", // Width to accommodate 5 lanes comfortably
            height: "800vh",
            backgroundColor: "#222",
            
            // 5 LANES = 4 DIVIDER LINES
            // We use a repeating gradient to draw the lines
            backgroundImage: `
                linear-gradient(to right, 
                    transparent 19%, rgba(255,255,255,0.3) 20%, transparent 21%,
                    transparent 39%, rgba(255,255,255,0.3) 40%, transparent 41%,
                    transparent 59%, rgba(255,255,255,0.3) 60%, transparent 61%,
                    transparent 79%, rgba(255,255,255,0.3) 80%, transparent 81%
                ),
                repeating-linear-gradient(to bottom, #333 0, #333 20px, #222 20px, #222 40px)
            `,
            backgroundSize: "100% 100%, 100% 40px",
            
            transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-25vh)",
            animation: `moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite`,
            
            // FOG MASK: Fades the road into the black background
            maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)"
        }} />

        {/* LEFT WALL */}
        <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />

        {/* RIGHT WALL */}
        <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        {/* DISTANCE FOG (Radial - Black Only) */}
        <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at center, transparent 20%, #000 90%)",
            zIndex: 10
        }} />
      </div>

      {/* ========================================================
          UI & SHIP
         ======================================================== */}
      
      {/* SHIP */}
      <div style={{
            position: "absolute", bottom: "10%", left: "50%",
            // Lane Calculation: Move 12vw per lane step
            transform: `translateX(-50%) translateX(${lane * 12}vw)`, 
            transition: "transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Bouncy snap
            zIndex: 50, pointerEvents: "none"
      }}>
        {/* Glow */}
        <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "100px", height: "100px", background: "radial-gradient(circle, rgba(0,255,153,0.4) 0%, transparent 70%)"
        }} />
        
        {/* Ship Model */}
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
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px", color: "white", fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}>
            <div>
                <span style={{ background: isPlaying ? "red" : "gray", padding: "2px 6px", marginRight: "10px" }}>
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
                <div style={{ marginTop: "20px", fontSize: "0.8rem", opacity: 0.7 }}>
                    Use Left/Right Arrows to Switch Lanes
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
