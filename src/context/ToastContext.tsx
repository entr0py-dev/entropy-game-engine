"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// --- TYPES ---
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- PROVIDER ---
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* TOAST CONTAINER (Fixed Bottom Right) */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map((toast) => (
          <div key={toast.id} className="retro-window" style={{ width: '250px', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)', animation: 'slideIn 0.2s ease-out' }}>
            <div className="retro-header" style={{ backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#16a34a' : '#000080', fontSize: '10px', padding: '2px 4px' }}>
              <span>{toast.type.toUpperCase()}</span>
              <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>X</button>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#c0c0c0', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Icon based on type */}
              <span style={{ fontSize: '16px' }}>
                {toast.type === 'success' ? '💾' : toast.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

    </ToastContext.Provider>
  );
}

// --- HOOK ---
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
