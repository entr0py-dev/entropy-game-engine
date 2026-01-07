"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";

// CRITICAL: Matches your 2912px image width exactly
const TILE_WIDTH = "2912px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  // 5 LANES: -2, -1, 0, 1, 2
  const [lane, setLane] = useState(0); 
  
  const mainRef = useRef<HTMLElement>(null);

  // Speed Curve
  const calculateSpeed = () => {
    if (!isPlaying) return "0s";
    const maxSpeed = 1.0; 
    const minSpeed = 4.0;
    const decay = Math.min(1, score / 5000); 
    const current = minSpeed - (decay * (minSpeed - maxSpeed));
    return `${current}s`;
  };
  const animationDuration = calculateSpeed();

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
          setLane(prev => Math.max(prev - 1, -2)); 
        }
        if (e.key === "ArrowRight" || e.key === "d") {
          setLane(prev => Math.min(prev + 1, 2));  
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  // --- SCORE LOOP ---
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
      backgroundSize: `${TILE_WIDTH} auto`, 
      backgroundRepeat: "repeat-x",
      backgroundPosition: "left bottom", // Anchors image to the bottom (road level)

      willChange: "background-position", 
      animation: side === 'left' 
        ? `moveWallLeft ${animationDuration} linear infinite`
        : `moveWallRight ${animationDuration} linear infinite`,

      // TRANSFORM (ALIGNMENT FIX):
      // 1. translateY(-50%): Centers the wall vertically roughly around the horizon.
      // 2. translateZ(-65vw): Pushes walls out to the side to match the wider road.
      transform: `
        translate(-50%, -50%) 
        rotateY(${side === 'left' ? '90deg' : '-90deg'}) 
        translateZ(-65vw)
      `,
      
      backfaceVisibility: "hidden",
      filter: "brightness(0.9)" 
  });

  return (
    <main 
        ref={mainRef}
        tabIndex={0} 
        onClick={startGame} 
        style={{ 
            width: "100vw", height: "100vh", position: "relative", 
            overflow: "hidden", outline: "none", userSelect: "none",
            background: "black" 
        }}
    >
      {/* ========================================================
          VISUAL ENGINE
         ======================================================== */}
      <div style={{
          position: "absolute", inset: 0,
          perspective: "300px", 
          
          // CRITICAL FIX: HIGH HORIZON
          // 25% moves the vanishing point UP. This makes the floor take up 
          // the bottom 75% of the screen, solving the "floor too low" issue.
          perspectiveOrigin: "50% 25%",
          
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

        {/* ROAD (WIDE & HIGH) */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            // 300vw WIDTH: Ensures the road extends past the bottom corners of the screen.
            width: "300vw", 
            height: "800vh",
            backgroundColor: "#222",
            
            // 5-LANE MARKINGS (Centered)
            // We use a gradient that focuses the lanes in the center 100vw
            // leaving the outer edges as "sidewalk" or empty space.
            backgroundImage: `
                linear-gradient(to right, 
                    transparent 30%, 
                    rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.4) 30.5%, transparent 30.5%,
                    transparent 39.5%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.4) 40.5%, transparent 40.5%,
                    transparent 49.5%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.4) 50.5%, transparent 50.5%,
                    transparent 59.5%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0.4) 60.5%, transparent 60.5%,
                    transparent 70%
                ),
                repeating-linear-gradient(to bottom, #333 0, #333 20px, #222 20px, #222 40px)
            `,
            backgroundSize: "100% 100%, 100% 40px",
            
            // TRANSFORM FIX:
            // translateZ(10vh): Lifts the floor UP towards the camera.
            // rotateX(90deg): Flattens it.
            transform: "translate(-50%, -50%) rotateX(90deg) translateZ(10vh)",
            
            animation: `moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite`,
            
            // FOG MASK
            maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 95%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 95%)"
        }} />

        {/* LEFT WALL */}
        <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />

        {/* RIGHT WALL */}
        <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        {/* DISTANCE FOG */}
        <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 50% 25%, transparent 10%, #000 80%)",
            zIndex: 10
        }} />
      </div>

      {/* ========================================================
          UI & SHIP
         ======================================================== */}
      
      {/* SHIP */}
      <div style={{
            position: "absolute", bottom: "10%", left: "50%",
            // LANE MOVEMENT: Adjusted multiplier (30vw) to match the wider 300vw road.
            transform: `translateX(-50%) translateX(${lane * 30}vw)`, 
            transition: "transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)", 
            zIndex: 50, pointerEvents: "none"
      }}>
        {/* Glow */}
        <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "120px", height: "120px", background: "radial-gradient(circle, rgba(0,255,153,0.3) 0%, transparent 70%)"
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
