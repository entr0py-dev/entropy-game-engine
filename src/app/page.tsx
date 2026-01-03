// PATCH 6: Fixed XP debug function consistency
// Changes:
// - Uses consistent XP_PER_LEVEL = 263
// - Better error handling

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

// FIXED: Centralized constant
const XP_PER_LEVEL = 263;

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

  // FIXED: Consistent XP formula
  async function addDebugXp(amount: number) {
    if (!session?.user || !profile) return;

    try {
      // Try RPC first
      const { error: rpcError } = await supabase.rpc("add_xp", {
        user_id: session.user.id,
        amount,
      });

      // If RPC fails, use fallback logic
      if (rpcError) {
        console.warn("RPC failed, using client fallback:", rpcError);
        let xpPool = (profile.xp ?? 0) + amount;
        let level = profile.level ?? 1;
        let threshold = level * XP_PER_LEVEL; 
        // FIXED: Using constant

        while (xpPool >= threshold) {
          xpPool -= threshold;
          level += 1;
          threshold = level * XP_PER_LEVEL; // FIXED: Using constant
        }

        await supabase
          .from("profiles")
          .update({ xp: xpPool, level })
          .eq("id", session.user.id);
      }
      
      await refreshGameState();
    } catch (error) {
      console.error("Debug XP add failed:", error);
    }
  }

  useEffect(() => {
    async function ensureProfile() {
      if (loading || creatingProfile.current || hasTriedCreating.current) return;
      if (!session?.user || profile) return;

      creatingProfile.current = true;
      hasTriedCreating.current = true; 

      const rawName = session.user.email?.split("@")[0] || "operative";
      const safeName = rawName.replace(/[^a-zA-Z0-9_]/g, "");
      
      try {
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
      } catch (error) {
        console.error("Profile creation error:", error);
      } finally {
        creatingProfile.current = false;
      }
    }
    void ensureProfile();
  }, [loading, session, profile, refreshGameState]);

  if (loading) return <div className="w-full h-screen bg-[#008080] flex items-center justify-center text-white font-mono">LOADING SYSTEM...</div>;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden", 
        backgroundColor: isEmbed ? "transparent" : "#008080",
        overscrollBehavior: "none", 
      }}
    >
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        
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
              
              <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ padding: "20px", backgroundColor: "#ff00ff", color: "white", border: "4px solid white", fontWeight: "bold" }}>
                  HOME STUDIO PLACEHOLDER
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
