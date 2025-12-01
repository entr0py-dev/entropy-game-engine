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
  } = useGameState();

  const searchParams = useSearchParams();
  const creatingProfile = useRef(false);

  // --- STATE ---
  const isEmbed = searchParams.get("embed") === "true";
  // We use local state for the sidebar so we can close it programmatically regardless of the URL parameter
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // --- WINDOW STATE (PERSISTENT SIZE/POSITION) ---
  const [winState, setWinState] = useState({
    x: 100,
    y: 50,
    width: 1000,
    height: 700,
  });

  // Sync URL params on load
  useEffect(() => {
    const win = searchParams.get("window");
    const side = searchParams.get("sidebar") === "true";

    if (win) setActiveWindow(win as any);
    if (side) setSidebarOpen(true);
  }, [searchParams, setActiveWindow]);

  // The "Master Close" function
  const handleCloseApp = () => {
    setActiveWindow("none");
    setSidebarOpen(false);

    // Optional: Send signal to Framer (if you have a listener set up)
    if (window.parent) {
      window.parent.postMessage("CLOSE_OVERLAY", "*");
    }
  };

  // Helper to add XP
  async function addDebugXp(amount: number) {
    if (!session?.user || !profile) return;
    const { error: rpcError } = await supabase.rpc("add_xp", {
      user_id: session.user.id,
      amount,
    });
    if (!rpcError) {
      await refreshGameState();
      return;
    }
    // Fallback logic...
    let xpPool = (profile.xp ?? 0) + amount;
    let level = profile.level ?? 1;
    while (xpPool >= level * 500) {
      xpPool -= level * 500;
      level += 1;
    }
    await supabase
      .from("profiles")
      .update({ xp: xpPool, level })
      .eq("id", session.user.id);
    await refreshGameState();
  }

  // Auth Redirect (Only if NOT embedded - embeds handle auth silently or show empty state)
  useEffect(() => {
    if (!isEmbed && !loading && !session) window.location.href = "/login";
  }, [loading, session, isEmbed]);

  // Profile Creation...
  useEffect(() => {
    async function ensureProfile() {
      if (loading || creatingProfile.current) return;
      if (!session?.user || profile) return;
      creatingProfile.current = true;
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
      if (!error) await refreshGameState();
      creatingProfile.current = false;
    }
    void ensureProfile();
  }, [loading, session, profile, refreshGameState]);

  if (loading) return null; // Render nothing while loading in embed mode

  // --- RENDER LOGIC ---
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: isEmbed ? "transparent" : "#008080",
      }}
    >
      {/* SIDEBAR */}
      {(!isEmbed || sidebarOpen) && <Sidebar startOpen={sidebarOpen} />}

      {/* DEBUG & MUSIC (Only show if NOT embedded) */}
      {!isEmbed && (
        <>
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 200,
              display: "flex",
              gap: "8px",
            }}
          >
            <DebugButton label="+1000 XP" onClick={() => addDebugXp(1000)} />
            <DebugButton label="+10,000 XP" onClick={() => addDebugXp(10000)} />
            <DebugButton
              label="Reset Items"
              onClick={async () => {
                /* reset */
              }}
            />
          </div>

          <MusicPlayer />

          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                padding: "20px",
                backgroundColor: "#ff00ff",
                color: "white",
                border: "4px solid white",
                fontWeight: "bold",
              }}
            >
              HOME STUDIO PLACEHOLDER
            </div>
          </div>
        </>
      )}

      {/* DRAGGABLE WINDOW CONTAINER */}
      {activeWindow !== "none" && (
        <Rnd
          size={{ width: winState.width, height: winState.height }}
          position={{ x: winState.x, y: winState.y }}
          onDragStop={(e, d) =>
            setWinState(prev => ({ ...prev, x: d.x, y: d.y }))
          }
          onResizeStop={(e, direction, ref, delta, position) => {
            setWinState({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
              ...position,
            });
          }}
          minWidth={600}
          minHeight={400}
          bounds="window"
          dragHandleClassName="retro-header"
          style={{ zIndex: 1000, pointerEvents: "auto" }}
        >
          <div style={{ width: "100%", height: "100%" }}>
            {activeWindow === "inventory" && (
              <InventoryPage isOverlay onClose={handleCloseApp} />
            )}
            {activeWindow === "shop" && (
              <ShopPage isOverlay onClose={handleCloseApp} />
            )}
            {activeWindow === "quests" && (
              <QuestLogPage isOverlay onClose={handleCloseApp} />
            )}
            {activeWindow === "profile" && (
              <AvatarStudio isOverlay onClose={handleCloseApp} />
            )}
          </div>
        </Rnd>
      )}
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

// ... DebugButton component ...
function DebugButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-black text-white p-2 border border-gray-500 rounded text-xs"
    >
      {label}
    </button>
  );
}
