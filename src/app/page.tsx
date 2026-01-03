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

  // --- PARALLAX STATE ---
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // --- STATE ---
  const isEmbed = searchParams.get("embed") === "true";
  const [sidebarOpen, setSidebarOpen] = useState(false);
   
  // Window State
  const [winState, setWinState] = useState({
    x: 50,
    y: 50,
    width: 1000,
    height: 700,
  });

  // Sync URL params
  useEffect(() => {
    const win = searchParams.get("window");
    const side = searchParams.get("sidebar") === "true";
    if (win) setActiveWindow(win as any);
    if (side) setSidebarOpen(true);
  }, [searchParams, setActiveWindow]);

  // Handle Close
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

    const { error: rpcError } = await supabase.rpc("add_xp", {
      user_id: session.user.id,
      amount,
    });

    if (rpcError) {
       console.warn("RPC failed, using client fallback");
       let xpPool = (profile.xp ?? 0) + amount;
       let level = profile.level ?? 1;
       let threshold = level * 263;

       while (xpPool >= threshold) {
         xpPool -= threshold;
         level += 1;
         threshold = level * 263;
       }

       await supabase
         .from("profiles")
         .update({ xp: xpPool, level })
         .eq("id", session.user.id);
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
        id: session.user.id,
        username: safeName,
        avatar: "default",
        entrobucks: 0,
        xp: 0,
        level: 1,
      });

      if (error) {
          console.error("Profile creation failed (stopping retry loop):", error.message);
      } else {
          await refreshGameState();
      }
      creatingProfile.current = false;
    }
    void ensureProfile();
  }, [loading, session, profile, refreshGameState]);

  // --- PARALLAX EVENT LISTENER ---
  useEffect(() => {
    if (isEmbed) return; 

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized position (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isEmbed]);

  if (loading) return <div className="w-full h-screen bg-[#008080] flex items-center justify-center text-white font-mono">LOADING SYSTEM...</div>;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden", 
        backgroundColor: "#111", // Dark gray base so black grid lines show up
        overscrollBehavior: "none", 
      }}
    >
      {/* --- PARALLAX LAYERS (Only show if not embedded) --- */}
      {!isEmbed && (
        <>
            {/* Layer 1: Bright Green Grid (The Floor) */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    zIndex: 0,
                    opacity: 0.4,
                    // Bright green grid lines on transparent bg
                    backgroundImage: `
                        linear-gradient(to right, #00ff00 1px, transparent 1px),
                        linear-gradient(to bottom, #00ff00 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                    // Moves opposite to mouse (-20px range)
                    transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px) scale(1.1)`,
                    transition: "transform 0.1s ease-out"
                }}
            />
            
            {/* Layer 2: Floating Objects (Mid-Ground) */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    zIndex: 1,
                    // Moves faster than grid (-50px range)
                    transform: `translate(${mousePos.x * -50}px, ${mousePos.y * -50}px)`,
                    transition: "transform 0.1s ease-out"
                }}
            >
                {/* Bright Pink Box Top-Left */}
                <div 
                    className="absolute top-20 left-20 w-32 h-32 border-2 border-pink-500 bg-pink-500/20" 
                    style={{ transform: "rotate(15deg)" }}
                />
                
                {/* Bright Cyan Circle Bottom-Right */}
                <div 
                    className="absolute bottom-40 right-40 w-48 h-48 border-2 border-cyan-500 rounded-full bg-cyan-500/20" 
                />
                
                {/* Center "Void" Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-900 font-bold text-9xl opacity-20">
                    ENTROPY
                </div>
            </div>

            {/* DEBUG READOUT */}
            <div className="fixed bottom-4 right-4 z-[9999] bg-white border-2 border-red-600 p-4 text-xs text-black font-mono font-bold shadow-lg">
                <p>/// PARALLAX ACTIVE ///</p>
                <p>MOUSE X: {mousePos.x.toFixed(2)}</p>
                <p>MOUSE Y: {mousePos.y.toFixed(2)}</p>
                <p>GRID SHIFT: {(mousePos.x * -20).toFixed(0)}px</p>
            </div>
        </>
      )}

      {/* MAIN CONTENT LAYER */}
      <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", zIndex: 10 }}>
        
        {/* DESKTOP AREA */}
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
              
              {/* CENTER UI BOX (Also Parallaxed slightly) */}
              <div 
                style={{ 
                    position: "absolute", 
                    inset: 0, 
                    zIndex: 1, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    // Moves WITH mouse slightly (5px range) to create 3D depth against background
                    transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
                    transition: "transform 0.1s ease-out"
                }}
              >
                <div style={{ padding: "40px", backgroundColor: "rgba(0,0,0,0.8)", color: "#0f0", border: "1px solid #0f0", fontFamily: "monospace", boxShadow: "0 0 50px rgba(0,255,0,0.2)" }}>
                   <h1 className="text-2xl font-bold mb-2">HOME_STUDIO // PLACEHOLDER</h1>
                   <p className="text-sm text-gray-400">Move mouse to test parallax depth.</p>
                </div>
              </div>
            </>
          )}

          {/* DRAGGABLE WINDOW */}
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

          {/* MUSIC PLAYER */}
          <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 2000 }}>
            <MusicPlayer />
          </div>
        </div>

        {/* SIDEBAR */}
        {(!isEmbed || sidebarOpen) && (
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "320px", zIndex: 1500 }}>
            <Sidebar startOpen={sidebarOpen} onCloseAll={handleCloseApp} />
          </div>
        )}
      </div>
    </div>
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
