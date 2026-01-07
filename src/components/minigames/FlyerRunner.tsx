"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
// Updated to .jpg as per your upload
const WALL_LEFT_IMG = "/texture_leeds_left_v3.jpg";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.jpg";

// EXACT dimensions from your file info (2912px width)
const TILE_WIDTH = "2912px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lane, setLane] = useState(0); // -2 to 2
  
  const mainRef = useRef<HTMLElement>(null);

  // SPEED CURVE: 
  // Starts at 3s (Walk), ramps to 0.8s (Sprint)
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

  // --- STYLE GENERATORS ---

  const getWallStyle = (img: string, side: 'left' | 'right'): React.CSSProperties => ({
      position: "absolute", 
      top: "50%", 
      left: "50%",
      
      // SIZE: Massive height (500vh) to ensure roofs go up forever
      // Width: 1000vw to buffer the loop
      width: "1000vw", 
      height: "500vh", 
      
      backgroundImage: `url('${img}')`,
      // PIXEL ART SETTINGS:
      imageRendering: "pixelated", // Crisp edges
      backgroundSize: `${TILE_WIDTH} auto`, // Preserve Aspect Ratio
      backgroundRepeat: "repeat-x",
      
      // ALIGNMENT:
      // Anchor the shop floor to the bottom of the container
      backgroundPosition: "left bottom", 

      willChange: "background-position", 
      animation: side === 'left' 
        ? `moveWallLeft ${animationDuration} linear infinite`
        : `moveWallRight ${animationDuration} linear infinite`,

      // PLACEMENT:
      // translateY(-100%): This aligns the BOTTOM of the wall div with the center of the screen.
      // translateZ(-50vw): Pushes walls apart to create the street width (100vw total).
      // rotateY: 90deg (Perfectly straight parallel walls)
      transform: `
        translate(-50%, -100%) 
        rotateY(${side === 'left' ? '90deg' : '-90deg'}) 
        translateZ(-50vw) 
      `,
      
      backfaceVisibility: "hidden",
      filter: "brightness(0.9)" // Slight dim for depth
  });

  return (
    <main 
        ref={mainRef}
        tabIndex={0} 
        onClick={startGame} 
        style={{ 
            width: "100vw", height: "100vh", position: "relative", 
            overflow: "hidden", outline: "none", userSelect: "none",
            background: "#87CEEB" // Sky Blue
        }}
    >
      {/* ========================================================
          VISUAL ENGINE CONTAINER
         ======================================================== */}
      <div style={{
          position: "absolute", inset: 0,
          perspective: "350px", // Standard FOV
          perspectiveOrigin: "50% 35%", // High Horizon (View from slightly above head height)
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

        {/* WORLD WRAPPER (The Curve Mechanic)
            We rotate this entire container on X to tilt the world "down" into the distance.
        */}
        <div style={{
            position: "absolute", inset: 0,
            transformStyle: "preserve-3d",
            transform: "rotateX(5deg)" // THE SUBWAY SURFERS CURVE TILT
        }}>

            {/* ROAD PLANE */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                width: "100vw", // Matches wall separation
                height: "800vh", // Long road
                backgroundColor: "#222",
                
                // 5 LANES = 4 DIVIDERS
                backgroundImage: `
                    linear-gradient(to right, 
                        transparent 19%, rgba(255,255,255,0.4) 20%, transparent 21%,
                        transparent 39%, rgba(255,255,255,0.4) 40%, transparent 41%,
                        transparent 59%, rgba(255,255,255,0.4) 60%, transparent 61%,
                        transparent 79%, rgba(255,255,255,0.4) 80%, transparent 81%
                    ),
                    repeating-linear-gradient(to bottom, #2a2a2a 0, #2a2a2a 20px, #222 20px, #222 40px)
                `,
                backgroundSize: "100% 100%, 100% 40px",
                imageRendering: "pixelated",

                // PLACEMENT:
                // rotateX(90deg): Flat floor relative to the world wrapper.
                // translateZ(0px): Sits exactly at the center axis.
                // The walls are anchored to this same axis (-100% Y), so they meet perfectly.
                transform: "translate(-50%, -50%) rotateX(90deg)",
                
                animation: `moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite`,
            }} />

            {/* WALLS */}
            <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />
            <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        </div>

        {/* HORIZON MASK (The "Fade Away")
            This sits ON TOP of the 3D world (in screen space) and masks the geometry 
            where it hits the horizon line, completing the curved illusion.
        */}
        <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, #87CEEB 0%, #87CEEB 35%, transparent 60%)",
            zIndex: 10
        }} />

      </div>

      {/* ========================================================
          UI & SHIP
         ======================================================== */}
      
      {/* SHIP */}
      <div style={{
            position: "absolute", bottom: "10%", left: "50%",
            // 100vw / 5 lanes = 20vw per lane step
            transform: `translateX(-50%) translateX(${lane * 20}vw)`, 
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
