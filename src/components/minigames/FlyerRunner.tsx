"use client";

import React from "react";
import { TunnelView } from "@/components/TunnelView"; 
import Link from "next/link";

export default function FlyRunnerPage() {
  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "black" }}>
      
      {/* 1. THE 3D WORLD BACKGROUND */}
      <TunnelView speedModifier={1.5} />

      {/* 2. GAME UI OVERLAY (HUD) */}
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
                <span style={{ background: "red", padding: "2px 6px" }}>LIVE</span> SCORE: 00000
            </div>
            
            {/* Back Button (Pointer events re-enabled for button) */}
            <Link href="/" style={{ pointerEvents: "auto", textDecoration: "none" }}>
                <div style={{ 
                    background: "white", 
                    color: "black", 
                    padding: "4px 12px", 
                    cursor: "pointer",
                    border: "2px solid black"
                }}>
                    [X] EXIT TO DESKTOP
                </div>
            </Link>
        </div>

        {/* Center Prompt */}
        <div style={{
            position: "absolute",
            bottom: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            color: "white",
            fontFamily: "monospace",
            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
        }}>
            <h2 style={{ fontSize: "2rem", margin: 0 }}>CALL LANE RUNNER</h2>
            <p className="animate-pulse">PRESS [SPACE] TO START</p>
        </div>

      </div>
    </main>
  );
}
