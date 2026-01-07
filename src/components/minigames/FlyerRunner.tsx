"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- ASSET CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
const TILE_SIZE = "3072px"; 

export default function FlyRunnerGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [shipPosition, setShipPosition] = useState(0);
  
  const mainRef = useRef<HTMLElement>(null);
  const SHIP_SPEED = 10;
  
  const animationDuration = isPlaying ? "1.0s" : "0s";

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

  return (
    <main 
        ref={mainRef}
        tabIndex={0} 
        onClick={startGame} 
        style={{ 
            width: "100vw", height: "100vh", position: "relative", 
            overflow: "hidden", outline: "none", userSelect: "none",
            // Dark Sky Gradient
            background: "linear-gradient(to bottom, #000000 0%, #1a1a2e 100%)"
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

        {/* ROAD */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "300vw", height: "400vmax",
            backgroundColor: "#111",
            backgroundImage: "repeating-linear-gradient(to bottom, #fff, #fff 50px, transparent 50px, transparent 100px)",
            backgroundSize: "20px 100%", backgroundPosition: "center top", backgroundRepeat: "no-repeat",
            // Road Lowered slightly
            transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-40vh)",
            animation: `moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite`
        }} />

        {/* LEFT WALL */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "600vmax", // Ultra wide to prevent flicker
            height: "500vh",  // Tall container
            backgroundImage: `url('${WALL_LEFT_IMG}')`,
            
            // FIX: TEXTURE SCALING
            // 200vh height ensures the image is HUGE vertically.
            // This pushes the "roof" way above the screen top.
            backgroundSize: `${TILE_SIZE} 200vh`, 
            
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left bottom", // Anchor shops to road
            
            // TRANSFORM ADJUSTMENT:
            // translateZ(-100vw): Corridor width
            // translate(-50%, -85%): Moves the wall UP.
            // -50% is center. -85% pulls it up significantly so the bottom aligns with road.
            transform: "translate(-50%, -85%) rotateY(90deg) translateZ(-100vw)",
            
            animation: `moveWallLeft ${animationDuration} linear infinite`,
            backfaceVisibility: "hidden",
            filter: "brightness(0.8)"
        }} />

        {/* RIGHT WALL */}
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "600vmax", 
            height: "500vh",
            backgroundImage: `url('${WALL_RIGHT_IMG}')`,
            
            // Match Left Wall Settings
            backgroundSize: `${TILE_SIZE} 200vh`,
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left bottom",
            
            transform: "translate(-50%, -85%) rotateY(-90deg) translateZ(-100vw)",
            
            animation: `moveWallRight ${animationDuration} linear infinite`,
            backfaceVisibility: "hidden",
            filter: "brightness(0.8)"
        }} />

        {/* DISTANCE FOG */}
        <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at center, transparent 20%, #000 80%)",
            zIndex: 10
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
            borderBottom: "60px solid #00ff99", // Green Ship
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
