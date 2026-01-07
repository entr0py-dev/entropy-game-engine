"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- ASSET CONFIGURATION ---
// Make sure these match your filenames in /public/ exactly
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
const TILE_SIZE = "3072px"; // The width of your texture file

export default function FlyRunnerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [shipPosition, setShipPosition] = useState(0);
  
  // Focus management
  const mainRef = useRef<HTMLElement>(null);
  const SHIP_SPEED = 10;
  
  // Game Loop Speed (1.0s = Medium Fast)
  const animationDuration = isPlaying ? "1.0s" : "0s";

  // --- GAME START LOGIC ---
  const startGame = () => {
    if (!isPlaying) {
      console.log("🚀 STARTING ENGINE...");
      setIsPlaying(true);
      // Force focus to capture keys
      setTimeout(() => mainRef.current?.focus(), 10);
    }
  };

  // --- CONTROLS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isPlaying) {
        startGame();
      }

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

  // --- SCORE TIMER ---
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => setScore(prev => prev + 10), 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <main 
        ref={mainRef}
        tabIndex={0} 
        onClick={startGame} // Clicking anywhere attempts to start
        style={{ 
            width: "100vw", height: "100vh", position: "relative", 
            overflow: "hidden", background: "#111", outline: "none",
            userSelect: "none"
        }}
    >
      {/* ========================================================
          THE VISUAL ENGINE (CSS 2.5D)
         ======================================================== */}
      <div style={{
          position: "absolute", inset: 0,
          perspective: "350px", // Controls how "deep" the tunnel feels
          overflow: "hidden",
          pointerEvents: "none" // Let clicks pass through to main
      }}>
        <style>
            {`
            @keyframes moveWallLeft {
                from { background-position-x: 0px; }
                to { background-position-x: -${TILE_SIZE}; } 
            }
            @keyframes moveWallRight {
                from { background-position-x: 0px; }
                to { background-position-x: ${TILE_SIZE}; } 
            }
            @keyframes moveRoad {
                from { background-position-y: 0px; }
                to { background-position-y: 200px; } 
            }
            `}
        </style>

        {/* 1. SKY / CEILING */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "300vw", height: "400vmax",
            background: "linear-gradient(to bottom, #020024, #00d4ff)",
            transform: "translate(-50%, -50%) rotateX(-90deg) translateZ(-40vh)",
            backfaceVisibility: "hidden"
        }} />

        {/* 2. ROAD */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "300vw", height: "400vmax",
            backgroundColor: "#222",
            backgroundImage: "repeating-linear-gradient(to bottom, #fff, #fff 50px, transparent 50px, transparent 100px)",
            backgroundSize: "20px 100%", backgroundPosition: "center top", backgroundRepeat: "no-repeat",
            transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-40vh)",
            animation: `moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite`
        }} />

        {/* 3. LEFT WALL (With Roof Fix) */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "400vmax", 
            height: "800vh", // MASSIVE HEIGHT = No clipped roofs
            backgroundImage: `url('${WALL_LEFT_IMG}')`,
            backgroundSize: `${TILE_SIZE} 130vh`, // Height matches the "visible" area we want
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left bottom", // Anchor image to bottom
            // Move container UP (-94%) so the bottom (shops) aligns with road
            transform: "translate(-50%, -94%) rotateY(90deg) translateZ(-110vw)",
            animation: `moveWallLeft ${animationDuration} linear infinite`,
            backfaceVisibility: "hidden",
            filter: "brightness(0.9)"
        }} />

        {/* 4. RIGHT WALL (With Roof Fix) */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "400vmax", 
            height: "800vh",
            backgroundImage: `url('${WALL_RIGHT_IMG}')`,
            backgroundSize: `${TILE_SIZE} 130vh`,
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left bottom",
            transform: "translate(-50%, -94%) rotateY(-90deg) translateZ(-110vw)",
            animation: `moveWallRight ${animationDuration} linear infinite`,
            backfaceVisibility: "hidden",
            filter: "brightness(0.9)"
        }} />

        {/* 5. FOG (Hides the end) */}
        <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at center, transparent 30%, #000 95%)",
            zIndex: 10
        }} />
      </div>

      {/* ========================================================
          GAME OBJECTS & UI
         ======================================================== */}
      
      {/* THE SHIP */}
      <div style={{
            position: "absolute", bottom: "15%", left: "50%",
            transform: `translateX(-50%) translateX(${shipPosition * 4}px)`, 
            transition: "transform 0.05s linear", zIndex: 50, pointerEvents: "none"
      }}>
        {/* Neon Pink Triangle */}
        <div style={{ 
            width: "0", height: "0", 
            borderLeft: "20px solid transparent", 
            borderRight: "20px solid transparent",
            borderBottom: "60px solid #ff00ff", 
            filter: "drop-shadow(0 0 10px #ff00ff)"
        }} />
      </div>

      {/* UI OVERLAY */}
      <div style={{ position: "relative", zIndex: 100, height: "100%", pointerEvents: "none" }}>
        
        {/* HUD */}
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

        {/* START SCREEN (This replaces "TESTING 3D ENGINE") */}
        {!isPlaying && (
            <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                textAlign: "center", color: "white", fontFamily: "monospace", pointerEvents: "none", width: "100%"
            }}>
                <h1 style={{ fontSize: "5rem", margin: "0 0 20px 0", textShadow: "4px 4px 0px #000", letterSpacing: "-2px" }}>
                    CALL LANE
                </h1>
                <div className="animate-pulse" style={{ background: "black", color: "#0f0", padding: "15px 30px", fontSize: "1.5rem", border: "2px solid #0f0", display: "inline-block", boxShadow: "0 0 20px #0f0" }}>
                    CLICK TO START
                </div>
                <div style={{ marginTop: "20px", fontSize: "0.8rem", opacity: 0.7 }}>
                    (Or press SPACE)
                </div>
            </div>
        )}
      </div>

      {/* CLICK CATCHER (For Safety) */}
      {!isPlaying && (
        <div style={{
            position: "absolute", inset: 0, zIndex: 9999, cursor: "pointer"
        }} onClick={startGame} />
      )}
    </main>
  );
}
