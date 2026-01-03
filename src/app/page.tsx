"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGameState } from "@/context/GameStateContext";
import { Rnd } from "react-rnd";
import InventoryPage from "./inventory/page";
import ShopPage from "./shop/page";
import QuestLogPage from "./quests/page";
import AvatarStudio from "./profile/page";
import MusicPlayer from "@/components/MusicPlayer";
import Sidebar from "@/components/Sidebar";

function GameEngineContent() {
  const { activeWindow, setActiveWindow } = useGameState();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Window State
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
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden", 
        backgroundColor: "#ff00ff", // HOT PINK
      }}
    >
      {/* --- STATIC IMAGE TEST --- */}
      {!isEmbed && (
        <div 
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                zIndex: 0
            }}
        >
            <h1 style={{ color: "white", background: "black", padding: "10px", marginBottom: "20px" }}>
                STATIC IMAGE TEST
            </h1>

            {/* THE IMAGE - HARDCODED SIZE */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
                src="/assets/city_loop.png" 
                alt="Test Render"
                style={{ 
                    width: "500px", 
                    height: "500px", 
                    objectFit: "cover", 
                    border: "10px solid #00ff00", // GIANT GREEN BORDER
                    backgroundColor: "black"
                }}
            />
            
            <p style={{ marginTop: "20px", background: "white", padding: "5px" }}>
                Path: /assets/city_loop.png
            </p>
        </div>
      )}

      {/* --- APP CONTENT --- */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", height: "100%" }}>
         {/* Draggable Window Logic (Kept for compatibility) */}
         {activeWindow !== "none" && (
            <Rnd
              size={{ width: winState.width, height: winState.height }}
              position={{ x: winState.x, y: winState.y }}
              onDragStop={(e, d) => setWinState(prev => ({ ...prev, x: d.x, y: d.y }))}
              onResizeStop={(e, direction, ref, delta, position) => {
                setWinState({ width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...position });
              }}
              minWidth={600} minHeight={400} bounds="parent"
              style={{ zIndex: 1000, pointerEvents: "auto" }}
            >
              <div style={{ width: "100%", height: "100%" }}>
                {activeWindow === "inventory" && <InventoryPage isOverlay onClose={handleCloseApp} />}
                {activeWindow === "shop" && <ShopPage isOverlay onClose={handleCloseApp} />}
                {activeWindow === "quests" && <QuestLogPage isOverlay onClose={handleCloseApp} />}
                {activeWindow === "profile" && <AvatarStudio isOverlay onClose={handleCloseApp} />}
              </div>
            </Rnd>
          )}
          
          {(!isEmbed || sidebarOpen) && (
             <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "320px", zIndex: 1500 }}>
                <Sidebar startOpen={sidebarOpen} onCloseAll={handleCloseApp} />
             </div>
          )}
          
          <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 2000 }}>
            <MusicPlayer />
          </div>
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
