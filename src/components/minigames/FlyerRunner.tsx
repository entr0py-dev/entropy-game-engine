"use client";

import React, { useState, useEffect } from "react";
import TunnelView from "@/components/TunnelView"; 
import Link from "next/link";

export default function FlyRunnerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);

  // KEYBOARD LISTENER
  useEffect(() => {
    // Attempt to focus window immediately
    if (typeof window !== "undefined") {
        window.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (!isPlaying) {
          setIsPlaying(true); 
        }
      }
    };

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
    // ADDED CLICK HANDLER TO CONTAINER AS FALLBACK
    <main 
        onClick={() => !isPlaying && setIsPlaying(true)}
        style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "black", cursor: "pointer" }}
    >
      
      {/* 3D WORLD */}
      <TunnelView isPlaying={isPlaying} />

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
                <span style={{ background: isPlaying ? "red" : "gray", padding: "2px 6px" }}>
                  {isPlaying ? "LIVE" : "PAUSED"}
                </span> 
                {' '}SCORE: {score.toString().padStart(5, '0')}
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

        {/* Start Prompt */}
        {!isPlaying && (
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "white",
                fontFamily: "monospace",
                zIndex: 200
            }}>
                <h1 style={{ 
                    fontSize: "4rem", 
                    margin: "0 0 20px 0", 
                    textShadow: "4px 4px 0px #000",
                    background: "rgba(0,0,0,0.5)",
                    padding: "10px"
                }}>
                    CALL LANE
                </h1>
                
                <div className="animate-pulse" style={{ 
                    background: "black", 
                    color: "#0f0", 
                    padding: "15px 30px", 
                    fontSize: "1.5rem",
                    border: "2px solid #0f0",
                    display: "inline-block"
                }}>
                    PRESS [SPACE] OR CLICK
                </div>
            </div>
        )}

      </div>
    </main>
  );
}
