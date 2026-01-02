"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import Avatar from '@/components/Avatar';

type ToastType = 'success' | 'error' | 'info' | 'quest';

interface ToastData {
  xp?: number;
  entrobucks?: number;
  itemName?: string;
  profile?: any;
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', data?: ToastData) => {
    console.log("🎯 ToastContext.showToast called:", { message, type, data });
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, data }]);
    
    const duration = type === 'quest' ? 6000 : 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // ADD: Message listener for Framer postMessage
  useEffect(() => {
    console.log("👂 ToastContext: Setting up message listener...");
    
    const handleMessage = (event: MessageEvent) => {
      console.log("📩 ToastContext received message:", event.data);
      
      // Accept from any origin for debugging
      // if (event.origin !== "https://www.entropyofficial.com") {
      //     console.warn("Rejected message from:", event.origin);
      //     return;
      // }

      if (event.data?.type === "SHOW_TOAST") {
        console.log("✅ Valid SHOW_TOAST message detected!");
        const { message, toastType, data } = event.data.payload;
        showToast(message, toastType, data);
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("✅ Message listener active");

    return () => {
      window.removeEventListener("message", handleMessage);
      console.log("🔇 Message listener removed");
    };
  }, [showToast]);

  const renderItemPreview = (name: string, profile: any) => {
    if (!profile) return null;
    
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
      
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
        {toasts.map((toast) => (
          <div key={toast.id} className="retro-window" style={{ 
              width: toast.type === 'quest' ? '300px' : '250px', 
              boxShadow: '4px 4px 0px rgba(0,0,0,0.5)', 
              animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' 
          }}>
            
            <div className="retro-header" style={{ 
                backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#16a34a' : toast.type === 'quest' ? '#d97706' : '#000080', 
                fontSize: '10px', padding: '2px 4px', display: 'flex', justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {toast.type === 'quest' ? '★ QUEST COMPLETE ★' : toast.type.toUpperCase()}
              </span>
              <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>X</button>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#c0c0c0', fontSize: '12px', color: 'black', display: 'flex', gap: '12px', alignItems: 'center' }}>
              
              {toast.type === 'quest' ? (
                  <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                      {toast.data?.itemName ? (
                          renderItemPreview(toast.data.itemName, toast.data.profile)
                      ) : (
                          <div style={{ fontSize: '24px' }}>🏆</div>
                      )}

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

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
