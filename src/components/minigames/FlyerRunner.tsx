"use client"

import React, { useState, useEffect } from "react"

export default function FlyerRunner() {
  // --- GAME STATE ---
  const [isPlaying, setIsPlaying] = useState(false)
  const [lane, setLane] = useState(1) // 0=Top, 1=Mid, 2=Bot
  
  // --- CONTROLS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return
      
      // Prevent scrolling the page when playing
      if(["ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === "ArrowUp" || e.key === "w") {
        setLane((prev) => Math.max(0, prev - 1))
      }
      if (e.key === "ArrowDown" || e.key === "s") {
        setLane((prev) => Math.min(2, prev + 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying])

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      
      {/* GAME CONSOLE CONTAINER */}
      <div 
        className="relative w-full h-[400px] overflow-hidden border-4 border-zinc-800 bg-sky-900 shadow-2xl rounded-lg"
        style={{ imageRendering: "pixelated" }} // Keeps the retro crispness
      >
        
        {/* --- LAYER 1: THE SKY (Static or Slow) --- */}
        {/* If your city png has transparent sky, this color shows through */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800" />

        {/* --- LAYER 2: THE CITY (Your Asset) --- */}
        <div 
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: 'url("/assets/city_loop.png")', // <--- YOUR FILE
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom left',
            backgroundSize: 'auto 100%', // Fits height, repeats width
            // ANIMATION: Scrolls left forever
            animation: isPlaying ? 'scrollCity 8s linear infinite' : 'none',
          }}
        />

        {/* --- LAYER 3: THE PLAYER (Green Box) --- */}
        {isPlaying && (
          <div 
            className="absolute left-20 w-12 h-16 bg-green-500 border-2 border-white transition-all duration-150 ease-out z-10"
            style={{
              // Simple math to place player in lanes
              top: lane === 0 ? "55%" : lane === 1 ? "70%" : "85%", 
              transform: "translateY(-100%)", // Anchor to feet
              boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
            }}
          >
            {/* "Head" of the intern */}
            <div className="absolute -top-4 left-2 w-8 h-8 bg-green-300 border border-black"></div>
          </div>
        )}

        {/* --- UI: START SCREEN --- */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
            <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">
              FLYER RUN <span className="text-green-500">2026</span>
            </h1>
            <p className="text-zinc-400 font-mono text-sm mb-6">
              LEEDS IS CALLING. PROMO NEVER SLEEPS.
            </p>
            <button 
              onClick={() => setIsPlaying(true)}
              className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold font-mono text-xl uppercase skew-x-[-10deg] transition-transform active:scale-95"
            >
              Start Shift
            </button>
          </div>
        )}

      </div>
      
      {/* --- INSTRUCTIONS --- */}
      <div className="mt-4 text-zinc-500 font-mono text-xs">
        [UP/DOWN] CHANGE LANE • [SPACE] THROW FLYER (Coming Soon)
      </div>

      {/* --- CSS FOR SCROLLING --- */}
      <style jsx>{`
        @keyframes scrollCity {
          from { background-position: 0 bottom; }
          to { background-position: -1000px bottom; } /* Tweak 1000px to match your image width roughly */
        }
      `}</style>
    </div>
  )
}
