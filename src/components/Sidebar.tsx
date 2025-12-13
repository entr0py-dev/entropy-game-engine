'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGameState } from '@/context/GameStateContext';
import { supabase } from '@/lib/supabaseClient';
import Avatar from './Avatar';
import ModifierTimer from './ModifierTimer';

// Define the storage key matching supabaseClient.ts
const STORAGE_KEY = "entropy-auth-token";

interface SidebarProps {
  startOpen?: boolean;
  onCloseAll: () => void;
}

export default function Sidebar({ startOpen = false, onCloseAll }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(startOpen);
  const { profile, activeWindow, setActiveWindow, session, loading, refreshGameState } = useGameState();
  const [isRepairing, setIsRepairing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Sync state if the prop changes
  useEffect(() => {
    if (startOpen) setIsOpen(true);
  }, [startOpen]);

  const openWindow = (w: 'none' | 'inventory' | 'shop' | 'quests' | 'profile') => {
    if (w === 'none') {
      onCloseAll(); 
      return;
    }
    setActiveWindow(w);
    if (!startOpen) setIsOpen(false);
  };

  // --- MANUAL FIX FOR BROKEN ACCOUNTS ---
  const handleRepairProfile = async () => {
    if (!session?.user) return;
    setIsRepairing(true);

    const randomSuffix = Math.floor(Math.random() * 9999);
    const safeName = `Agent_${randomSuffix}`;

    // Force insert a profile row
    const { error } = await supabase.from("profiles").insert({
        id: session.user.id,
        username: safeName,
        avatar: "default",
        entrobucks: 0,
        xp: 0,
        level: 1,
    });

    if (error) {
        alert("Repair Failed: " + error.message);
    } else {
        await refreshGameState();
    }
    setIsRepairing(false);
  };

  // --- ROBUST LOGOUT FUNCTION ---
  const handleLogout = async () => {
      // 1. Tell Supabase to kill the session on the server/client
      await supabase.auth.signOut();
      
      // 2. FORCE CLEAR LocalStorage (This fixes the "logged back in on refresh" bug)
      if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('supabase.auth.token'); // Safety cleanup
      }

      // 3. Redirect to Home Page (External)
      window.location.href = "https://www.entropyofficial.com";
  };

  // --- RENDER CONTENT BASED ON STATE ---
  const renderContent = () => {
    // 1. LOADING
    if (loading) {
        return (
            <div className="retro-inset" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }}>⏳</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>CONNECTING TO ENTROPY...</div>
                <style jsx>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // 2. LOGGED OUT (Session Expired or Guest)
    if (!session) {
        return (
            <div className="retro-inset" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fee2e2', border: '2px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>🚫</div>
                <div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '12px' }}>SIGNAL LOST</div>
                <p style={{ fontSize: '10px' }}>Authentication token expired or missing.</p>
                <button 
                    onClick={() => window.location.href = '/login'}
                    className="retro-btn"
                    style={{ width: '100%', fontSize: '10px' }}
                >
                    RE-ESTABLISH LINK
                </button>
            </div>
        );
    }

    // 3. ZOMBIE ACCOUNT (Logged In, But No Profile)
    if (session && !profile) {
        return (
            <div className="retro-inset" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fef3c7', border: '2px solid #d97706', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>⚠️</div>
                <div style={{ fontWeight: 'bold', color: '#92400e', fontSize: '12px' }}>DATA CORRUPTION</div>
                <p style={{ fontSize: '10px' }}>Identity matrix missing for this operative.</p>
                <button 
                    onClick={handleRepairProfile}
                    className="retro-btn"
                    disabled={isRepairing}
                    style={{ width: '100%', fontSize: '10px', backgroundColor: '#d97706', color: 'white' }}
                >
                    {isRepairing ? "REPAIRING..." : "INITIALIZE AGENT"}
                </button>
            </div>
        );
    }

    // 4. NORMAL PROFILE
    return (
        <>
            <div className="retro-inset" style={{ padding: '16px', backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: '16px', position: 'relative' }}>
                    <Avatar 
                        gender={profile!.gender} skinTone={profile!.skin_tone} eyeColor={profile!.eye_color} 
                        hairColor={profile!.hair_color} hairStyle={profile!.hair_style} 
                        equippedImage={profile!.equipped_image} equippedHead={profile!.equipped_head} equippedBody={profile!.equipped_body} 
                        size={100} 
                    />
                    {profile!.equipped_badge && (
                        <div style={{ position: 'absolute', bottom: -10, right: -10, width: '40px', height: '40px', zIndex: 10, filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))' }}>
                            <Avatar equippedBadge={profile!.equipped_badge} renderMode="badge" size={40} />
                        </div>
                    )}
                </div>

                <div style={{ fontWeight: 'bold', fontSize: '18px', borderBottom: '1px solid #ccc', width: '100%', textAlign: 'center', marginBottom: '8px' }}>
                    {profile!.username}
                </div>
                
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                    <span>LVL {profile!.level}</span>
                    <span style={{ color: '#1e293b' }}>{profile!.entrobucks} EB</span>
                </div>
                
                {/* XP BAR UPDATED TO USE 132 MULTIPLIER */}
                <div style={{ width: '100%', height: '10px', background: '#d1d5db', border: '1px solid #9ca3af', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (profile!.xp / (profile!.level * 263)) * 100)}%`, background: 'linear-gradient(90deg, #1d4ed8, #7c3aed)', transition: 'width 0.5s ease' }} />
                </div>
                
                <div style={{ width: '100%', textAlign: 'right', fontSize: '10px', marginTop: '4px' }}>
                    {profile!.xp} / {profile!.level * 263} XP
                </div>

                {profile!.duplication_expires_at && new Date(profile!.duplication_expires_at) > new Date() && (
                    <ModifierTimer expiry={profile!.duplication_expires_at} />
                )}
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                <SidebarBtn label="Home Studio" active={activeWindow === 'none'} onClick={() => openWindow('none')} />
                <SidebarBtn label="Marketplace" active={activeWindow === 'shop'} onClick={() => openWindow('shop')} />
                <SidebarBtn label="Inventory" active={activeWindow === 'inventory'} onClick={() => openWindow('inventory')} />
                <SidebarBtn label="Mission Log" active={activeWindow === 'quests'} onClick={() => openWindow('quests')} />
                <div style={{ height: '2px', background: '#808080', borderBottom: '1px solid white', margin: '8px 0' }} />
                <SidebarBtn label="Profile" active={activeWindow === 'profile'} onClick={() => openWindow('profile')} />
            </nav>
        </>
    );
  };

  return (
    <>
      {/* Hamburger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="retro-btn"
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, width: '50px', height: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <div style={{ width: '24px', height: '3px', background: 'black' }} />
          <div style={{ width: '24px', height: '3px', background: 'black' }} />
          <div style={{ width: '24px', height: '3px', background: 'black' }} />
        </button>
      )}

      {/* Panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px', backgroundColor: '#c0c0c0', borderLeft: '2px solid white', boxShadow: '-4px 0 10px rgba(0,0,0,0.5)', zIndex: 9998, transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: startOpen ? 'none' : 'transform 0.3s ease-in-out', display: 'flex', flexDirection: 'column' }}>
        
        <div className="retro-header" style={{ height: '40px', flexShrink: 0 }}>
          <span>SysInfo.exe</span>
          <button onClick={onCloseAll} className="retro-btn" style={{ padding: '0 8px', fontSize: '12px' }}>X</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {renderContent()}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #808080', backgroundColor: '#c0c0c0' }}>
          <button
            onClick={handleLogout}
            className="retro-btn"
            style={{ width: '100%', color: '#991b1b' }}
          >
            Log Off
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {!startOpen && isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9990 }} onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}

function SidebarBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 12px', fontWeight: 'bold', textAlign: 'left', border: active ? '1px dotted white' : '2px solid transparent', backgroundColor: active ? '#000080' : 'transparent', color: active ? 'white' : 'black', cursor: 'pointer', width: '100%' }}>
      {label}
    </button>
  );
}
