'use client';

import { useState, useRef, useEffect } from 'react';

// --- PLAYLIST CONFIG ---
const TRACKS = [
  { 
    title: "INUREYES (Transhumanist E.P)", 
    artist: "GEN x VERTIGO", 
    // New local URL (looks inside public/music folder automatically)
    url: "/music/GENB_VERTIGO_1.mp3" 
  }, 
  { 
    title: "BREATHE (Transhumanist E.P)", 
    artist: "VERTIGO", 
    url: "/music/GENB_VERTIGO_2.mp3" 
  },
  { 
    title: "EMPTY SPACE", 
    artist: "GEN B", 
    url: "/music/GENB_VERTIGO_3.mp3" 
  },
];

export default function MusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle Auto-Play next track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => nextTrack();
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentTrack]);

  // Volume Control
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Play/Pause Logic
  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        else audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  return (
    <div className="retro-window" style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '20px', 
        width: '280px', 
        zIndex: 9000,
        backgroundColor: '#1a1a1a', // Darker skin
        border: '2px solid #4a4a4a',
        boxShadow: '4px 4px 0px rgba(0,0,0,0.5)'
    }}>
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={TRACKS[currentTrack].url} />

      {/* HEADER (Draggable handle area in theory) */}
      <div className="retro-header" style={{ 
          backgroundColor: '#2d2d2d', 
          height: '20px', 
          fontSize: '10px',
          borderBottom: '1px solid #000'
      }}>
          <span style={{ color: '#00ff00', fontFamily: 'monospace' }}>ENTROPY_AMP.EXE</span>
          <div 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="retro-btn" 
            style={{ 
                padding: '0 4px', 
                height: '14px', 
                fontSize: '8px', 
                backgroundColor: '#444',
                color: 'white',
                border: '1px solid #666'
            }}
          >
            {isMinimized ? '□' : '_'}
          </div>
      </div>

      {!isMinimized && (
          <div style={{ padding: '10px' }}>
              
              {/* DISPLAY SCREEN */}
              <div style={{ 
                  backgroundColor: '#000', 
                  border: '2px inset #444', 
                  marginBottom: '10px',
                  padding: '4px',
                  height: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
              }}>
                  <div style={{ 
                      color: '#00ff00', 
                      fontFamily: 'monospace', 
                      fontSize: '10px', 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                  }}>
                      <span style={{ display: 'inline-block', animation: 'marquee 5s linear infinite' }}>
                        {currentTrack + 1}. {TRACKS[currentTrack].artist} - {TRACKS[currentTrack].title} *** 128kbps *** </span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                      {/* Fake Visualizer Bars */}
                      {[...Array(15)].map((_, i) => (
                          <div key={i} style={{ 
                              width: '4px', 
                              height: `${Math.random() * 12 + 2}px`, 
                              backgroundColor: isPlaying ? (i % 2 === 0 ? '#00ff00' : '#ffff00') : '#333',
                              alignSelf: 'flex-end'
                          }} />
                      ))}
                  </div>
              </div>

              {/* CONTROLS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <button onClick={prevTrack} className="retro-btn" style={{ fontSize: '10px', width: '30px', backgroundColor: '#333', color: '#ccc' }}>|&lt;</button>
                  <button onClick={() => setIsPlaying(!isPlaying)} className="retro-btn" style={{ fontSize: '10px', width: '40px', backgroundColor: '#333', color: '#00ff00' }}>
                      {isPlaying ? '||' : '►'}
                  </button>
                  <button onClick={nextTrack} className="retro-btn" style={{ fontSize: '10px', width: '30px', backgroundColor: '#333', color: '#ccc' }}>&gt;|</button>
                  <button onClick={() => window.open('https://entropyofficial.com', '_blank')} className="retro-btn" style={{ fontSize: '10px', width: '30px', backgroundColor: '#333', color: '#ccc' }}>⏏</button>
              </div>

              {/* VOLUME SLIDER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '8px', color: '#888', fontFamily: 'monospace' }}>VOL</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{ 
                        width: '100%', 
                        height: '4px', 
                        appearance: 'none', 
                        background: '#333',
                        outline: 'none'
                    }} 
                  />
              </div>

          </div>
      )}
      
      {/* Marquee Animation Style */}
      <style jsx>{`
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
