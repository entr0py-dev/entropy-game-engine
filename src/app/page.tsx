"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useGameState } from "@/context/GameStateContext";
import { Rnd } from "react-rnd";
import InventoryPage from "./inventory/page";
import ShopPage from "./shop/page";
import QuestLogPage from "./quests/page";
import AvatarStudio from "./profile/page";
import MusicPlayer from "@/components/MusicPlayer";
import Sidebar from "@/components/Sidebar";

// --- ANIMATION STYLES ---
const ANIMATION_STYLES = `
  /* Moves the track down by exactly 50% (the height of one image segment) */
  @keyframes infiniteScroll {
    0% { transform: translateY(0); }
    100% { transform: translateY(50%); } 
  }

  .scrolling-track {
    animation: infiniteScroll 5s linear infinite; /* Slower speed for debugging */
    width: 100%;
    height: 200%; /* Needs to be 200% to hold two stacked images */
    position: absolute;
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column-reverse; /* Stack upwards */
  }
`;

function GameEngineContent() {
  const {
    session,
    loading,
    profile,
    activeWindow,
    setActiveWindow,
    refreshGameState,
    handlePongWin
  } = useGameState();
  const searchParams = useSearchParams();
  const creatingProfile = useRef(false);
  const hasTriedCreating = useRef(false);
  
  // Parallax State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  
  const isEmbed = searchParams.get("embed") === "true";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [winState, setWinState] = useState({ x: 50, y: 50, width: 1000, height: 700 });

  // --- STANDARD HOOKS ---
  useEffect(() => {
    const win = searchParams.get("window");
    const side = searchParams.get("sidebar") === "true";
    if (win) setActiveWindow(win as any);
    if (side) setSidebarOpen(true);
  }, [searchParams, setActiveWindow]);

  const handleCloseApp = () => {
    setActiveWindow("none");
    setSidebarOpen(false);
    if (isEmbed) {
        if (window.parent) window.parent.postMessage("CLOSE_OVERLAY", "*");
    } else {
        window.location.href = "https://www.entropyofficial.com";
    }
  };

  async function addDebugXp(amount: number) {
    if (!session?.user || !profile) return;
    const { error: rpcError } = await supabase.rpc("add_xp", { user_id: session.user.id, amount });
    if (rpcError) {
       let xpPool = (profile.xp ?? 0) + amount;
       let level = profile.level ?? 1;
       let threshold = level * 263;
       while (xpPool >= threshold) { xpPool -= threshold; level += 1; threshold = level * 263; }
       await supabase.from("profiles").update({ xp: xpPool, level }).eq("id", session.user.id);
    }
    await refreshGameState();
  }

  useEffect(() => {
    async function ensureProfile() {
      if (loading || creatingProfile.current || hasTriedCreating.current) return;
      if (!session?.user || profile) return;
      creatingProfile.current = true;
      hasTriedCreating.current = true; 
      const rawName = session.user.email?.split("@")[0] || "operative";
      const safeName = rawName.replace(/[^a-zA-Z0-9_]/g, "");
      const { error } = await supabase.from("profiles").insert({
        id: session.user.id, username: safeName, avatar: "default", entrobucks: 0, xp: 0, level: 1,
      });
      if (!error) await refreshGameState();
      creatingProfile.current = false;
    }
    void ensureProfile();
  }, [loading, session, profile, refreshGameState]);

  useEffect(() => {
    if (isEmbed) return; 
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isEmbed]);

  if (loading) return <div className="bg-black h-screen text-green-500 font-mono p-10">LOADING...</div>;

  return (
    <>
    <style>{ANIMATION_STYLES}</style>
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden", 
        backgroundColor: "#222", // Grey background to see transparent PNGs
        overscrollBehavior: "none", 
      }}
    >
      {/* --- 1. BACKGROUND ENGINE (The Floor) --- */}
      {!isEmbed && (
        <div className="absolute inset-0 overflow-hidden perspective-container">
            
            {/* 3D PERSPECTIVE WRAPPER */}
            <div 
                style={{
                    position: "absolute",
                    top: "50%", // Start from middle of screen (Horizon)
                    left: "-50%",
                    width: "200%",
                    height: "100%", // Bottom half of screen
                    perspective: "600px",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* THE MOVING PLANE */}
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "200%", // Very tall to allow perspective stretching
                        background: "#111", // Fallback color
                        transformOrigin: "center top", // Rotate from the horizon line
                        transform: `
                            rotateX(60deg) 
                            translateZ(0px)
                            rotateZ(${mousePos.x * 10}deg) /* Mouse Tilt */
                        `,
                    }}
                >
                    {/* THE INFINITE SCROLLER */}
                    <div className="scrolling-track">
                         {/* Image 1 */}
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img 
                            src="/assets/city_loop.png" 
                            alt="Loop Segment 1"
                            style={{ 
                                width: "100%", 
                                height: "50%", // Takes up half the track
                                objectFit: "cover", 
                                border: "2px solid red", // DEBUG BORDER
                                opacity: 1 
                            }}
                            onError={() => setImgError(true)}
                         />
                         {/* Image 2 (Clone) */}
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img 
                            src="/assets/city_loop.png" 
                            alt="Loop Segment 2"
                            style={{ 
                                width: "100%", 
                                height: "50%", 
                                objectFit: "cover",
                                border: "2px solid red", // DEBUG BORDER
                                opacity: 1 
                            }}
                         />
                    </div>
                </div>
            </div>

            {/* DEBUG INFO */}
            <div className="fixed bottom-4 right-4 z-[9999] bg-white text-black p-4 font-bold border-4 border-red-500">
                <p>STATUS: {imgError ? "❌ FAILED TO LOAD" : "✅ LOADED"}</p>
                <p>Use Mouse to Tilt</p>
                <p>If you see RED BORDERS, CSS is working.</p>
                <p>If box is black inside red borders, PNG is black/transparent.</p>
            </div>
        </div>
      )}

      {/* --- 2. MAIN APP CONTENT --- */}
      <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", zIndex: 30 }}>
        
        <div
          style={{
            flex: 1,
            position: "relative",
            marginRight: !isEmbed || sidebarOpen ? "320px" : "0",
            transition: "margin-right 0.3s ease",
            overflow: "hidden", 
          }}
        >
          {!isEmbed && (
            <>
              {/* DEBUG BUTTONS */}
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 200, display: "flex", gap: "8px" }}>
                <DebugButton label="+10k XP" onClick={() => addDebugXp(10000)} />
              </div>
              
              {/* CENTER UI */}
              <div 
                style={{ 
                    position: "absolute", 
                    inset: 0, 
                    zIndex: 1, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`, 
                }}
              >
                <div className="bg-black/90 border border-green-500/50 p-8 backdrop-blur-md text-center">
                    <h1 className="text-green-500 font-mono text-xl tracking-[0.2em] mb-2 animate-pulse">HOME_STUDIO</h1>
                </div>
              </div>
            </>
          )}

          {activeWindow !== "none" && (
            <Rnd
              size={{ width: winState.width, height: winState.height }}
              position={{ x: winState.x, y: winState.y }}
              onDragStop={(e, d) => setWinState(prev => ({ ...prev, x: d.x, y: d.y }))}
              onResizeStop={(e, direction, ref, delta, position) => {
                setWinState({ width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...position });
              }}
              minWidth={600} minHeight={400} bounds="parent"
              dragHandleClassName="retro-header" enableUserSelectHack={false} 
              style={{ zIndex: 1000, pointerEvents: "auto" }}
            >
              <div style={{ width: "100%", height: "100%" }} onWheel={(e) => e.stopPropagation()}>
                {activeWindow === "inventory" && <InventoryPage isOverlay onClose={handleCloseApp} />}
                {activeWindow === "shop" && <ShopPage isOverlay onClose={handleCloseApp} />}
                {activeWindow === "quests" && <QuestLogPage isOverlay onClose={handleCloseApp} />}
                {activeWindow === "profile" && <AvatarStudio isOverlay onClose={handleCloseApp} />}
              </div>
            </Rnd>
          )}

          <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 2000 }}>
            <MusicPlayer />
          </div>
        </div>

        {(!isEmbed || sidebarOpen) && (
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "320px", zIndex: 1500 }}>
            <Sidebar startOpen={sidebarOpen} onCloseAll={handleCloseApp} />
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameEngineContent />
    </Suspense>
  );
}

function DebugButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-black text-white p-2 border border-gray-500 rounded text-xs hover:bg-gray-800">
      {label}
    </button>
  );
}
