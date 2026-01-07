"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
const TILE_WIDTH = "3072px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [shipPosition, setShipPosition] = useState(0);
  
  const mainRef = useRef<HTMLElement>(null);
  
  // Faster, snappier movement for lane switching feel
  const SHIP_SPEED = 15; 
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
          // Limit movement to stay roughly within the 5 lanes (-100 to 100)
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

  // --- WALL STYLES ---
  const getWallStyle = (img: string, side: 'left' | 'right'): React.CSSProperties => ({
      position: "absolute", 
      top: "50%", 
      left: "50%",
      
      // CONTAINER SIZE
      width: "800vw", 
      height: "150vh", // Tall enough for roofs
      
      backgroundImage: `url('${img}')`,
      
      // TEXTURE: Keep aspect ratio, anchor to bottom (road level)
      backgroundSize: `${TILE_WIDTH} auto`, 
      backgroundRepeat: "repeat-x",
      backgroundPosition: "left bottom", 

      // ANIMATION
      willChange: "background-position", 
      animation: side === 'left' 
        ? `moveWallLeft ${animationDuration} linear infinite`
        : `moveWallRight ${animationDuration} linear infinite`,

      // TRANSFORM (The "Funnel" Effect)
      // 1. rotateY: We use 89deg instead of 90deg. This angles the walls slightly OUTWARD
      //    as they go back, creating the "Tighter close, Wider far" perspective.
      // 2. translateZ: Brought closer (-55vw) to tighten the immediate play area.
      // 3. translateY: -55% moves the wall DOWN relative to center. 
      //    Since image is bottom-aligned, this pulls the "roofs" down into view.
      transform: `
        translate(-50%, -55%) 
        rotateY(${side === 'left' ? '89deg' : '-89deg'}) 
        translateZ(-55vw)
      `,
      
      backfaceVisibility: "hidden",
      filter: "brightness(0.95)"
  });

  return (
    <main 
        ref={mainRef}
        tabIndex={0} 
        onClick={startGame} 
        style={{ 
            width: "100vw", height: "100vh", position: "relative", 
            overflow: "hidden", outline: "none", userSelect: "none",
            // SKYBOX RESTORED
            background: "linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 60%, #fff 100%)"
        }}
    >
      {/* ========================================================
          VISUAL ENGINE
         ======================================================== */}
      <div style={{
          position: "absolute", inset: 0,
          perspective: "300px", // Lower perspective = More dramatic/Arcade feel
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

        {/* ROAD (With 5 Lanes) */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "160vw", // Narrower road to fit the "Tight" feel
            height: "800vh",
            backgroundColor: "#333",
            
            // 1. ASPHALT TEXTURE (Noise)
            // 2. LANE MARKERS (4 dashed lines creating 5 lanes)
            backgroundImage: `
                repeating-linear-gradient(to right, transparent 0%, transparent 19.5%, rgba(255,255,255,0.5) 19.5%, rgba(255,255,255,0.5) 20.5%, transparent 20.5%, transparent 40%),
                repeating-linear-gradient(to bottom, #444 0, #444 1px, transparent 1px, transparent 4px)
            `,
            backgroundSize: "100% 100%, 100% 40px",
            
            transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-25vh)", // Lowered road slightly
            animation: `moveRoad ${isPlaying ? "0.15s" : "0s"} linear infinite`, // Faster road texture
            
            // Fade road into distance
            maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)"
        }} />

        {/* LEFT WALL */}
        <div style={getWallStyle(WALL_LEFT_IMG, 'left')} />

        {/* RIGHT WALL */}
        <div style={getWallStyle(WALL_RIGHT_IMG, 'right')} />

        {/* HORIZON FOG (White/Blue to match sky) */}
        <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at center, transparent 30%, #E0F7FA 90%)",
            zIndex: 10
        }} />
      </div>

      {/* ========================================================
          UI & SHIP
         ======================================================== */}
      
      {/* SHIP */}
      <div style={{
            position: "absolute", bottom: "10%", left: "50%",
            // Multiplier 2.5 matches the new narrower road width
            transform: `translateX(-50%) translateX(${shipPosition * 2.5}px)`, 
            transition: "transform 0.08s linear", // Snappier transition
            zIndex: 50, pointerEvents: "none"
      }}>
        {/* Shadow */}
        <div style={{
            position: "absolute", bottom: "-20px", left: "50%", transform: "translateX(-50%)",
            width: "40px", height: "10px", background: "rgba(0,0,0,0.6)", borderRadius: "50%",
            filter: "blur(4px)"
        }} />
        
        {/* Ship Body */}
        <div style={{ 
            width: "0", height: "0", 
            borderLeft: "25px solid transparent", 
            borderRight: "25px solid transparent",
            borderBottom: "70px solid #ff0055", // Hot Pink
            filter: "drop-shadow(0 0 5px rgba(255,0,85,0.5))"
        }} />
      </div>

      {/* HUD */}
      <div style={{ position: "relative", zIndex: 100, height: "100%", pointerEvents: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px", color: "black", fontFamily: "monospace", textShadow: "1px 1px 0 #fff" }}>
            <div>
                <span style={{ background: isPlaying ? "red" : "gray", color: "white", padding: "2px 6px", marginRight: "10px", borderRadius: "4px" }}>
                  {isPlaying ? "LIVE" : "PAUSED"}
                </span> 
                <strong>SCORE: {score.toString().padStart(5, '0')}</strong>
            </div>
            
            <Link href="/" style={{ pointerEvents: "auto", textDecoration: "none" }}>
                <div style={{ background: "black", color: "white", padding: "4px 12px", border: "2px solid white", fontWeight: "bold", cursor: "pointer" }}>
                    EXIT
                </div>
            </Link>
        </div>

        {!isPlaying && (
            <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                textAlign: "center", color: "black", fontFamily: "monospace", pointerEvents: "none", width: "100%"
            }}>
                <h1 style={{ fontSize: "5rem", margin: "0 0 20px 0", textShadow: "4px 4px 0px #fff", letterSpacing: "-2px" }}>
                    CALL LANE
                </h1>
                <div className="animate-pulse" style={{ background: "white", color: "black", padding: "15px 30px", fontSize: "1.5rem", border: "4px solid black", display: "inline-block", boxShadow: "4px 4px 0 black" }}>
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
