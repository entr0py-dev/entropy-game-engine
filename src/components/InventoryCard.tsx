import React from 'react';
import type { UserItem, Profile } from '@/context/GameStateContext';
import Avatar from './Avatar';
import { useToast } from '@/context/ToastContext';

interface InventoryCardProps {
  userItem: UserItem;
  isEquipped: boolean;
  onEquip: () => void;
  onUnequip: () => void;
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

export default function InventoryCard({ userItem, isEquipped, onEquip, onUnequip, profile }: InventoryCardProps) {
  const { showToast } = useToast();
  const item = userItem.item_details;
  if (!item) return null;

  const rarityColor = getRarityColor(item.rarity);
  const isEntropic = item.rarity === 'entropic';
  const isModifier = item.type === 'modifier';
  const count = userItem.count || 1;
  const isBody = item.slot === 'body';

  const handleAction = () => {
    if (item.type === 'music') {
      showToast(`Downloading: ${item.name}.mp3`, 'success');
    } else if (isModifier) {
      showToast(`Activated ${item.name}!`, 'success');
    } else if (isEquipped && !isBody) {
      onUnequip();
    } else {
      onEquip();
    }
  };

  const renderPreview = () => {
    if (item.type === 'cosmetic' || item.type === 'badge' || item.type === 'modifier') {
      const part = (item.slot as 'head' | 'face' | 'body' | 'badge') || 'body';
      let transformStyle = 'scale(1.2) translateY(5px)';
      if (part === 'body') {
          if (item.name.toLowerCase().includes('banana')) {
              transformStyle = 'scale(1.1) translateY(5px)';
          } else {
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
        padding: 0, flexDirection: 'column', alignItems: 'stretch', height: '100%', position: 'relative',
        backgroundColor: isEquipped ? '#dcfce7' : '#e5e5e5', 
        border: isEquipped ? '2px solid #16a34a' : '1px solid white'
    }}>
      <div style={{ 
          backgroundColor: rarityColor, color: 'white', fontSize: '9px', fontWeight: 'bold', 
          padding: '2px 4px', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px',
          animation: isEntropic ? 'pulse 2s infinite' : 'none'
      }}>
          {item.rarity?.replace('_', ' ') || 'COMMON'}
      </div>

      {count > 1 && (
          <div style={{ position: 'absolute', top: '22px', right: '4px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white', zIndex: 10 }}>
              {count}
          </div>
      )}

      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
          <div className="retro-inset" style={{ backgroundColor: 'white', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderPreview()}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>{item.name}</h3>
            <p style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{item.type}</p>
          </div>

          <button 
            onClick={handleAction}
            style={{
                backgroundColor: isEquipped ? '#fee2e2' : '#c0c0c0', 
                border: '1px solid #808080',
                boxShadow: '1px 1px 0 black',
                fontSize: '10px', fontWeight: 'bold', padding: '4px', cursor: 'pointer', marginTop: 'auto',
                color: isEquipped ? '#991b1b' : 'black'
            }}
          >
            {item.type === 'music' ? 'DOWNLOAD' : isModifier ? 'USE' : isEquipped && !isBody ? 'UNEQUIP' : 'EQUIP'}
          </button>
      </div>
    </div>
  );
}
