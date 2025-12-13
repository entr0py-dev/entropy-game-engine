'use client';

import { useGameState } from '@/context/GameStateContext';
import ItemCard from '@/components/ItemCard';
import { useState } from 'react';

export default function ShopPage({ isOverlay, onClose }: { isOverlay?: boolean, onClose?: () => void }) {
  const { shopItems, inventory, profile, buyItem } = useGameState();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  if (!profile) return <div style={{ padding: '40px', color: 'white' }}>Loading neural market...</div>;

  const handleBuy = async (itemId: string) => {
    setPurchasingId(itemId);
    await buyItem(itemId);
    setPurchasingId(null);
  };

  const cosmetics = shopItems.filter(i => i.type === 'cosmetic');
  const modifiers = shopItems.filter(i => {
    const lowerName = (i.name || '').toLowerCase();
    return i.type === 'modifier' || i.name === 'Duplication Glitch' || (lowerName.includes('12') && lowerName.includes('die'));
  });
  const others = shopItems.filter(i => i.type !== 'cosmetic' && i.type !== 'modifier');

  const renderGrid = (items: any[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        {items.map((item) => {
            // SIMPLE ONE-AT-A-TIME CHECK
            // If the item exists in inventory, it is owned. No exceptions.
            const isOwned = inventory.some((i) => i.item_id === item.id);
            const canAfford = profile.entrobucks >= item.cost && !isOwned;
            
            return (
                <ItemCard key={item.id} item={item} isOwned={isOwned} canAfford={canAfford} onBuy={handleBuy} purchasing={purchasingId === item.id} profile={profile} />
            );
        })}
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div className="retro-window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="retro-header">
            <span>Entropy_Marketplace.exe</span>
            <div className="retro-btn" onClick={onClose} style={{ padding: '0 6px', fontSize: '10px', backgroundColor: '#ef4444', color: 'white' }}>X</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#c0c0c0', padding: '16px', overflow: 'hidden' }}>
            <div className="retro-inset" style={{ padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                 <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>SUPPLY DEPOT</h2>
                    <p style={{ fontSize: '12px', color: '#666' }}>Authorized Personnel Only</p>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Available Funds</div>
                    <div style={{ fontSize: '24px', fontFamily: 'monospace', color: '#16a34a', fontWeight: 'bold' }}>
                        {profile.entrobucks} EB
                    </div>
                 </div>
            </div>

            <div className="retro-inset" style={{ flex: 1, backgroundColor: 'white', padding: '16px', overflowY: 'auto' }}>
                {modifiers.length > 0 && (
                    <>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #eee', paddingBottom: '4px' }}>MODIFIERS & BOOSTS</h3>
                        {renderGrid(modifiers)}
                    </>
                )}
                {cosmetics.length > 0 && (
                    <>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #eee', paddingBottom: '4px' }}>COSMETICS</h3>
                        {renderGrid(cosmetics)}
                    </>
                )}
                {others.length > 0 && (
                    <>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #eee', paddingBottom: '4px' }}>MISC</h3>
                        {renderGrid(others)}
                    </>
                )}
                {shopItems.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #ccc', borderRadius: '8px' }}>
                        <p style={{ color: '#666' }}>Marketplace Offline.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
