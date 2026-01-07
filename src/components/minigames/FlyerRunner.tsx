"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
// IMPORTANT: This number MUST match the exact pixel width of your image file.
// If your image is 2048px wide, change this to "2048px".
const TILE_WIDTH = "3072px"; 

const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [shipPosition, setShipPosition] = useState(0);
  
  const mainRef = useRef<HTMLElement>(null);
  const SHIP_SPEED = 10;
  
  // Slower duration (2s) = Smoother rendering. 
  // Fast movement (1s) on huge textures often causes frame drops.
  const animationDuration = isPlaying ? "2.0s" : "0s";

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

  // --- WALL STYLE GENERATOR ---
  const getWallStyle = (img: string, side: 'left' | 'right'): React.CSSProperties => ({
      position: "absolute", 
      top: "50%", 
      left: "50%",
      
      // SIZE: Massive container to prevent clipping
      width: "800vw", 
      height: "800vh", 
      
      backgroundImage: `url('${img}')`,
      
      // TEXTURE: Force height to 100% of container (800vh) to ensure full building visibility
      backgroundSize: `${TILE_WIDTH} 100%`, 
      backgroundRepeat: "repeat-x",
      backgroundPosition: "left center", // Center vertically

      // ANIMATION
      willChange: "background-position", // Force GPU acceleration for smoothness
      animation: side === 'left' 
        ? `moveWallLeft ${animationDuration} linear infinite`
        : `moveWallRight ${animationDuration} linear infinite`,

      // TRANSFORM
      // translateZ(-100vw): Distance from camera
      // rotateY: Angle for the tunnel effect
      transform: `translate(-50%, -50%) rotateY(${side === 'left' ? '90deg' : '-90deg'}) translateZ(-100vw)`,
      
      backfaceVisibility: "hidden",
      filter: "brightness(0.9)",

      // FOG MASK: This fades the far end of the wall to transparent
      // The mask makes the "left" and "right" edges of this massive div invisible,
      // effectively blending the horizon perfectly.
      maskImage: "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)"
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
            
            // Road Fog Mask
            maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)"
        }} />

        {/* LEFT WALL */}
        <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />

        {/* RIGHT WALL */}
        <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        {/* CENTER BLACK HOLE (Hides the exact vanishing point) */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "100px", height: "100px",
            background: "black",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 50px 50px black", // Soft edges
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
