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

// --- THE INFINITE LOOP ENGINE ---
const ANIMATION_STYLES = `
  /* This moves the track UPWARDS (translateY -50%). 
     Because the track is 200vh tall, moving it -50% moves it exactly 1 full screen height.
     Once it hits -50%, it snaps back to 0% instantly, creating a perfect loop.
  */
  @keyframes infiniteScroll {
    from { transform: translateY(0); }
    to { transform: translateY(-50%); } 
  }

  .loop-track {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    /* Double the screen height so we can stack two images */
    height: 200vh;
    /* Adjust '15s' to change speed (Lower = Faster) */
    animation: infiniteScroll 15s linear infinite; 
    z-index: 0;
  }
  
  .loop-image {
    width: 100%;
    /* Each image takes up exactly one full screen height */
    height: 50%; 
    object-fit: cover;
    display: block;
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
  const isEmbed = searchParams.get("embed") === "true";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [winState, setWinState] = useState({ x: 50, y: 50, width: 1000, height: 700 });

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
        backgroundColor: "#000",
      }}
    >
      {/* --- BACKGROUND LOOP ENGINE --- */}
      {!isEmbed && (
        <div className="absolute inset-0 overflow-hidden">
            
            {/* PARALLAX CONTAINER (Moves slightly with mouse) */}
            <div 
                style={{
                    position: "absolute",
                    inset: "-10%", // Give it some buffer room for parallax movement
                    width: "120%",
                    height: "120%",
                    transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
                }}
            >
                {/* THE MOVING TRACK */}
                <div className="loop-track">
                     {/* Image 1 (Current) */}
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img 
                        src="/assets/city_loop.png" 
                        alt="City Loop 1"
                        className="loop-image"
                     />
                     {/* Image 2 (Next in line) */}
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img 
                        src="/assets/city_loop.png" 
                        alt="City Loop 2"
                        className="loop-image"
                     />
                </div>
            </div>

            {/* ATMOSPHERE OVERLAYS */}
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-10 pointer-events-none" />
            
            {/* Green Tint / Scanlines */}
            <div className="absolute inset-0 bg-green-900/10 mix-blend-overlay z-10 pointer-events-none" />
            
            {/* Text Overlay */}
            <div className="absolute top-10 left-10 z-20 pointer-events-none">
                 <h1 className="text-white/50 text-xs tracking-widest font-mono">LOCATION: LEEDS_DNB_HQ</h1>
            </div>
        </div>
      )}

      {/* --- MAIN APP CONTENT --- */}
      <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", zIndex: 30 }}>
        
        <div style={{ flex: 1, position: "relative", marginRight: !isEmbed || sidebarOpen ? "320px" : "0", transition: "margin-right 0.3s ease", overflow: "hidden" }}>
          {!isEmbed && (
            <>
              {/* DEBUG TOOLS */}
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 200, display: "flex", gap: "8px" }}>
                <DebugButton label="+10k XP" onClick={() => addDebugXp(10000)} />
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
