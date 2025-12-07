"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Avatar from '@/components/Avatar'; // Import Avatar for item previews

// --- TYPES ---
type ToastType = 'success' | 'error' | 'info' | 'quest';

interface ToastData {
  xp?: number;
  entrobucks?: number;
  itemName?: string;
  profile?: any; // Needed to render the avatar preview correctly
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  data?: ToastData;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, data?: ToastData) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- PROVIDER ---
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', data?: ToastData) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, data }]);
    
    // --- ADD THIS BLOCK ---
    // Send signal to Framer Parent (GlobalToaster)
    if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage({
            type: 'SHOW_TOAST',
            payload: { message, toastType: type, data }
        }, '*');
    }
    // ----------------------
    
    // Auto-dismiss standard messages quickly, but keep Quests longer (6s) to read rewards
    const duration = type === 'quest' ? 6000 : 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Helper to render item preview (Borrowed logic from InventoryCard)
  const renderItemPreview = (name: string, profile: any) => {
    if (!profile) return null;
    
    // Guess slot based on name (simple heuristic since we don't have full item DB here)
    let renderMode: 'head' | 'face' | 'body' | 'badge' = 'body';
    let transformStyle = 'scale(1.5) translateY(-10px)';

    const lower = name.toLowerCase();
    if (lower.includes('hat') || lower.includes('cap') || lower.includes('fez') || lower.includes('head')) {
        renderMode = 'head';
        transformStyle = 'scale(1.5) translateY(10px)';
    } else if (lower.includes('glasses') || lower.includes('goggles') || lower.includes('shade') || lower.includes('moustache')) {
        renderMode = 'face';
        transformStyle = 'scale(2.2) translateY(5px)';
    } else if (lower.includes('badge') || lower.includes('amulet') || lower.includes('coin') || lower.includes('die')) {
        renderMode = 'badge';
        transformStyle = 'scale(1.5)';
    }

    return (
        <div style={{ width: '50px', height: '50px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '2px inset #ccc' }}>
            <div style={{ transform: transformStyle }}>
                <Avatar 
                    gender={profile.gender} 
                    skinTone={profile.skin_tone} 
                    eyeColor={profile.eye_color} 
                    hairColor={profile.hair_color} 
                    hairStyle={profile.hair_style}
                    equippedHead={renderMode === 'head' ? name : profile.equipped_head}
                    equippedImage={renderMode === 'face' ? name : profile.equipped_image}
                    equippedBody={renderMode === 'body' ? name : profile.equipped_body}
                    equippedBadge={renderMode === 'badge' ? name : profile.equipped_badge}
                    renderMode={renderMode}
                    size={40}
                />
            </div>
        </div>
    );
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* TOAST CONTAINER (Fixed Bottom Right) */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
        {toasts.map((toast) => (
          <div key={toast.id} className="retro-window" style={{ 
              width: toast.type === 'quest' ? '300px' : '250px', 
              boxShadow: '4px 4px 0px rgba(0,0,0,0.5)', 
              animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' 
          }}>
            
            {/* HEADER */}
            <div className="retro-header" style={{ 
                backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#16a34a' : toast.type === 'quest' ? '#d97706' : '#000080', 
                fontSize: '10px', padding: '2px 4px', display: 'flex', justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {toast.type === 'quest' ? '★ QUEST COMPLETE ★' : toast.type.toUpperCase()}
              </span>
              <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>X</button>
            </div>

            {/* BODY */}
            <div style={{ padding: '12px', backgroundColor: '#c0c0c0', fontSize: '12px', color: 'black', display: 'flex', gap: '12px', alignItems: 'center' }}>
              
              {/* QUEST REWARD LAYOUT */}
              {toast.type === 'quest' ? (
                  <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                      {/* Left: Item Preview (if any) or Generic Icon */}
                      {toast.data?.itemName ? (
                          renderItemPreview(toast.data.itemName, toast.data.profile)
                      ) : (
                          <div style={{ fontSize: '24px' }}>🏆</div>
                      )}

                      {/* Right: Text Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                          <span style={{ fontWeight: 'bold', fontSize: '13px', lineHeight: '1.1' }}>{toast.message}</span>
                          
                          <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {toast.data?.xp ? (
                                  <span style={{ backgroundColor: '#22c55e', color: 'white', padding: '1px 4px', borderRadius: '2px', fontSize: '9px', fontWeight: 'bold' }}>
                                      +{toast.data.xp} XP
                                  </span>
                              ) : null}
                              {toast.data?.entrobucks ? (
                                  <span style={{ backgroundColor: '#eab308', color: 'black', padding: '1px 4px', borderRadius: '2px', fontSize: '9px', fontWeight: 'bold' }}>
                                      +{toast.data.entrobucks} EB
                                  </span>
                              ) : null}
                          </div>
                          {toast.data?.itemName && (
                              <span style={{ fontSize: '10px', color: '#6b21a8', fontWeight: 'bold', marginTop: '2px' }}>
                                  UNLOCKED: {toast.data.itemName}
                              </span>
                          )}
                      </div>
                  </div>
              ) : (
                  /* STANDARD TOAST LAYOUT */
                  <>
                    <span style={{ fontSize: '16px' }}>
                        {toast.type === 'success' ? '💾' : toast.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>{toast.message}</span>
                  </>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// --- HOOK ---
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
