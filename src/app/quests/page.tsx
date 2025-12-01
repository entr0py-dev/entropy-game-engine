'use client';

import { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useMemo } from 'react';

// Win95 styling helpers from globals.css

type OverlayProps = { isOverlay?: boolean; onClose?: () => void };

export default function QuestLogPage({ isOverlay, onClose }: OverlayProps) {
  const { quests, userQuests, shopItems } = useGameState(); // <--- Added shopItems here
  const [activeTab, setActiveTab] = useState<'main' | 'side'>('side');

  // Filter and Merge Data
  const visibleQuests = useMemo(() => {
    return quests
      .filter((q: any) => {
        const isType = q.type === activeTab;
        const hasStarted = userQuests.some(uq => uq.quest_id === q.id);
        const isHidden = q.is_hidden && !hasStarted; 
        return isType && !isHidden;
      })
      .map((q: any) => {
        const uq = userQuests.find((uq: any) => uq.quest_id === q.id);
        return {
          ...q,
          status: uq?.status || 'locked',
          progress: uq?.progress || 0,
          target: q.target_value || 1
        };
      })
      .sort((a: any, b: any) => a.reward_xp - b.reward_xp);
  }, [quests, userQuests, activeTab]);

  return (
    // Centered Container
    <div style={{ width: '100%', height: '100%' }}>
      
      {/* The Window */}
      <div className="retro-window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        <div className="retro-header">
            <span>Mission_Log.txt</span>
            <div className="retro-btn" style={{ padding: '0 6px', fontSize: '10px', cursor: 'pointer' }} onClick={onClose}>X</div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '4px', padding: '8px', backgroundColor: '#c0c0c0', borderBottom: '1px solid #808080' }}>
            <button 
                onClick={() => setActiveTab('side')}
                style={{
                    padding: '6px 20px', fontSize: '12px', fontWeight: 'bold',
                    borderTop: '2px solid white', borderLeft: '2px solid white', borderRight: '2px solid #808080',
                    backgroundColor: activeTab === 'side' ? '#c0c0c0' : '#a0a0a0',
                    color: activeTab === 'side' ? 'black' : '#e0e0e0',
                    transform: activeTab === 'side' ? 'translateY(2px)' : 'none',
                    position: 'relative', zIndex: activeTab === 'side' ? 10 : 0,
                    marginBottom: activeTab === 'side' ? '-10px' : '0'
                }}
            >
                SIDE QUESTS
            </button>
            <button 
                onClick={() => setActiveTab('main')}
                style={{
                    padding: '6px 20px', fontSize: '12px', fontWeight: 'bold',
                    borderTop: '2px solid white', borderLeft: '2px solid white', borderRight: '2px solid #808080',
                    backgroundColor: activeTab === 'main' ? '#c0c0c0' : '#a0a0a0',
                    color: activeTab === 'main' ? 'black' : '#e0e0e0',
                    transform: activeTab === 'main' ? 'translateY(2px)' : 'none',
                    position: 'relative', zIndex: activeTab === 'main' ? 10 : 0,
                    marginBottom: activeTab === 'main' ? '-10px' : '0'
                }}
            >
                MAIN QUEST
            </button>
        </div>

        {/* QUEST LIST */}
        <div className="retro-inset" style={{ flex: 1, backgroundColor: 'white', margin: '8px', padding: '16px', overflowY: 'auto' }}>
            {visibleQuests.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '40px', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {activeTab === 'main' ? 'NO MAIN DATA FRAGMENTS FOUND.' : 'NO TASKS AVAILABLE.'}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {visibleQuests.map((q: any) => (
                        <QuestItem key={q.id} quest={q} allItems={shopItems} />
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function QuestItem({ quest, allItems }: { quest: any, allItems: any[] }) {
    const isComplete = quest.status === 'completed';
    // Calculate percentage, capping at 100%
    const percent = Math.min(100, (quest.progress / quest.target) * 100);
    
    // Lookup item name if reward_item exists
    const rewardItemName = quest.reward_item 
        ? allItems.find(i => i.id === quest.reward_item)?.name || "???"
        : null;

    return (
        <div style={{ 
            border: '2px solid', 
            borderColor: isComplete ? '#22c55e' : '#d1d5db',
            backgroundColor: isComplete ? '#f0fdf4' : '#f9fafb',
            padding: '12px',
            opacity: isComplete ? 0.8 : 1
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e3a8a' }}>
                        {quest.title} {isComplete && '✅'}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>{quest.description}</p>
                </div>
                
                {/* Rewards Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '10px', fontFamily: 'monospace', color: '#6b7280' }}>
                    <span>{quest.reward_entrobucks} EB</span>
                    <span>{quest.reward_xp} XP</span>
                    {rewardItemName && (
                        <span style={{ color: '#9333ea', fontWeight: 'bold', marginTop: '2px' }}>
                            + {rewardItemName}
                        </span>
                    )}
                </div>
            </div>

            {/* Progress Bar (Only for In Progress) */}
            {!isComplete && (
                <div style={{ 
                    width: '100%', 
                    height: '14px', 
                    backgroundColor: '#e5e7eb', 
                    border: '1px solid #9ca3af', 
                    position: 'relative', 
                    marginTop: '8px',
                    borderRadius: '2px' 
                }}>
                    <div 
                        style={{ 
                            height: '100%', 
                            backgroundColor: '#2563eb', 
                            width: `${percent}%`,
                            transition: 'width 0.5s ease'
                        }}
                    />
                    {/* The counter text: Centered absolutely within the bar container */}
                    <div style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '9px', 
                        fontWeight: 'bold', 
                        color: percent > 55 ? 'white' : 'black', // Switch color for readability
                        textShadow: percent > 55 ? '1px 1px 0 rgba(0,0,0,0.5)' : 'none'
                    }}>
                        {quest.progress} / {quest.target}
                    </div>
                </div>
            )}
            
            {isComplete && (
                <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    color: '#15803d', 
                    textAlign: 'center', 
                    width: '100%', 
                    backgroundColor: '#bbf7d0', 
                    marginTop: '8px', 
                    padding: '2px 0' 
                }}>
                    MISSION COMPLETE
                </div>
            )}
        </div>
    )
}
