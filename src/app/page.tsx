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

// --- CSS FOR THE "LOOP PNG" ANIMATION ---
const ANIMATION_STYLES = `
  @keyframes textureFly {
    0% { background-position: 0 0; }
    100% { background-position: 0 100%; } /* Loops the PNG vertically */
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  .animate-texture {
    animation: textureFly 4s linear infinite; /* Adjusted speed for city scale */
    will-change: background-position;
  }
  .animate-scanline {
    animation: scanline 8s linear infinite;
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isEmbed = searchParams.get("embed") === "true";
  const [sidebarOpen, setSidebarOpen] = useState(false);
   
  const [winState, setWinState] = useState({
    x: 50,
    y: 50,
    width: 1000,
    height: 700,
  });

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

  if (loading) return <div className="w-full h-screen bg-black flex items-center justify-center text-green-500 font-mono">LOADING SYSTEM...</div>;

  return (
    <>
    <style>{ANIMATION_STYLES}</style>
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden", 
        backgroundColor: "#000",
        overscrollBehavior: "none", 
      }}
    >
      {/* --- BACKGROUND LOOP ENGINE (Using /assets/city_loop.png) --- */}
      {!isEmbed && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            
            {/* 1. THE LOOP PNG LAYER */}
            {/* This div applies the perspective transform AND the mouse parallax */}
            <div 
                style={{
                    position: "absolute",
                    inset: "-50%", // Make it larger than screen to allow movement without edges showing
                    width: "200%",
                    height: "200%",
                    
                    // --- THE IMAGE CONFIGURATION ---
                    backgroundImage: "url('/assets/city_loop.png')", // <--- UPDATED PATH
                    backgroundRepeat: "repeat",
                    backgroundSize: "512px 512px", // Adjust based on your PNG's actual size
                    
                    // --- TRANSFORM: PERSPECTIVE + PARALLAX ---
                    transform: `
                        perspective(500px) 
                        rotateX(60deg) 
                        translateY(-100px) 
                        translateZ(-200px)
                        translateX(${mousePos.x * 100}px) /* Parallax X */
                        translateY(${mousePos.y * 50}px)  /* Parallax Y */
                    `,
                    transformOrigin: "center top",
                }}
                className="animate-texture" // Triggers the infinite scroll animation
            />

            {/* 2. ATMOSPHERE / VIGNETTE */}
            <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,transparent_0%,#000_90%)]" />

            {/* 3. SCANLINES (Optional Video Feel) */}
            <div 
                className="absolute inset-0 z-20 opacity-20 animate-scanline"
                style={{
                    background: "linear-gradient(to bottom, transparent 50%, #0f0 50%)",
                    backgroundSize: "100% 4px"
                }}
            />

            {/* DEBUG READOUT */}
            <div className="fixed bottom-4 right-4 z-[9999] bg-black border border-green-500 p-2 text-[10px] text-green-500 font-mono">
                <p>TEXTURE: /assets/city_loop.png</p>
                <p>PARALLAX: {mousePos.x.toFixed(2)} / {mousePos.y.toFixed(2)}</p>
            </div>
        </div>
      )}

      {/* --- MAIN APP CONTENT --- */}
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
                <DebugButton label="+10,000 XP" onClick={() => addDebugXp(10000)} />
                <DebugButton label="Test Drop (Hard)" onClick={() => handlePongWin('hard')} />
                <DebugButton label="Test Drop (Med)" onClick={() => handlePongWin('medium')} />
              </div>
              
              {/* CENTER UI PLACEHOLDER (With slight parallax) */}
              <div 
                style={{ 
                    position: "absolute", 
                    inset: 0, 
                    zIndex: 1, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`, 
                }}
              >
                <div className="bg-black/90 border border-green-500/50 p-8 backdrop-blur-md text-center shadow-[0_0_30px_rgba(0,255,0,0.2)]">
                    <h1 className="text-green-500 font-mono text-xl tracking-[0.2em] mb-2 animate-pulse">HOME_STUDIO</h1>
                    <p className="text-gray-500 text-xs font-mono">CITY_LOOP LOADED</p>
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
                setWinState({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height),
                  ...position,
                });
              }}
              minWidth={600}
              minHeight={400}
              bounds="parent"
              dragHandleClassName="retro-header" 
              enableUserSelectHack={false} 
              style={{ zIndex: 1000, pointerEvents: "auto" }}
            >
              <div 
                style={{ width: "100%", height: "100%" }}
                onWheel={(e) => e.stopPropagation()} 
              >
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
