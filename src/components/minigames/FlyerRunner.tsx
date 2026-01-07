"use client";

import React, { useState, useEffect, useRef } from "react";
// CHECK THIS IMPORT:
import TunnelView from "@/components/TunnelView"; 
import Link from "next/link";

export default function FlyRunnerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [shipPosition, setShipPosition] = useState(0);
  
  const mainRef = useRef<HTMLElement>(null);
  const SHIP_SPEED = 10;

  // 1. GAME LOGIC
  const startGame = () => {
    if (!isPlaying) {
      console.log("🚀 FORCE START");
      setIsPlaying(true);
      // Force focus to capture arrow keys
      setTimeout(() => mainRef.current?.focus(), 10);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar starts game
      if (e.code === "Space" && !isPlaying) {
        startGame();
      }

      // Movement
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

  // Score Ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => setScore(prev => prev + 10), 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <main 
        ref={mainRef}
        tabIndex={0} 
        style={{ 
            width: "100vw", height: "100vh", position: "relative", 
            overflow: "hidden", background: "black", outline: "none"
        }}
    >
      
      {/* 2. THE VISUAL COMPONENT */}
      <TunnelView isPlaying={isPlaying} />

      {/* 3. CLICK-TO-START ZONE (Fixes "Not Startable") */}
      {!isPlaying && (
        <div 
            onClick={(e) => {
                e.stopPropagation(); 
                startGame();
            }}
            style={{
                position: "absolute", 
                inset: 0, 
                zIndex: 9999, // TOP LAYER
                cursor: "pointer", 
                background: "rgba(0,0,0,0.1)", // Slight tint to show it's active
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
             {/* Fallback Text in case UI below is missing */}
             <div style={{ color: "transparent" }}>CLICK TO START</div>
        </div>
      )}

      {/* 4. THE SHIP */}
      <div style={{
            position: "absolute", bottom: "15%", left: "50%",
            transform: `translateX(-50%) translateX(${shipPosition * 4}px)`, 
            transition: "transform 0.05s linear", zIndex: 50, pointerEvents: "none"
      }}>
        <div style={{ 
            width: "0", height: "0", 
            borderLeft: "20px solid transparent", 
            borderRight: "20px solid transparent",
            borderBottom: "60px solid #ff00ff", // Neon Pink Ship
            filter: "drop-shadow(0 0 10px #ff00ff)"
        }} />
      </div>

      {/* 5. UI LAYER */}
      <div style={{ position: "relative", zIndex: 100, height: "100%", pointerEvents: "none" }}>
        
        {/* Top Bar */}
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

        {/* Start Screen Text */}
        {!isPlaying && (
            <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                textAlign: "center", color: "white", fontFamily: "monospace", pointerEvents: "none"
            }}>
                <h1 style={{ fontSize: "5rem", margin: "0 0 20px 0", textShadow: "4px 4px 0px #000", letterSpacing: "-2px" }}>
                    CALL LANE
                </h1>
                <div className="animate-pulse" style={{ background: "black", color: "#0f0", padding: "15px 30px", fontSize: "1.5rem", border: "2px solid #0f0", display: "inline-block", boxShadow: "0 0 20px #0f0" }}>
                    CLICK TO START
                </div>
            </div>
        )}
      </div>
    </main>
  );
}
