'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGameState } from '@/context/GameStateContext';
import { supabase } from '@/lib/supabaseClient';
import Avatar from './Avatar';
import ModifierTimer from './ModifierTimer'; // <--- NEW IMPORT

const FRAMER_URL = "https://entropyofficial.com";

interface SidebarProps {
  startOpen?: boolean;
  onCloseAll: () => void;
}

export default function Sidebar({ startOpen = false, onCloseAll }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(startOpen);
  const { profile, activeWindow, setActiveWindow } = useGameState();
  const router = useRouter();
  const pathname = usePathname();

  // Sync state if the prop changes (e.g. navigation updates)
  useEffect(() => {
    if (startOpen) setIsOpen(true);
  }, [startOpen]);

  // Helper to open window and close sidebar
  const openWindow = (w: 'none' | 'inventory' | 'shop' | 'quests' | 'profile') => {
    if (w === 'none') {
      onCloseAll(); // Call the parent close function
      return;
    }
    setActiveWindow(w);
    if (!startOpen) setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger (Only show if NOT in forced open mode, or if sidebar is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="retro-btn"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            width: '50px',
            height: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <div style={{ width: '24px', height: '3px', background: 'black' }} />
          <div style={{ width: '24px', height: '3px', background: 'black' }} />
          <div style={{ width: '24px', height: '3px', background: 'black' }} />
        </button>
      )}

      {/* Sidebar Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '320px',
          backgroundColor: '#c0c0c0',
          borderLeft: '2px solid white',
          boxShadow: '-4px 0 10px rgba(0,0,0,0.5)',
          zIndex: 9998,
          // If startOpen is true, we disable the transition transform so it just "appears"
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: startOpen ? 'none' : 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="retro-header" style={{ height: '40px', flexShrink: 0 }}>
          <span>SysInfo.exe</span>
          <button
            onClick={onCloseAll}
            className="retro-btn"
            style={{ padding: '0 8px', fontSize: '12px' }}
          >
            X
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* User Profile Card */}
          {profile ? (
            <div
              className="retro-inset"
              style={{
                padding: '16px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* MODIFIED: Added position relative container and Badge Logic */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <Avatar
                  gender={profile.gender}
                  skinTone={profile.skin_tone}
                  eyeColor={profile.eye_color}
                  hairColor={profile.hair_color}
                  hairStyle={profile.hair_style}
                  equippedImage={profile.equipped_image}
                  equippedHead={profile.equipped_head}
                  equippedBody={profile.equipped_body}
                  size={100}
                />
                {/* Badge Overlay (Bottom Right) */}
                {profile.equipped_badge && (
                    <div style={{ 
                        position: 'absolute', 
                        bottom: -10, 
                        right: -10, 
                        width: '40px', 
                        height: '40px', 
                        zIndex: 10,
                        filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))' 
                    }}>
                        <Avatar 
                            equippedBadge={profile.equipped_badge} 
                            renderMode="badge" 
                            size={40} 
                        />
                    </div>
                )}
              </div>

              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '18px',
                  borderBottom: '1px solid #ccc',
                  width: '100%',
                  textAlign: 'center',
                  marginBottom: '8px',
                }}
              >
                {profile.username}
              </div>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                <span>LVL {profile.level}</span>
                <span style={{ color: '#1e293b' }}>{profile.entrobucks} EB</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  background: '#d1d5db',
                  border: '1px solid #9ca3af',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (profile.xp / (profile.level * 500)) * 100)}%`,
                    background: 'linear-gradient(90deg, #1d4ed8, #7c3aed)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ width: '100%', textAlign: 'right', fontSize: '10px', marginTop: '4px' }}>
                {profile.xp} / {profile.level * 500} XP
              </div>

              {/* --- NEW: ACTIVE MODIFIERS --- */}
              {profile.duplication_expires_at && new Date(profile.duplication_expires_at) > new Date() && (
                  <ModifierTimer expiry={profile.duplication_expires_at} />
              )}

            </div>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center' }}>Loading...</div>
          )}

          {/* Navigation Buttons (Not Links) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SidebarBtn label="Home Studio" active={activeWindow === 'none'} onClick={() => openWindow('none')} />
            <SidebarBtn label="Marketplace" active={activeWindow === 'shop'} onClick={() => openWindow('shop')} />
            <SidebarBtn label="Inventory" active={activeWindow === 'inventory'} onClick={() => openWindow('inventory')} />
            <SidebarBtn label="Mission Log" active={activeWindow === 'quests'} onClick={() => openWindow('quests')} />
            <div
              style={{
                height: '2px',
                background: '#808080',
                borderBottom: '1px solid white',
                margin: '8px 0',
              }}
            />
            <SidebarBtn label="Profile" active={activeWindow === 'profile'} onClick={() => openWindow('profile')} />
          </nav>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #808080',
            backgroundColor: '#c0c0c0',
          }}
        >
          <button
            onClick={() => {
              supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="retro-btn"
            style={{ width: '100%', color: '#991b1b' }}
          >
            Log Off
          </button>
        </div>
      </div>

      {/* Backdrop (Only show if not forced open) */}
      {!startOpen && isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9990 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function SidebarBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        fontWeight: 'bold',
        textAlign: 'left',
        border: active ? '1px dotted white' : '2px solid transparent',
        backgroundColor: active ? '#000080' : 'transparent',
        color: active ? 'white' : 'black',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      {label}
    </button>
  );
}
