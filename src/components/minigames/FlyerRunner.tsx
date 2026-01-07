"use client";

import React, { useState, useEffect, useRef } from "react";
import TunnelView from "@/components/TunnelView"; 
import Link from "next/link";

export default function FlyRunnerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  // SHIP STATE: -100 (Far Left) to 100 (Far Right)
  const [shipPosition, setShipPosition] = useState(0);
  const SHIP_SPEED = 8; // How fast the ship moves laterally

  // Ref to handle focus
  const mainRef = useRef<HTMLElement>(null);

  // START GAME HANDLER
  const startGame = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      // Ensure focus is on the main div so keys register
      mainRef.current?.focus();
    }
  };

  // KEYBOARD LISTENER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Start game with Space
      if (e.code === "Space" && !isPlaying) {
        startGame();
        return;
      }

      // Movement Logic
      if (isPlaying) {
        if (e.key === "ArrowLeft" || e.key === "a") {
          setShipPosition(prev => Math.max(prev - SHIP_SPEED, -90)); // Cap at -90
        }
        if (e.key === "ArrowRight" || e.key === "d") {
          setShipPosition(prev => Math.min(prev + SHIP_SPEED, 90)); // Cap at 90
        }
      }
    };

    // Note: For smoother movement, typically we'd use a requestAnimationFrame loop 
    // and track keydown/keyup states, but this is sufficient for simple left/right stepping.
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  // SCORE TICKER
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setScore(prev => prev + 10);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <main 
        ref={mainRef}
        onClick={startGame} // Clicking anywhere starts the game
        // Make element focusable to capture keyboard events
        tabIndex={0} 
        style={{ 
            width: "100vw", 
            height: "100vh", 
            position: "relative", 
            overflow: "hidden", 
            background: "black", 
            cursor: "pointer",
            outline: "none"
        }}
    >
      
      {/* 3D WORLD - Controlled by state */}
      <TunnelView isPlaying={isPlaying} />

      {/* --- THE SHIP --- */}
      {/* Overlaying the ship on top of the tunnel view */}
      <div 
        style={{
            position: "absolute",
            bottom: "15%", // Positioned on the "road"
            left: "50%",
            transform: `translateX(-50%) translateX(${shipPosition * 4}px)`, // Move based on state
            transition: "transform 0.05s linear", // Slight smoothing
            zIndex: 50,
            pointerEvents: "none"
        }}
      >
        {/* SHIP GRAPHIC (Simple CSS Triangle/Engine) */}
        <div style={{ position: "relative" }}>
            {/* Body */}
            <div style={{
                width: "0", 
                height: "0", 
                borderLeft: "20px solid transparent",
                borderRight: "20px solid transparent",
                borderBottom: "60px solid #ff00ff", // Neon Pink Ship
                filter: "drop-shadow(0 0 10px #ff00ff)"
            }} />
            
            {/* Engine Glow */}
            {isPlaying && (
                <div style={{
                    position: "absolute",
                    bottom: "-10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "10px",
                    height: "30px",
                    background: "cyan",
                    filter: "blur(5px)",
                    animation: "pulseEngine 0.2s infinite alternate"
                }} />
            )}
            
            <style>{`
                @keyframes pulseEngine {
                    from { height: 20px; opacity: 0.8; }
                    to { height: 35px; opacity: 1; }
                }
            `}</style>
        </div>
      </div>

      {/* UI OVERLAY */}
      <div style={{ position: "relative", zIndex: 100, height: "100%", pointerEvents: "none" }}>
        
        {/* Top Bar */}
        <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            padding: "20px",
            fontFamily: "monospace",
            color: "white",
            textShadow: "2px 2px 0 #000"
        }}>
            <div>
                <span style={{ 
                    background: isPlaying ? "red" : "gray", 
                    padding: "2px 6px",
                    marginRight: "10px"
                }}>
                  {isPlaying ? "LIVE" : "PAUSED"}
                </span> 
                SCORE: {score.toString().padStart(5, '0')}
            </div>
            
            <Link href="/" style={{ pointerEvents: "auto", textDecoration: "none" }}>
                <div style={{ 
                    background: "white", 
                    color: "black", 
                    padding: "4px 12px", 
                    cursor: "pointer",
                    border: "2px solid black",
                    fontWeight: "bold"
                }}>
                    [X] EXIT
                </div>
            </Link>
        </div>

        {/* START SCREEN - Only shows when NOT playing */}
        {!isPlaying && (
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "white",
                fontFamily: "monospace",
                zIndex: 200,
                width: "100%"
            }}>
                <h1 style={{ 
                    fontSize: "5rem", 
                    margin: "0 0 20px 0", 
                    textShadow: "4px 4px 0px #000",
                    letterSpacing: "-2px"
                }}>
                    CALL LANE
                </h1>
                
                <div className="animate-pulse" style={{ 
                    background: "black", 
                    color: "#0f0", 
                    padding: "15px 30px", 
                    fontSize: "1.5rem",
                    border: "2px solid #0f0",
                    display: "inline-block",
                    boxShadow: "0 0 20px #0f0"
                }}>
                    PRESS [SPACE] TO START
                </div>

                <div style={{ 
                    marginTop: "30px", 
                    display: "flex", 
                    justifyContent: "center", 
                    gap: "20px",
                    textShadow: "1px 1px 0 #000" 
                }}>
                    <div style={{ border: "1px solid white", padding: "10px" }}>⬅️ LEFT</div>
                    <div style={{ border: "1px solid white", padding: "10px" }}>RIGHT ➡️</div>
                </div>
            </div>
        )}

      </div>
    </main>
  );
}
