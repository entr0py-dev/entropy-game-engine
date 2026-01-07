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

  // SPEED CURVE (Logarithmic - Treatise Section 5.1)
  const calculateSpeed = () => {
    if (!isPlaying) return "0s";
    const maxSpeed = 1.0; 
    const minSpeed = 3.5;
    const decay = Math.min(1, score / 6000); 
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

  // --- 3D TRANSFORM GENERATOR ---
  const getWallStyle = (img: string, side: 'left' | 'right'): React.CSSProperties => ({
      position: "absolute", top: "50%", left: "50%",
      
      // CONTAINER: 400vh Height prevents top clipping
      width: "800vw", height: "400vh", 
      
      backgroundImage: `url('${img}')`,
      backgroundSize: `${TILE_WIDTH} auto`, 
      backgroundRepeat: "repeat-x",
      backgroundPosition: "left bottom", // Anchor to street level

      willChange: "background-position", 
      animation: side === 'left' 
        ? `moveWallLeft ${animationDuration} linear infinite`
        : `moveWallRight ${animationDuration} linear infinite`,

      // STREET ALIGNMENT TRANSFORM:
      // translateY(-50%): Centers the wall vertically. 
      //    Since the road is also centered, the "bottom" of the wall sits on the road.
      // translateZ(-40vw): PULLS WALLS IN TIGHT. This makes it feel like a real street.
      transform: `
        translate(-50%, -50%) 
        rotateY(${side === 'left' ? '90deg' : '-90deg'}) 
        translateZ(-40vw) 
      `,
      
      backfaceVisibility: "hidden",
      filter: "brightness(0.85)" 
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
          THE CURVED WORLD ENGINE
         ======================================================== */}
      <div style={{
          position: "absolute", inset: 0,
          perspective: "250px", // Aggressive perspective for speed feel
          perspectiveOrigin: "50% 40%", // Lowers camera slightly to look "forward" down the street
          overflow: "hidden",
          pointerEvents: "none",

          // --- THE CURVED HORIZON TRICK ---
          // Instead of a linear fade, we use a RADIAL mask at the top-center.
          // This creates a curved "terminator" line where the world drops away.
          maskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 80%)"
      }}>
        <style>
            {`
            @keyframes moveWallLeft { from { background-position-x: 0px; } to { background-position-x: -${TILE_WIDTH}; } }
            @keyframes moveWallRight { from { background-position-x: 0px; } to { background-position-x: ${TILE_WIDTH}; } }
            @keyframes moveRoad { from { background-position-y: 0px; } to { background-position-y: 200px; } }
            `}
        </style>

        {/* ROAD (140vw = Tight Street Width) */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "140vw", 
            height: "800vh",
            backgroundColor: "#222",
            
            // 5 LANES = 4 Lines
            backgroundImage: `
                linear-gradient(to right, 
                    transparent 19%, rgba(255,255,255,0.3) 20%, transparent 21%,
                    transparent 39%, rgba(255,255,255,0.3) 40%, transparent 41%,
                    transparent 59%, rgba(255,255,255,0.3) 60%, transparent 61%,
                    transparent 79%, rgba(255,255,255,0.3) 80%, transparent 81%
                ),
                repeating-linear-gradient(to bottom, #2a2a2a 0, #2a2a2a 20px, #222 20px, #222 40px)
            `,
            backgroundSize: "100% 100%, 100% 40px",
            
            // TILTED DOWNWARDS (Subway Surfers Curve)
            // rotateX(95deg) pushes the far end of the road "down" into the floor
            transform: "translate(-50%, -50%) rotateX(93deg) translateZ(-15vh)",
            
            animation: `moveRoad ${isPlaying ? "0.15s" : "0s"} linear infinite`,
        }} />

        {/* LEFT WALL */}
        <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />

        {/* RIGHT WALL */}
        <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        {/* --- SKY GRADIENT (Behind walls, fills the void) --- */}
        <div style={{
            position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
            background: "linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 50%, transparent 100%)",
            zIndex: -1
        }} />

      </div>

      {/* ========================================================
          UI & SHIP
         ======================================================== */}
      
      {/* SHIP */}
      <div style={{
            position: "absolute", bottom: "12%", left: "50%",
            // MOVEMENT: 140vw total width / 5 lanes = ~22vw per lane step
            transform: `translateX(-50%) translateX(${lane * 22}vw)`, 
            transition: "transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1.2)", // Snappy slide
            zIndex: 50, pointerEvents: "none"
      }}>
        {/* Shadow */}
        <div style={{
            position: "absolute", bottom: "-20px", left: "50%", transform: "translateX(-50%) scale(1, 0.3)",
            width: "80px", height: "80px", background: "black", borderRadius: "50%", opacity: 0.5,
            filter: "blur(10px)"
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
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px", color: "white", fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}>
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
