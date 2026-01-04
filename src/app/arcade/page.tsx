"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import FlyerRunner from "@/components/minigames/FlyerRunner";
import TunnelView from "@/components/TunnelView";

function ArcadeContent() {
  const searchParams = useSearchParams();
  const game = searchParams.get("game");

  // --- GAME ROUTER ---
  if (game === "flyer") {
      return (
        <div className="relative w-full h-full">
            <Link 
                href="/arcade" 
                className="absolute top-4 right-4 z-[100] bg-black/50 text-white border border-white/20 px-4 py-2 text-xs font-mono hover:bg-red-900/50"
            >
                EXIT TO MENU
            </Link>
            <FlyerRunner />
        </div>
      );
  }

  // --- MENU SCREEN ---
  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-4">
        
        <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="border-b border-green-900 pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-green-500 mb-1">ENTROPY_ARCADE</h1>
                    <p className="text-xs text-gray-500">SELECT CARTRIDGE...</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-green-700 animate-pulse">SYSTEM ONLINE</p>
                </div>
            </div>

            {/* Game Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                
                {/* GAME 1: FLYER RUNNER */}
                <Link href="/arcade?game=flyer" className="group relative block">
                    <div className="absolute inset-0 bg-green-500/20 blur-xl group-hover:bg-green-500/40 transition-all opacity-0 group-hover:opacity-100" />
                    <div className="relative border border-green-800 bg-gray-900/50 p-6 h-64 flex flex-col justify-between group-hover:border-green-400 group-hover:translate-y-[-2px] transition-all">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-white group-hover:text-green-400">FLYER_RUNNER</h2>
                                <span className="bg-green-900 text-green-300 text-[10px] px-2 py-1 rounded">NEW</span>
                            </div>
                            <p className="text-sm text-gray-400">
                                Infinite parallax racer. Pilot your craft through the data-city. Avoid corruption blocks. Collect Entro-coins.
                            </p>
                        </div>
                        <div className="text-xs text-green-600 font-bold tracking-widest group-hover:text-white">
                            CLICK TO START &gt;
                        </div>
                    </div>
                </Link>

                {/* GAME 2: PONG (Placeholder) */}
                <div className="relative border border-gray-800 bg-black p-6 h-64 flex flex-col justify-between opacity-50 grayscale">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-500">PONG_PROTOCOL</h2>
                            <span className="bg-gray-800 text-gray-500 text-[10px] px-2 py-1 rounded">FRAMER ONLY</span>
                        </div>
                        <p className="text-sm text-gray-600">
                            The classic training simulation. Currently hosted on the mainframe (Framer).
                        </p>
                    </div>
                    <div className="text-xs text-gray-700 font-bold tracking-widest">
                        [COMPONENT NOT PORTED]
                    </div>
                </div>

            </div>
            
            {/* Footer */}
            <div className="mt-12 text-center">
                 <Link href="/" className="text-xs text-gray-500 hover:text-white border-b border-transparent hover:border-white transition-all">
                    ← RETURN TO OS DASHBOARD
                 </Link>
            </div>
        </div>
    </div>
  );
}

export default function ArcadePage() {
  return (
    <Suspense fallback={<div className="bg-black h-screen text-green-500 p-10 font-mono">LOADING ARCADE...</div>}>
      <ArcadeContent />
    </Suspense>
  );
}
