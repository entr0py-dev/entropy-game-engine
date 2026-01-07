"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
// Ensure this matches your image width exactly to prevent skipping
const TILE_WIDTH = "3072px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [shipPosition, setShipPosition] = useState(0);
  
  const mainRef = useRef<HTMLElement>(null);
  const SHIP_SPEED = 10;
  
  // Slower loop (3s) helps smooth out the "skip" on high-res textures
  const animationDuration = isPlaying ? "3.0s" : "0s";

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
          setShipPosition(prev => Math.max(prev - SHIP_SPEED, -90));
        }
        if (e.key === "ArrowRight" || e.key === "d") {
          setShipPosition(prev => Math.min(prev + SHIP_SPEED, 90));
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
      
      // CONTAINER SIZE: 
      // 800vw = Wide enough to buffer the repeat
      // 150vh = Tall enough to hold the roofs without clipping, but not 800vh (which causes lag)
      width: "800vw", 
      height: "150vh", 
      
      backgroundImage: `url('${img}')`,
      
      // TEXTURE SIZING (The Fix for Stretching):
      // WIDTH = Fixed to TILE_WIDTH (3072px)
      // HEIGHT = 'auto'. This forces the browser to maintain the image's original aspect ratio.
      backgroundSize: `${TILE_WIDTH} auto`, 
      
      backgroundRepeat: "repeat-x",
      
      // ALIGNMENT: 
      // Align image to the BOTTOM of the container. 
      // We will then lift the container so the bottom sits on the road.
      backgroundPosition: "left bottom", 

      // ANIMATION
      willChange: "background-position", 
      animation: side === 'left' 
        ? `moveWallLeft ${animationDuration} linear infinite`
        : `moveWallRight ${animationDuration} linear infinite`,

      // TRANSFORM:
      // rotateY: Creates the corridor angle
      // translateZ(-100vw): Distance from center
      // translateY(-85%): This lifts the container up. 
      // Since background is aligned 'bottom', this places the "shop floor" near the road 
      // while the "roof" extends upwards into the 150vh space.
      transform: `translate(-50%, -85%) rotateY(${side === 'left' ? '90deg' : '-90deg'}) translateZ(-100vw)`,
      
      backfaceVisibility: "hidden",
      filter: "brightness(0.9)",

      // FOG MASK (Soft fade at ends)
      maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
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
          perspective: "500px", 
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

        {/* ROAD */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "300vw", height: "800vh",
            backgroundColor: "#111",
            backgroundImage: "repeating-linear-gradient(to bottom, #fff, #fff 50px, transparent 50px, transparent 100px)",
            backgroundSize: "20px 100%", backgroundPosition: "center top", backgroundRepeat: "repeat-y",
            transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-30vh)",
            animation: `moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite`,
            
            // Fade road into distance
            maskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)"
        }} />

        {/* LEFT WALL */}
        <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />

        {/* RIGHT WALL */}
        <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        {/* CENTER BLACK HOLE (Hides the exact vanishing point) */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "150px", height: "150px",
            background: "black",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 80px 80px black", // Increased softness
            zIndex: 5
        }} />

      </div>

      {/* ========================================================
          UI & SHIP
         ======================================================== */}
      
      {/* SHIP */}
      <div style={{
            position: "absolute", bottom: "15%", left: "50%",
            transform: `translateX(-50%) translateX(${shipPosition * 4}px)`, 
            transition: "transform 0.05s linear", zIndex: 50, pointerEvents: "none"
      }}>
        <div style={{ 
            width: "0", height: "0", 
            borderLeft: "20px solid transparent", 
            borderRight: "20px solid transparent",
            borderBottom: "60px solid #00ff99", 
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
