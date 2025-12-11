import React from 'react';
import type { Item, Profile } from '@/context/GameStateContext';
import Avatar from './Avatar';

interface ItemCardProps {
  item: Item;
  isOwned: boolean;
  canAfford: boolean;
  onBuy: (id: string) => void;
  purchasing: boolean;
  profile: Profile;
}

const getRarityColor = (rarity?: string) => {
  switch (rarity) {
    case 'entropic': return '#dc2626';
    case 'ultra_rare': return '#9333ea';
    case 'rare': return '#2563eb';
    case 'uncommon': return '#16a34a';
    default: return '#9ca3af';
  }
};

export default function ItemCard({ item, isOwned, canAfford, onBuy, purchasing, profile }: ItemCardProps) {
  const rarityColor = getRarityColor(item.rarity);
  const isEntropic = item.rarity === 'entropic';

  const renderPreview = () => {
    // --- NEW: NEURAL PATCH / FLOPPY DISK CHECK ---
    // This catches the consumable item and forces it to render using the Badge engine
    if (item.name === 'Neural Patch' || item.image_url === 'floppy_disk') {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ transform: 'scale(1.5)' }}>
                    <Avatar 
                        renderMode="badge" 
                        equippedBadge="floppy_disk" 
                        size={50} 
                    />
                </div>
            </div>
        );
    }

    // UPDATED: Use Avatar for badges/modifiers in Shop too
    if (item.type === 'cosmetic' || item.type === 'badge' || item.type === 'modifier') {
      const part = (item.slot as 'head' | 'face' | 'body' | 'badge') || 'body';
      
      let transformStyle = 'scale(1.2) translateY(5px)';
      
      // UPDATED: Body Logic with Banana Suit Check
      if (part === 'body') {
          if (item.name.toLowerCase().includes('banana')) {
              // Banana is tall, so we zoom out slightly and push it down
              transformStyle = 'scale(1.1) translateY(5px)';
          } else {
              // Standard scaling for shirts/jackets
              transformStyle = 'scale(1.6) translateY(-18px)';
          }
      }
      if (part === 'head') transformStyle = 'scale(1.6) translateY(12px)';
      if (part === 'face') transformStyle = 'scale(2.2) translateY(5px)';
      if (part === 'badge' || item.type === 'modifier') transformStyle = 'scale(1.2)';

      return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: transformStyle }}>
            <Avatar
              gender={profile.gender}
              skinTone={profile.skin_tone}
              eyeColor={profile.eye_color}
              hairColor={profile.hair_color}
              hairStyle={profile.hair_style}
              equippedHead={part === 'head' ? item.name : undefined}
              equippedImage={part === 'face' ? item.name : undefined}
              equippedBody={part === 'body' ? item.name : undefined}
              equippedBadge={item.name}
              size={50}
              renderMode={item.type === 'modifier' ? 'badge' : part}
            />
          </div>
        </div>
      );
    }
    return <span style={{ fontSize: '28px' }}>{item.image_url}</span>;
  };

  return (
    <div className="retro-btn" style={{ 
        padding: 0, flexDirection: 'column', alignItems: 'stretch', height: '100%',
        opacity: isOwned ? 0.6 : 1, position: 'relative'
    }}>
      <div style={{ 
          backgroundColor: rarityColor, color: 'white', fontSize: '10px', fontWeight: 'bold', 
          padding: '2px 4px', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px',
          animation: isEntropic ? 'pulse 2s infinite' : 'none'
      }}>
          {item.rarity?.replace('_', ' ') || 'COMMON'}
      </div>

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
          <div className="retro-inset" style={{ backgroundColor: '#f3f4f6', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderPreview()}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.2' }}>{item.name}</h3>
            <p style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{item.description}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ fontWeight: 'bold', fontFamily: 'monospace', color: canAfford ? '#16a34a' : '#dc2626' }}>
              {item.cost} EB
            </div>

            {isOwned ? (
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#666' }}>OWNED</span>
            ) : (
              <button
                onClick={() => onBuy(item.id)}
                disabled={!canAfford || purchasing}
                style={{
                    backgroundColor: canAfford ? '#000080' : '#ccc',
                    color: canAfford ? 'white' : '#666',
                    border: 'none', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    boxShadow: canAfford ? '1px 1px 0 black' : 'none'
                }}
              >
                {purchasing ? '...' : 'BUY'}
              </button>
            )}
          </div>
      </div>
    </div>
  );
}
