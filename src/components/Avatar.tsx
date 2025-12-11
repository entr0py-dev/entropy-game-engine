import React from 'react';

type AvatarProps = {
  gender?: 'male' | 'female' | string;
  skinTone?: string;
  eyeColor?: string;
  hairColor?: string;
  hairStyle?: string; 
  equippedImage?: string | null; // Face
  equippedHead?: string | null;  // Head
  equippedBody?: string | null;  // Body
  equippedBadge?: string | null; // Badges / Modifiers
  size?: number;
  renderMode?: 'full' | 'head' | 'face' | 'body' | 'badge';
};

export default function Avatar({ 
  gender = 'male',
  skinTone = '#ffdbac', 
  eyeColor = '#634e34', 
  hairColor = '#2c222b',
  hairStyle = 'style1',
  equippedImage,
  equippedHead,
  equippedBody,
  equippedBadge,
  size = 120,
  renderMode = 'full'
}: AvatarProps) {

  const lowerBody = equippedBody?.toLowerCase() || '';
  const lowerHead = equippedHead?.toLowerCase() || '';
  const lowerFace = equippedImage?.toLowerCase() || '';
  const lowerBadge = equippedBadge?.toLowerCase() || '';

  // Helper: Should we hide ALL hair? (Full coverage items)
  const hideAllHair = lowerBody.includes('banana') || lowerHead.includes('tin') || lowerHead.includes('boiler');
  
  // HAT LOGIC:
  let hairY = 8; // Default Height

  if (lowerHead.includes('cap') || (lowerHead.includes('hat') && !lowerHead.includes('top'))) {
      hairY = 14; // Caps push hair low
  } else if (lowerHead.includes('top hat')) {
      hairY = 11; // Top Hat Brim is at Y=10
  } else if (lowerHead.includes('sombrero')) {
      hairY = 10; // Sombrero Brim moved up to Y=9
  }

  // --- 0. BADGE / MODIFIER RENDERER ---
  const renderBadge = () => {
     if (renderMode !== 'badge') return null;
     
     // 1. NEURAL PATCH (Floppy Disk)
     if (lowerBadge.includes('neural') || lowerBadge.includes('patch') || lowerBadge.includes('floppy')) {
         return (
             <g>
                 {/* Blue Body */}
                 <rect x="16" y="14" width="32" height="36" rx="2" fill="#000080" stroke="#000" strokeWidth="2" />
                 {/* Metal Shutter */}
                 <rect x="22" y="14" width="20" height="14" fill="#C0C0C0" stroke="#000" strokeWidth="1" />
                 {/* Shutter Detail */}
                 <rect x="26" y="14" width="6" height="10" fill="#222" opacity="0.8" />
                 {/* Write Protect Tab */}
                 <rect x="18" y="44" width="4" height="4" fill="#000" />
                 {/* White Label */}
                 <rect x="20" y="32" width="24" height="12" fill="#FFF" />
                 {/* Text Lines */}
                 <rect x="22" y="35" width="20" height="1" fill="#000" opacity="0.3" />
                 <rect x="22" y="38" width="14" height="1" fill="#000" opacity="0.3" />
                 <rect x="22" y="41" width="18" height="1" fill="#000" opacity="0.3" />
             </g>
         );
     }

     // 2. ENTROPIC INITIATE (Level 10) - Bronze Shield
     if (lowerBadge.includes('initiate')) {
         return (
             <g>
                 <path d="M32 4 L 54 14 V 36 Q 32 60, 10 36 V 14 L 32 4 Z" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
                 <path d="M32 14 L 44 22 V 34 Q 32 50, 20 34 V 22 Z" fill="#fbbf24" opacity="0.8" />
                 <circle cx="32" cy="28" r="4" fill="#fff" />
             </g>
         );
     }

     // 3. ENTROPIC EXPLORER (Level 20) - Silver Compass
     if (lowerBadge.includes('explorer')) {
         return (
             <g>
                 <circle cx="32" cy="32" r="26" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
                 <path d="M32 6 L 40 24 L 58 32 L 40 40 L 32 58 L 24 40 L 6 32 L 24 24 Z" fill="#3b82f6" stroke="#fff" strokeWidth="1" />
                 <circle cx="32" cy="32" r="6" fill="#fff" />
             </g>
         );
     }

     // 4. 8BALLS ADVOCATE (Storyline) - Cracked 8-Ball
     if (lowerBadge.includes('8ball') || lowerBadge.includes('advocate')) {
         return (
             <g>
                 <circle cx="32" cy="32" r="24" fill="#111" stroke="#333" strokeWidth="1" />
                 <circle cx="24" cy="24" r="6" fill="white" opacity="0.1" /> {/* Shine */}
                 <circle cx="32" cy="32" r="10" fill="white" />
                 <text x="32" y="36" fontSize="10" fontWeight="bold" textAnchor="middle" fill="black" fontFamily="monospace">8</text>
                 <path d="M38 12 L 44 20 M 14 38 L 22 42" stroke="#ef4444" strokeWidth="1" /> {/* Cracks */}
             </g>
         );
     }

     // 5. PONG! (Minigame) - Retro Paddle & Ball
     if (lowerBadge.includes('pong')) {
         return (
             <g>
                 <rect x="4" y="4" width="56" height="56" fill="#000" stroke="#fff" strokeWidth="2" />
                 <rect x="8" y="24" width="4" height="16" fill="#fff" /> {/* Player 1 */}
                 <rect x="52" y="16" width="4" height="16" fill="#fff" /> {/* Player 2 */}
                 <rect x="30" y="8" width="4" height="4" fill="#fff" opacity="0.5" /> {/* Net dots */}
                 <rect x="30" y="20" width="4" height="4" fill="#fff" opacity="0.5" />
                 <rect x="30" y="32" width="4" height="4" fill="#fff" opacity="0.5" />
                 <rect x="30" y="44" width="4" height="4" fill="#fff" opacity="0.5" />
                 <rect x="36" y="22" width="4" height="4" fill="#fff" /> {/* Ball */}
             </g>
         );
     }

     // 6. DISTORTED AMULET (Find 8Ball) - Glitchy Purple Artifact
     if (lowerBadge.includes('amulet')) {
         return (
             <g>
                 <path d="M32 4 L 50 16 V 48 L 32 60 L 14 48 V 16 Z" fill="#4c1d95" stroke="#8b5cf6" strokeWidth="2" />
                 <path d="M32 16 L 42 24 L 32 48 L 22 24 Z" fill="#8b5cf6" />
                 {/* Glitch Artifacts */}
                 <rect x="40" y="30" width="10" height="2" fill="#22c55e" />
                 <rect x="12" y="20" width="8" height="2" fill="#ef4444" />
                 <rect x="30" y="10" width="4" height="4" fill="#fff" opacity="0.5" />
             </g>
         );
     }

     // 7. DUPLICATION GLITCH (Multiplier) - Overlapping Coins
     if (lowerBadge.includes('duplication')) {
         return (
             <g>
                 {/* Coin 2 (Ghost/Glitch) - Offset */}
                 <circle cx="38" cy="28" r="14" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 2" />
                 <text x="38" y="32" fontSize="12" textAnchor="middle" fill="#22c55e" opacity="0.5">$</text>
                 
                 {/* Coin 1 (Real) */}
                 <circle cx="26" cy="36" r="14" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                 <text x="26" y="40" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#b45309">$</text>
                 
                 {/* Glitch Lines */}
                 <rect x="10" y="32" width="44" height="1" fill="white" opacity="0.6" />
                 <rect x="10" y="34" width="44" height="1" fill="black" opacity="0.2" />
             </g>
         );
     }

     // 8. 12 SIDED DIE (Multiplier) - Red D12
     if (lowerBadge.includes('die') || lowerBadge.includes('12')) {
         return (
             <g>
                 <path d="M32 4 L 56 20 L 48 52 L 16 52 L 8 20 Z" fill="#dc2626" stroke="#fff" strokeWidth="1" />
                 {/* Internal Facet Lines */}
                 <path d="M32 32 L 32 4 M 32 32 L 8 20 M 32 32 L 56 20 M 32 32 L 16 52 M 32 32 L 48 52" stroke="#fff" strokeWidth="1" opacity="0.8" />
                 <text x="32" y="30" fontSize="8" fontWeight="bold" textAnchor="middle" fill="white">12</text>
             </g>
         );
     }

     // Default / Fallback Icon (Generic Badge)
     return (
         <g>
             <circle cx="32" cy="32" r="20" fill="#cbd5e1" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 2" />
             <text x="32" y="40" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#6b7280">?</text>
         </g>
     );
  };

  // --- 1. BACK LAYER ---
  const renderBackLayer = () => {
    if (renderMode !== 'full' && renderMode !== 'body') return null;

    if (lowerBody.includes('big man jacket')) {
        return <path d="M18 38 C 18 15, 46 15, 46 38 L 54 50 L 10 50 Z" fill="#0a0a0a" stroke="#000" strokeWidth="2" />;
    }
    
    if (lowerBody.includes('banana')) {
        return (
            <g>
                <path d="M16 40 V 4 Q 32 -8, 48 4 V 40 Z" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
                <path d="M30 0 L 34 0 L 36 6 L 28 6 Z" fill="#3f2e00" />
            </g>
        );
    }

    if (lowerBody.includes('boiler') || lowerBody.includes('hazmat')) {
        return <path d="M18 38 H 46 V 45 H 18 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1" />;
    }

    if (gender === 'female' && !hideAllHair && renderMode === 'full') {
       if (hairStyle === 'style1') return null;
       if (hairStyle === 'style2') return <rect x="18" y="20" width="28" height="28" fill={hairColor} />;
       if (hairStyle === 'style3') return <g fill={hairColor}><path d="M16 20 L 12 60 H 52 L 48 20 Z" /></g>;
    }
    return null;
  };

  // --- 2. BODY LAYER ---
  const renderBody = () => {
    if (renderMode !== 'full' && renderMode !== 'body') return null;

    let shirtColor = gender === 'male' ? '#334155' : '#475569'; 
    let isStandardShirt = true;
    let isTankTop = false;
    let customGraphic = null;

    const shoulderX = gender === 'female' ? 18 : 16;
    const shoulderW = gender === 'female' ? 28 : 32;

    if (equippedBody) {
        if (lowerBody.includes('white')) shirtColor = '#f8fafc';
        else if (lowerBody.includes('black')) shirtColor = '#171717';
        else if (lowerBody.includes('red')) shirtColor = '#ef4444';
        else if (lowerBody.includes('blue')) shirtColor = '#3b82f6';
        else if (lowerBody.includes('green')) shirtColor = '#22c55e';
        else if (lowerBody.includes('purple')) shirtColor = '#a855f7';
        else if (lowerBody.includes('gold')) { 
            shirtColor = '#fbbf24'; 
            customGraphic = <text x="32" y="55" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#78350f" fontFamily="monospace">100%</text>;
        }
        else if (lowerBody.includes('tank top')) { isStandardShirt = false; isTankTop = true; shirtColor = '#ffffff'; }
        else if (lowerBody.includes('big man jacket')) isStandardShirt = false; 
        else if (lowerBody.includes('banana')) isStandardShirt = false; 
        else if (lowerBody.includes('boiler')) isStandardShirt = false;
        else if (lowerBody.includes('tuxedo')) isStandardShirt = false;
        
        else if (lowerBody.includes('entropy')) {
            shirtColor = '#000000'; 
            customGraphic = (
                <g opacity="0.9">
                    <rect x="20" y="48" width="4" height="8" rx="2" fill="white" />
                    <rect x="26" y="50" width="2" height="4" rx="1" fill="white" />
                    <rect x="30" y="49" width="2" height="6" rx="1" fill="white" />
                    <rect x="34" y="50" width="2" height="4" rx="1" fill="white" />
                    <rect x="38" y="48" width="4" height="8" rx="2" fill="white" />
                </g>
            );
        }
        else if (lowerBody.includes('zanebot')) {
            shirtColor = '#101010'; 
            customGraphic = (
                <g>
                    <rect x="26" y="46" width="2" height="6" fill="white" />
                    <path d="M30 48 Q 32 44, 34 48 Q 36 44, 38 48 L 34 53 Z" fill="red" />
                    <rect x="33" y="46" width="6" height="5" fill="#4b5563" rx="1" />
                    <rect x="34" y="47" width="2" height="1" fill="#4ade80" />
                    <rect x="37" y="47" width="1" height="1" fill="#4ade80" />
                </g>
            );
        }
    }

    if (lowerBody.includes('big man jacket')) {
        return (
            <g>
                <path d="M10 42 Q 32 38, 54 42 V 64 H 10 Z" fill="#0a0a0a" stroke="#000" strokeWidth="1" />
                <rect x="31" y="42" width="2" height="22" fill="#94a3b8" />
                <path d="M12 48 H 30 M34 48 H 52 M12 56 H 30 M34 56 H 52" stroke="#262626" strokeWidth="1" />
                <rect x="24" y="38" width="16" height="6" fill="#0a0a0a" />
            </g>
        );
    }
    if (lowerBody.includes('banana')) {
        return (
            <g>
                <path d="M12 42 Q 8 55, 20 64 H 44 Q 56 55, 52 42 V 38 H 12 Z" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
            </g>
        );
    }
    if (lowerBody.includes('boiler')) {
        return (
            <g>
                <path d="M12 42 H 52 V 64 H 12 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
                <rect x="12" y="50" width="40" height="4" fill="#cbd5e1" opacity="0.8" />
                <line x1="32" y1="42" x2="32" y2="64" stroke="#c2410c" strokeWidth="1" />
                <rect x="26" y="38" width="12" height="4" fill={skinTone} />
            </g>
        );
    }
    if (isTankTop) {
        return (
            <g>
                <path d={`M${shoulderX} 42 Q 32 38, ${shoulderX + shoulderW} 42 V 64 H ${shoulderX} Z`} fill={skinTone} />
                <path d="M22 42 V 64 H 42 V 42 Q 32 55, 22 42 Z" fill={shirtColor} stroke="#e5e7eb" strokeWidth="0.5" />
                <rect x="26" y="38" width="12" height="6" fill={skinTone} />
            </g>
        );
    }
    if (lowerBody.includes('tuxedo')) {
        return (
            <g>
                <path d={`M${shoulderX} 42 H ${shoulderX + shoulderW} V 64 H ${shoulderX} Z`} fill="#0a0a0a" />
                <path d="M26 42 L 32 58 L 38 42 Z" fill="white" />
                <path d="M28 42 L 32 46 L 36 42 L 32 38 Z" fill="#ef4444" />
                <rect x={shoulderX - 4} y="44" width="8" height="10" fill="#0a0a0a" />
                <rect x={shoulderX + shoulderW - 4} y="44" width="8" height="10" fill="#0a0a0a" />
                <rect x={shoulderX - 3} y="54" width="6" height="10" fill={skinTone} />
                <rect x={shoulderX + shoulderW - 3} y="54" width="6" height="10" fill={skinTone} />
                <rect x="26" y="38" width="12" height="6" fill={skinTone} />
            </g>
        );
    }
    if (isStandardShirt) {
        return (
            <g>
                <path d={`M${shoulderX} 42 H ${shoulderX + shoulderW} V 64 H ${shoulderX} Z`} fill={shirtColor} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                <rect x={shoulderX - 4} y="44" width="8" height="10" fill={shirtColor} />
                <rect x={shoulderX + shoulderW - 4} y="44" width="8" height="10" fill={shirtColor} />
                <rect x={shoulderX - 3} y="54" width="6" height="10" fill={skinTone} />
                <rect x={shoulderX + shoulderW - 3} y="54" width="6" height="10" fill={skinTone} />
                <rect x="26" y="38" width="12" height="6" fill={skinTone} />
                {customGraphic}
            </g>
        );
    }
    return null;
  };

  // --- 3. HEAD & FACE BASE ---
  const renderHead = () => {
    if (renderMode === 'body' || renderMode === 'badge') return null;
    return (
      <g>
          <path d="M20 16 H 44 V 30 Q 44 42, 32 42 Q 20 42, 20 30 Z" fill={skinTone} />
          <rect x="20" y="8" width="24" height="12" rx="5" fill={skinTone} />
          <g>
              <rect x="23" y="24" width="6" height="4" fill="white" />
              <rect x="25" y="25" width="2" height="2" fill={eyeColor} />
              <rect x="35" y="24" width="6" height="4" fill="white" />
              <rect x="37" y="25" width="2" height="2" fill={eyeColor} />
          </g>
          <rect x="28" y="35" width="8" height="2" fill="rgba(0,0,0,0.15)" />
      </g>
    );
  };

  // --- 4. FACE ACCESSORIES ---
  const renderFaceAccessories = () => {
      if (renderMode !== 'full' && renderMode !== 'face') return null;

      // ZANE/BOT Glasses
      if (lowerFace.includes('zane') || lowerFace.includes('bot')) {
          return (
              <g>
                  <ellipse cx="25" cy="23" rx="7" ry="5" fill="#4ade80" stroke="#1f2937" strokeWidth="1" />
                  <ellipse cx="39" cy="23" rx="7" ry="5" fill="#4ade80" stroke="#1f2937" strokeWidth="1" />
                  <line x1="32" y1="23" x2="32" y2="23" stroke="#1f2937" strokeWidth="2" />
                  <path d="M22 21 L 26 21" stroke="white" strokeWidth="1" opacity="0.5" />
                  <path d="M36 21 L 40 21" stroke="white" strokeWidth="1" opacity="0.5" />
              </g>
          );
      }
      
      // 8BALLS MOUSTACHE (Fixed: Thicker, Bushy Pringle Style)
      if (lowerFace.includes('moustache') || lowerFace.includes('8balls')) {
          return (
              <g transform="translate(32 33) scale(0.75) translate(-32 -33)">
                  {/* Single bushy shape: Center(32,33) -> Left Loop -> Center Bottom -> Right Loop -> Close */}
                  <path 
                    d="M 32 33 Q 20 26, 14 35 Q 22 41, 32 36 Q 42 41, 50 35 Q 44 26, 32 33 Z" 
                    fill="#3e2723" 
                  />
              </g>
          );
      }

      // Shades
      if (lowerFace.includes('shadez')) {
          return (
              <g>
                  <path d="M20 22 H 30 L 32 26 L 34 22 H 44 V 26 Q 44 30, 40 30 H 24 Q 20 30, 20 26 Z" fill="black" />
                  <rect x="22" y="23" width="6" height="2" fill="#333" />
                  <rect x="36" y="23" width="6" height="2" fill="#333" />
              </g>
          );
      }
      
      // Distortion Goggles
      if (lowerFace.includes('distortion') || lowerFace.includes('goggles')) {
          return (
              <g>
                  <rect x="20" y="23" width="10" height="6" fill="#111" />
                  <rect x="34" y="23" width="10" height="6" fill="#111" />
                  <rect x="30" y="25" width="4" height="2" fill="#111" />
                  <rect x="21" y="24" width="8" height="4" fill="#ef4444" opacity="0.8" />
                  <rect x="35" y="24" width="8" height="4" fill="#ef4444" opacity="0.8" />
                  <line x1="20" y1="25" x2="44" y2="25" stroke="white" strokeWidth="0.5" opacity="0.3" />
                  <line x1="22" y1="27" x2="42" y2="27" stroke="black" strokeWidth="0.5" opacity="0.3" />
              </g>
          );
      }
      return null;
  };

  // --- 5. HEAD ACCESSORIES ---
  const renderHeadAccessories = () => {
      if (renderMode !== 'full' && renderMode !== 'head') return null;

      if (lowerHead.includes('headphone')) {
          return (
              <g>
                  <path d="M16 26 V 16 Q 16 4, 32 4 Q 48 4, 48 16 V 26" fill="none" stroke="#333" strokeWidth="3" />
                  <rect x="14" y="22" width="6" height="12" rx="2" fill="#111" />
                  <rect x="44" y="22" width="6" height="12" rx="2" fill="#111" />
                  <circle cx="17" cy="28" r="1.5" fill="red" />
                  <circle cx="47" cy="28" r="1.5" fill="red" />
              </g>
          );
      }
      if (lowerHead.includes('fez')) {
          return (
              <g>
                  <path d="M26 0 L 24 8 H 40 L 38 0 Z" fill="#b91c1c" />
                  <path d="M34 0 L 38 0 L 40 8" fill="none" stroke="black" strokeWidth="1" />
                  <circle cx="40" cy="8" r="1" fill="black" />
              </g>
          );
      }
      if (lowerHead.includes('sombrero')) {
          return (
              <g>
                  <path d="M24 9 L 28 3 H 36 L 40 9 Z" fill="#facc15" />
                  <path d="M4 9 Q 32 13, 60 9" fill="none" stroke="#facc15" strokeWidth="6" />
                  <circle cx="10" cy="9" r="1" fill="red" />
                  <circle cx="20" cy="10" r="1" fill="green" />
                  <circle cx="32" cy="10" r="1" fill="blue" />
                  <circle cx="44" cy="10" r="1" fill="red" />
                  <circle cx="54" cy="9" r="1" fill="green" />
              </g>
          );
      }
      if (lowerHead.includes('tin')) {
          return (
              <g>
                  <path d="M18 14 L 22 4 L 26 8 L 32 2 L 38 8 L 42 4 L 46 14 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                  <path d="M18 14 H 46 V 18 H 18 Z" fill="#cbd5e1" />
                  <line x1="32" y1="2" x2="32" y2="-6" stroke="#64748b" strokeWidth="1" />
                  <path d="M32 -6 Q 40 -8, 42 -2" fill="none" stroke="#64748b" strokeWidth="1.5" />
                  <line x1="38" y1="-5" x2="40" y2="-7" stroke="#64748b" strokeWidth="0.5" />
              </g>
          );
      }
      if (lowerHead.includes('cap') || lowerHead.includes('hat') && !lowerHead.includes('top')) {
          // NO. 1 FAN CAP (Fixed: Single Outline on Top)
          if (lowerHead.includes('fan')) {
              return (
                  <g>
                      {/* Fill */}
                      <path d="M18 16 V 8 Q 32 2, 46 8 V 16 Z" fill="#ffffff" />
                      <path d="M46 14 L 56 16 L 46 18 Z" fill="#ffffff" />
                      <rect x="18" y="14" width="28" height="4" fill="#ffffff" />
                      <path d="M30 10 Q 32 8, 34 10 Q 36 8, 38 10 L 34 14 Z" fill="red" />
                      {/* Single Thinner Outline (Last/Top Layer) */}
                      <path d="M18 18 V 8 Q 32 2, 46 8 V 18 Z" fill="none" stroke="black" strokeWidth="0.5" />
                      <path d="M46 14 L 56 16 L 46 18" fill="none" stroke="black" strokeWidth="0.5" />
                  </g>
              );
          }
          const capColor = lowerHead.includes('entropy') ? '#000000' : '#334155';
          return (
              <g>
                  <path d="M20 16 V 8 Q 32 2, 44 8 V 16 Z" fill={capColor} />
                  <path d="M44 14 L 54 16 L 44 18 Z" fill={capColor} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
                  <rect x="20" y="14" width="24" height="4" fill={capColor} />
                  {lowerHead.includes('entropy') && (
                      <g transform="translate(0, -2) scale(0.8) translate(8, 6)">
                          <rect x="28" y="8" width="1" height="3" fill="white" />
                          <rect x="30" y="7" width="1" height="5" fill="white" />
                          <rect x="32" y="8" width="1" height="3" fill="white" />
                          <rect x="34" y="7" width="1" height="5" fill="white" />
                      </g>
                  )}
              </g>
          );
      }
      if (lowerHead.includes('top hat')) {
          return (
              <g>
                  <rect x="21" y="0" width="22" height="10" fill="#111" />
                  <rect x="17" y="10" width="30" height="2" fill="#111" />
                  <rect x="21" y="8" width="22" height="2" fill="#333" />
              </g>
          );
      }
      return null;
  };

  // --- 6. HAIR (FRONT) ---
  const renderFrontHair = () => {
    if (renderMode !== 'full') return null;
    if (hideAllHair) return null; 

    if (gender === 'male') {
      if (hairStyle === 'style1') {
          return (
            <g fill={hairColor}>
              <rect x="18" y={hairY} width="28" height="4" />
              <rect x="18" y={hairY+4} width="4" height="4" />
              <rect x="42" y={hairY+4} width="4" height="4" />
            </g>
          );
      }
      if (hairStyle === 'style2') {
          return <rect x="28" y={hairY-6} width="8" height="10" fill={hairColor} />;
      }
      if (hairStyle === 'style3') {
          return (
             <g fill={hairColor}>
               <rect x="18" y={hairY} width="28" height="4" />
               <rect x="18" y={hairY+4} width="4" height="3" />
               <rect x="24" y={hairY+4} width="4" height="5" />
               <rect x="36" y={hairY+4} width="4" height="5" />
               <rect x="42" y={hairY+4} width="4" height="3" />
             </g>
          );
      }
    } else {
      if (hairStyle === 'style1') {
          return (
            <g fill={hairColor}>
               <rect x="18" y={hairY} width="28" height="6" />
               <rect x="18" y={hairY+6} width="4" height="6" />
               <rect x="42" y={hairY+6} width="4" height="6" />
            </g>
          );
      }
      if (hairStyle === 'style2') {
          return (
            <g fill={hairColor}>
               <rect x="18" y={hairY} width="28" height="6" />
               <rect x="18" y={hairY+6} width="6" height="14" />
               <rect x="40" y={hairY+6} width="6" height="14" />
            </g>
          );
      }
      if (hairStyle === 'style3') {
          return (
            <g fill={hairColor}>
                <path d={`M32 ${hairY} L 18 40 V ${hairY} Z`} />
                <path d={`M32 ${hairY} L 46 40 V ${hairY} Z`} />
            </g>
          );
      }
    }
    return null;
  };

  return (
    <div className="relative flex items-center justify-center overflow-hidden" style={{ width: size, height: size, imageRendering: 'pixelated' }}>
      <svg viewBox="0 0 64 64" className="w-full h-full" style={{ shapeRendering: 'crispEdges' }}>
        <defs>
            <pattern id="lvPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#5c4033" />
                <circle cx="4" cy="4" r="1.5" fill="#a88b68" opacity="0.6" />
                <path d="M0 0 L2 2 M8 0 L6 2" stroke="#a88b68" strokeWidth="0.5" opacity="0.6" />
            </pattern>
        </defs>

        {renderBadge() || (
            <>
                {renderBackLayer()}
                {renderBody()}
                {renderHead()}
                {renderFaceAccessories()} 
                {renderFrontHair()}
                {renderHeadAccessories()}
            </>
        )}
      </svg>
    </div>
  );
}
