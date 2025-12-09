'use client';

import { useState, useEffect } from "react";
import { useGameState } from "@/context/GameStateContext";
import Avatar from "@/components/Avatar";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext"; 

// --- PRESETS ---
const SKIN_TONES = ['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#583e2a', '#3b281f'];
const EYE_COLORS = ['#634e34', '#2e536f', '#3d671d', '#7c7c7c', '#6a0dad'];
const HAIR_COLORS = ['#090806', '#3b2f2f', '#8d5524', '#b7a69e', '#eab308', '#d97706', '#94a3b8', '#ef4444'];
const STYLES = ['style1', 'style2', 'style3'];
const BANNED_TERMS = ["admin", "mod", "system", "sys", "fuck", "shit", "cunt", "nigger", "faggot", "dick", "pussy", "whore"];

type OverlayProps = { isOverlay?: boolean; onClose?: () => void };

export default function AvatarStudio({ isOverlay, onClose }: OverlayProps) {
  const { profile, loading, refreshGameState } = useGameState();
  const { showToast } = useToast(); 
  
  // Local State
  const [skin, setSkin] = useState(SKIN_TONES[0]);
  const [eyes, setEyes] = useState(EYE_COLORS[0]);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [hairStyle, setHairStyle] = useState('style1');
  
  // --- NEW: USERNAME STATE ---
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.skin_tone) setSkin(profile.skin_tone);
      if (profile.eye_color) setEyes(profile.eye_color);
      if (profile.hair_color) setHairColor(profile.hair_color);
      // @ts-ignore 
      if (profile.gender) setGender(profile.gender as 'male' | 'female');
      if (profile.hair_style) setHairStyle(profile.hair_style);
      
      // Load current username
      if (profile.username) setUsername(profile.username);
    }
  }, [profile]);

  if (loading || !profile) return <div className="p-10 text-white">Loading...</div>;

  const validateUsername = (name: string) => {
    const lower = name.toLowerCase().trim();
    if (lower.length < 3) return "Name too short (min 3).";
    if (lower.length > 16) return "Name too long (max 16).";
    if (!/^[a-zA-Z0-9_-]+$/.test(lower)) return "Letters & numbers only.";
    if (BANNED_TERMS.some(term => lower.includes(term))) return "Name restricted.";
    return null;
  };

  const handleSave = async () => {
    setUsernameError("");
    
    // 1. Validate Username
    const nameError = validateUsername(username);
    if (nameError) {
        setUsernameError(nameError);
        return;
    }

    setSaving(true);
    
    // 2. Prepare Update Payload (Now includes username)
    const updates: any = {
        skin_tone: skin, 
        eye_color: eyes, 
        hair_color: hairColor, 
        gender: gender, 
        hair_style: hairStyle
    };

    // Only update username if it changed
    if (username !== profile.username) {
        updates.username = username;
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);

    if (error) {
        if (error.code === "23505") { // Unique violation code
            setUsernameError("Username already taken.");
        } else {
            showToast("Error saving profile", "error");
        }
    } else {
        await refreshGameState();
        showToast("Identity Updated!", "success");
        if (onClose) onClose();
    }
    setSaving(false);
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      
      {/* WINDOW CONTAINER */}
      <div className="retro-window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        <div className="retro-header">
            <span>Identity_Editor.exe</span>
            <div className="retro-btn" style={{ padding: '0 6px', fontSize: '10px', cursor: 'pointer' }} onClick={onClose}>X</div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#c0c0c0', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            
            <div className="flex flex-col md:flex-row gap-8">
                
                {/* LEFT: PREVIEW & USERNAME */}
                <div className="retro-inset" style={{ padding: '30px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '20px' }}>
                    <div style={{ transform: 'scale(1.5)', marginBottom: '10px' }}>
                        <Avatar 
                          gender={gender} 
                          skinTone={skin} 
                          eyeColor={eyes} 
                          hairColor={hairColor} 
                          hairStyle={hairStyle} 
                          equippedImage={profile.equipped_image} 
                          equippedHead={profile.equipped_head}
                          equippedBody={profile.equipped_body}
                          equippedBadge={profile.equipped_badge} 
                          size={150} 
                        />
                    </div>
                    
                    {/* --- USERNAME INPUT --- */}
                    <div style={{ width: '100%', maxWidth: '200px' }}>
                        <label className="text-xs font-bold block mb-1 uppercase text-gray-500">Codename</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="retro-inset"
                            style={{ 
                                width: '100%', padding: '8px', 
                                border: usernameError ? '2px solid red' : undefined,
                                background: '#f0f0f0', fontWeight: 'bold' 
                            }}
                        />
                        {usernameError && <div style={{ color: 'red', fontSize: '10px', marginTop: '4px' }}>{usernameError}</div>}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setGender('male')} className="retro-btn" style={{ backgroundColor: gender === 'male' ? '#808080' : '#c0c0c0', color: gender === 'male' ? 'white' : 'black' }}>MALE</button>
                        <button onClick={() => setGender('female')} className="retro-btn" style={{ backgroundColor: gender === 'female' ? '#808080' : '#c0c0c0', color: gender === 'female' ? 'white' : 'black' }}>FEMALE</button>
                    </div>
                </div>

                {/* RIGHT: CONTROLS */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div>
                        <label className="text-xs font-bold mb-2 block uppercase">Skin Tone</label>
                        <div className="flex flex-wrap gap-2">
                            {SKIN_TONES.map(c => (
                                <button key={c} onClick={() => setSkin(c)} style={{ width: '30px', height: '30px', background: c, border: skin === c ? '2px solid white' : '2px solid #808080', outline: skin === c ? '2px solid black' : 'none' }} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold mb-2 block uppercase">Eye Color</label>
                        <div className="flex flex-wrap gap-2">
                            {EYE_COLORS.map(c => (
                                <button key={c} onClick={() => setEyes(c)} style={{ width: '30px', height: '30px', background: c, border: eyes === c ? '2px solid white' : '2px solid #808080', outline: eyes === c ? '2px solid black' : 'none' }} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold mb-2 block uppercase">Hair Color</label>
                        <div className="flex flex-wrap gap-2">
                            {HAIR_COLORS.map(c => (
                                <button key={c} onClick={() => setHairColor(c)} style={{ width: '30px', height: '30px', background: c, border: hairColor === c ? '2px solid white' : '2px solid #808080', outline: hairColor === c ? '2px solid black' : 'none' }} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold mb-2 block uppercase">Hair Style</label>
                        <div className="flex gap-2">
                            {STYLES.map((style, idx) => (
                                <button key={style} onClick={() => setHairStyle(style)} className="retro-btn" style={{ flex: 1, backgroundColor: hairStyle === style ? '#808080' : '#c0c0c0', color: hairStyle === style ? 'white' : 'black' }}>
                                    TYPE {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: '2px solid white', paddingTop: '20px', marginTop: '10px' }}>
                        <button onClick={handleSave} disabled={saving} className="retro-btn" style={{ width: '100%', padding: '15px' }}>
                            {saving ? 'SAVING...' : 'APPLY CHANGES'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
