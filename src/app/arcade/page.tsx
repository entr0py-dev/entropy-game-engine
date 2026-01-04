"use client";

import React from "react";
// We use the Default import here to be safe
import TunnelView from "@/components/TunnelView"; 
import Link from "next/link";

export default function ArcadePage() {
  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "black" }}>
      
      {/* Background */}
      <TunnelView isPlaying={true} speedModifier={0.5} />

      <div style={{ position: "relative", zIndex: 10, padding: "40px", color: "white", fontFamily: "monospace" }}>
        <h1>ARCADE TEST ZONE</h1>
        <p>Testing 3D Engine...</p>
        
        <br />
        
        <Link href="/" style={{ color: "#0ff", fontSize: "20px" }}>
           [ GO BACK HOME ]
        </Link>
      </div>

    </main>
  );
}
