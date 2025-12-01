'use client';

import { useState, useEffect } from "react";
import { useGameState } from "@/context/GameStateContext";
import Avatar from "@/components/Avatar";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext"; // NEW IMPORT

// --- PRESETS ---
const SKIN_TONES = ['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#583e2a', '#3b281f'];
const EYE_COLORS = ['#634e34', '#2e536f', '#3d671d', '#7c7c7c', '#6a0dad'];
const HAIR_COLORS = ['#090806', '#3b2f2f', '#8d5524', '#b7a69e', '#eab308', '#d97706', '#94a3b8', '#ef4444'];
const STYLES = ['style1', 'style2', 'style3'];

type OverlayProps = { isOverlay?: boolean; onClose?: () => void };

export default function AvatarStudio({ isOverlay, onClose }: OverlayProps) {
  const { profile, loading, refreshGameState } = useGameState();
  const { showToast } = useToast(); // Hook
  
  // Local State
  const [skin, setSkin] = useState(SKIN_TONES[0]);
  const [eyes, setEyes] = useState(EYE_COLORS[0]);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [hairStyle, setHairStyle] = useState('style1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.skin_tone) setSkin(profile.skin_tone);
      if (profile.eye_color) setEyes(profile.eye_color);
      if (profile.hair_color) setHairColor(profile.hair_color);
      // @ts-ignore 
      if (profile.gender) setGender(profile.gender as 'male' | 'female');
      if (profile.hair_style) setHairStyle(profile.hair_style);
    }
  }, [profile]);

  if (loading || !profile) return <div className="p-10 text-white">Loading...</div>;

  const handleSave = async () => {
    setSaving(true);
    
    // BUG FIX: The logic here is safe, but we'll be explicit.
    // We do NOT include equipped_image in this update payload, so it persists in DB.
    const { error } = await supabase.from('profiles').update({
        skin_tone: skin, 
        eye_color: eyes, 
        hair_color: hairColor, 
        gender: gender, 
        hair_style: hairStyle
    }).eq('id', profile.id);

    if (error) {
        showToast("Error saving profile", "error");
    } else {
        await refreshGameState();
        showToast("Look updated successfully!", "success");
    }
    setSaving(false);
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      
      {/* WINDOW CONTAINER */}
      <div className="retro-window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        <div className="retro-header">
            <span>Profile_Editor.exe</span>
            <div className="retro-btn" style={{ padding: '0 6px', fontSize: '10px', cursor: 'pointer' }} onClick={onClose}>X</div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#c0c0c0', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            
            <div className="flex flex-col md:flex-row gap-8">
                
                {/* LEFT: PREVIEW */}
                <div className="retro-inset" style={{ padding: '30px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <div style={{ transform: 'scale(1.5)', marginBottom: '30px' }}>
                        <Avatar 
                          gender={gender} 
                          skinTone={skin} 
                          eyeColor={eyes} 
                          hairColor={hairColor} 
                          hairStyle={hairStyle} 
                          // FIX: Directly passing profile items to ensure they persist visually
                          equippedImage={profile.equipped_image} 
                          equippedHead={profile.equipped_head}
                          equippedBody={profile.equipped_body}
                          equippedBadge={profile.equipped_badge} // Also pass badge
                          size={150} 
                        />
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
