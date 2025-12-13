'use client';

import { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import InventoryCard from '@/components/InventoryCard';
import Avatar from '@/components/Avatar';

type Tab = 'cosmetic' | 'badge' | 'modifier' | 'sets' | 'all';
type Sort = 'rarity' | 'type' | 'set';

export default function InventoryPage({ isOverlay, onClose }: { isOverlay?: boolean, onClose?: () => void }) {
  const { inventory, equipItem, unequipItem, useModifier, profile, cosmeticSets, claimedSets, claimSetBonus, shopItems } = useGameState();
  const [activeTab, setActiveTab] = useState<Tab>('cosmetic');
  const [sortMethod, setSortMethod] = useState<Sort>('rarity');
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  
  const ownedBadges = inventory.filter(inv => inv.item_details?.type === 'badge');

  const getRarityWeight = (r?: string) => { if (r === 'entropic') return 5; if (r === 'ultra_rare') return 4; if (r === 'rare') return 3; if (r === 'uncommon') return 2; return 1; };
  const getSlotWeight = (slot?: string) => { if (slot === 'head') return 1; if (slot === 'face') return 2; if (slot === 'body') return 3; if (slot === 'badge') return 4; return 5; };

  const filteredItems = inventory.filter(inv => {
    if (activeTab === 'all' || activeTab === 'sets') return true;
    // FIX: Case-insensitive check ensures Modifiers show up in the right tab
    const type = inv.item_details?.type?.toLowerCase() || 'cosmetic';
    const name = (inv.item_details?.name || '').toLowerCase();
    const isModifier = type === 'modifier' || inv.item_details?.name === 'Duplication Glitch' || (name.includes('12') && name.includes('die'));
    if (activeTab === 'modifier') return isModifier;
    return type === activeTab;
  }).sort((a, b) => {
      const itemA = a.item_details;
      const itemB = b.item_details;
      if (!itemA || !itemB) return 0;
      if (sortMethod === 'rarity') return getRarityWeight(itemB.rarity) - getRarityWeight(itemA.rarity);
      if (sortMethod === 'type') { const slotDiff = getSlotWeight(itemA.slot) - getSlotWeight(itemB.slot); if (slotDiff !== 0) return slotDiff; return itemA.name.localeCompare(itemB.name); }
      return 0; 
  });

  if (!profile) return null;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      
      {showBadgePicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="retro-window" style={{ width: '400px', backgroundColor: '#c0c0c0' }}>
                <div className="retro-header">
                    <span>Select Badge</span>
                    <button onClick={() => setShowBadgePicker(false)} className="retro-btn" style={{ padding: '0 6px' }}>X</button>
                </div>
                 <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ownedBadges.length > 0 ? (
                        ownedBadges.map(badge => (
                            <button key={badge.id} onClick={() => { if (badge.item_details) equipItem(badge.item_details); setShowBadgePicker(false); }} className="retro-btn" style={{ justifyContent: 'flex-start', padding: '6px', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', flexShrink: 0, border: '1px solid #888', background: '#fff', borderRadius: '4px' }}>
                                    <Avatar equippedBadge={badge.item_details?.name} renderMode="badge" size={40} />
                                </div>
                                <span style={{ textAlign: 'left' }}>{badge.item_details?.name}</span>
                            </button>
                        ))
                    ) : <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No badges found.</p>}
                </div>
            </div>
        </div>
      )}

      <div className="retro-window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="retro-header">
            <span>Inventory Manager</span>
            <div style={{ display: 'flex', gap: '4px' }}>
                <div className="retro-btn" onClick={onClose} style={{ padding: '0 6px', fontSize: '10px', cursor: 'pointer' }}>_</div>
                <div className="retro-btn" onClick={onClose} style={{ padding: '0 6px', fontSize: '10px', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer' }}>X</div>
            </div>
        </div>

        <div style={{ flex: 1, display: 'flex', backgroundColor: '#c0c0c0', padding: '8px', gap: '8px', overflow: 'hidden' }}>
            <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '16px', borderRight: '1px solid #808080', boxShadow: '1px 0 0 white' }}>
                <div className="retro-inset" style={{ backgroundColor: 'white', padding: '20px', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                    <Avatar 
                        gender={profile.gender} skinTone={profile.skin_tone} eyeColor={profile.eye_color} hairColor={profile.hair_color} hairStyle={profile.hair_style} 
                        equippedImage={profile.equipped_image} equippedHead={profile.equipped_head} equippedBody={profile.equipped_body} 
                        equippedBadge={profile.equipped_badge} 
                        size={160} 
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <VisualSlot label="HEAD" profile={profile} part="head" />
                    <VisualSlot label="FACE" profile={profile} part="face" />
                    <VisualSlot label="BODY" profile={profile} part="body" />
                    <div onClick={() => setShowBadgePicker(true)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#4b5563' }}>BADGE</span>
                            <div className="retro-inset" style={{ height: '60px', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {profile.equipped_badge ? (
                                    <div style={{ transform: 'scale(1.0)', width: '50px', height: '50px' }}>
                                        <Avatar equippedBadge={profile.equipped_badge} renderMode="badge" size={50} />
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '10px', color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '1px' }}>EMPTY</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {['cosmetic', 'badge', 'modifier', 'sets', 'all'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab as Tab)} 
                                style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderTop: '2px solid white', borderLeft: '2px solid white', borderRight: '2px solid #808080', backgroundColor: activeTab === tab ? '#c0c0c0' : '#a0a0a0', color: activeTab === tab ? 'black' : '#e0e0e0', transform: activeTab === tab ? 'translateY(2px)' : 'none', position: 'relative', zIndex: activeTab === tab ? 10 : 0 }}>
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                     </div>
                    <select value={sortMethod} onChange={(e) => setSortMethod(e.target.value as Sort)} style={{ fontSize: '12px', padding: '4px', backgroundColor: '#c0c0c0', border: '1px solid #808080' }}>
                        <option value="rarity">Sort: Rarity (High-Low)</option>
                        <option value="type">Sort: Slot (Head-Body)</option>
                    </select>
                </div>

                <div className="retro-inset" style={{ flex: 1, backgroundColor: 'white', padding: '16px', overflowY: 'auto' }}>
                    {activeTab === 'sets' ? (
                        /* Sets Logic (Collapsed for brevity - stays same) */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {cosmeticSets.map(set => {
                                const isClaimed = claimedSets.includes(set.id);
                                const isExpanded = expandedSetId === set.id;
                                const ownedCount = set.items.filter(reqId => inventory.some(i => i.item_id === reqId)).length;
                                const totalCount = set.items.length;
                                const isComplete = ownedCount === totalCount;
                                return (
                                 <div key={set.id} className="retro-window" style={{ padding: 0 }}>
                                            <div onClick={() => setExpandedSetId(isExpanded ? null : set.id)} style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isClaimed ? '#dcfce7' : '#c0c0c0', borderBottom: isExpanded ? '2px solid #808080' : 'none' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{set.is_hidden && !isComplete ? "??? (HIDDEN SET)" : set.name} {isClaimed && " (COMPLETED)"}</div>
                                                <div style={{ fontSize: '12px' }}>{isClaimed ? "claimed" : `${ownedCount}/${totalCount}`} {isExpanded ? '▲' : '▼'}</div>
                                            </div>
                                            {isExpanded && (
                                              <div style={{ padding: '10px', backgroundColor: '#f3f4f6' }}>
                                                        <p style={{ fontSize: '12px', marginBottom: '10px', fontStyle: 'italic' }}>Reward: <b>{set.xp_reward} XP</b></p>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                                           {set.items.map(reqId => {
                                                                const isOwned = inventory.some(i => i.item_id === reqId);
                                                                const itemDetails = shopItems.find(i => i.id === reqId) || inventory.find(i => i.item_id === reqId)?.item_details;
                                                                const showName = !set.is_hidden || isOwned;
                                                                return (
                                                                    <div key={reqId} style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: isOwned ? 'white' : '#e5e5e5', opacity: isOwned ? 1 : 0.5, fontSize: '10px', textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{showName && itemDetails ? itemDetails.image_url : "🔒"}</div>
                                                                        <div>{showName && itemDetails ? itemDetails.name : "???"}</div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {!isClaimed && (
                                                           <button onClick={(e) => { e.stopPropagation(); claimSetBonus(set.id); }} disabled={!isComplete} className="retro-btn" style={{ width: '100%', backgroundColor: isComplete ? '#2563eb' : '#ccc', color: isComplete ? 'white' : '#666', cursor: isComplete ? 'pointer' : 'not-allowed' }}>
                                                                {isComplete ? 'CLAIM BONUS' : 'COLLECT ALL TO UNLOCK'}
                                                            </button>
                                                        )}
                                                    </div>
                                               )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        filteredItems.length > 0 ? (
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                                {filteredItems.map((userItem) => {
                                    const details = userItem.item_details;
                                    if (!details) return null;
                                    
                                    const isModifier = details.type?.toLowerCase() === 'modifier';

                                    let isEquipped = false;
                                    if (details.slot === 'head' && profile.equipped_head === details.name) isEquipped = true;
                                    if (details.slot === 'face' && profile.equipped_image === details.name) isEquipped = true;
                                    if (details.slot === 'badge' && (profile.equipped_badge === details.name || profile.equipped_badge === details.image_url)) isEquipped = true;
                                    if (details.slot === 'body' && (profile.equipped_body === details.name || profile.equipped_body === details.image_url)) isEquipped = true;

                                    return (
                                        <div key={userItem.id} style={{ position: 'relative' }}>
                                            <InventoryCard
                                              userItem={userItem}
                                              isEquipped={isEquipped}
                                              onEquip={() => {
                                                  // CHECK: Is this a modifier?
                                                  if (isModifier) {
                                                      useModifier(details.id, details.name);
                                                  } else {
                                                      equipItem(details);
                                                  }
                                              }}
                                              onUnequip={() => unequipItem(details.slot || 'face')}
                                              profile={profile}
                                            />
                                            
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}><span style={{ fontSize: '48px', marginBottom: '8px' }}>📁</span><p style={{ fontWeight: 'bold' }}>This folder is empty.</p></div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function VisualSlot({ label, profile, part }: { label: string, profile: any, part: 'head'|'face'|'body' }) {
    const isEmpty = part === 'head' ? !profile.equipped_head : part === 'face' ? !profile.equipped_image : !profile.equipped_body;
    let transformStyle = 'scale(1.2) translateY(5%)'; 
    if (part === 'body') transformStyle = 'scale(1.6) translateY(-18%)'; 
    if (part === 'head') transformStyle = 'scale(1.7) translateY(10%)';
    if (part === 'face') transformStyle = 'scale(2.4) translateY(5%)'; 
    const slotOverflow = part === 'body' || part === 'face' ? 'hidden' : 'visible';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#4b5563' }}>{label}</span>
            <div className="retro-inset" style={{ height: '60px', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: slotOverflow, padding: '4px' }}>
                {isEmpty ? (
                    <span style={{ fontSize: '10px', color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '1px' }}>Empty</span>
                ) : (
                    <div style={{ transform: transformStyle, transformOrigin: 'center center', width: '50px', height: '50px' }}>
                        <Avatar gender={profile.gender} skinTone={profile.skin_tone} eyeColor={profile.eye_color} hairColor={profile.hair_color} hairStyle={profile.hair_style} equippedImage={profile.equipped_image} equippedHead={profile.equipped_head} equippedBody={profile.equipped_body} size={50} renderMode={part} />
                    </div>
                )}
            </div>
        </div>
    );
}
