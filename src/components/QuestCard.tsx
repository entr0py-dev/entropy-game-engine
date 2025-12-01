import React from 'react';

// Interfaces based on your Schema [cite: 35, 42]
interface Quest {
  id: string;
  title: string;
  description: string;
  reward_entrobucks: number;
  reward_item: string | null;
}

interface QuestCardProps {
  quest: Quest;
  status: 'not_started' | 'in_progress' | 'completed';
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
}

export default function QuestCard({ quest, status, onStart, onComplete }: QuestCardProps) {
  return (
    <div className="border border-slate-700 bg-slate-900/80 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-green-500/50 transition-all">
      {/* Glitchy decorative overlay */}
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-green-500 transition-colors" />

      <div className="pl-4">
        <h3 className="text-xl font-bold text-white mb-2">{quest.title}</h3>
        <p className="text-slate-400 text-sm mb-4">{quest.description}</p>
        
        {/* Rewards Section [cite: 39, 40] */}
        <div className="flex gap-3 text-xs font-mono uppercase tracking-widest text-green-400 mb-6">
          <span className="bg-slate-800 px-2 py-1 rounded">
            + {quest.reward_entrobucks} Entrobucks
          </span>
          {quest.reward_item && (
            <span className="bg-slate-800 px-2 py-1 rounded text-purple-400">
              Item: {quest.reward_item}
            </span>
          )}
        </div>

        {/* Action Buttons based on Status [cite: 47] */}
        <div className="mt-2">
          {status === 'not_started' && (
            <button
              onClick={() => onStart(quest.id)}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors"
            >
              Accept Mission
            </button>
          )}

          {status === 'in_progress' && (
            <button
              onClick={() => onComplete(quest.id)}
              className="w-full py-2 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-colors shadow-[0_0_15px_rgba(34,197,94,0.4)]"
            >
              Complete Mission
            </button>
          )}

          {status === 'completed' && (
            <div className="w-full py-2 text-center text-slate-500 font-mono text-sm border border-slate-800 rounded">
              // MISSION ARCHIVED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}