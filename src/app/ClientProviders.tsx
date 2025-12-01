"use client";

import { GameStateProvider } from "@/context/GameStateContext";
import { ToastProvider } from "@/context/ToastContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GameStateProvider>{children}</GameStateProvider>
    </ToastProvider>
  );
}