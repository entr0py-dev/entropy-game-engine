"use client";

import React from "react";
// Import the game logic you already created
import FlyRunnerGame from "@/components/minigames/FlyerRunner";
import Link from "next/link";

export default function ArcadePage() {
  return (
    <main style={{ width: "100vw", height: "100vh", background: "black" }}>
      {/* Render the Game Component */}
      <FlyRunnerGame />
      
      {/* Optional: Floating Exit Button (if the game component doesn't have one) */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10000 }}>
        <Link href="/" style={{ 
            background: "white", 
            color: "black", 
            padding: "8px 16px", 
            fontFamily: "monospace", 
            fontWeight: "bold",
            textDecoration: "none",
            border: "2px solid #0f0"
        }}>
            EXIT TO DESKTOP
        </Link>
      </div>
    </main>
  );
}
