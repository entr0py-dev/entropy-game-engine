import React from "react";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left.png";
const WALL_RIGHT_IMG = "/texture_leeds_right.png";
const TUNNEL_DEPTH = "400vmax"; 

interface TunnelViewProps {
  isPlaying: boolean; // CONTROLS IF THE WORLD MOVES
}

export const TunnelView: React.FC<TunnelViewProps> = ({ isPlaying }) => {
  
  // LOGIC: If game is NOT playing, speed is 0 (Paused). 
  // If playing, speed is 3 seconds per loop (Fast).
  const animationDuration = isPlaying ? "3s" : "0s";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#87CEEB",
        overflow: "hidden",
        perspective: "300px", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 0, 
      }}
    >
      <style>
        {`
          @keyframes moveTexture {
            from { background-position: 0 0; }
            to { background-position: 0 -3000px; } /* Increased to match larger texture size */
          }

          @keyframes moveRoad {
            from { background-position: 50% 0; }
            to { background-position: 50% 1000px; } 
          }

          .tunnel-plane {
            position: absolute;
            backface-visibility: hidden;
            image-rendering: pixelated; 
          }

          .wall-texture {
            /* FIXED: MUCH LARGER SIZE */
            background-size: 1500px 1500px; 
            background-repeat: repeat;
            /* Animation speed is now dynamic */
            animation: moveTexture ${animationDuration} linear infinite;
            filter: brightness(0.9); 
          }

          .road-texture {
             background-color: #2a2a2a;
             background-image: 
                linear-gradient(90deg, transparent 48%, #ffffff 48%, #ffffff 52%, transparent 52%);
             background-size: 100% 300px; 
             animation: moveRoad ${isPlaying ? "0.6s" : "0s"} linear infinite; 
          }
        `}
      </style>

      {/* 1. CEILING (Sky) */}
      <div
        className="tunnel-plane"
        style={{
          width: "300vw",
          height: TUNNEL_DEPTH,
          background: "linear-gradient(to bottom, #00BFFF, #87CEEB)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateX(-90deg) translateZ(-50vh)",
        }}
      />

      {/* 2. FLOOR (Road) */}
      <div
        className="tunnel-plane road-texture"
        style={{
          width: "300vw",
          height: TUNNEL_DEPTH,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-50vh)",
        }}
      />

      {/* 3. LEFT WALL (Shops Side A) */}
      <div
        className="tunnel-plane wall-texture"
        style={{
          backgroundImage: `url('${WALL_LEFT_IMG}')`,
          width: TUNNEL_DEPTH,
          height: "300vh", 
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateY(90deg) translateZ(-50vw)",
        }}
      />

      {/* 4. RIGHT WALL (Shops Side B) */}
      <div
        className="tunnel-plane wall-texture"
        style={{
          backgroundImage: `url('${WALL_RIGHT_IMG}')`,
          width: TUNNEL_DEPTH,
          height: "300vh", 
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateY(-90deg) translateZ(-50vw)",
        }}
      />

      {/* DEPTH FOG */}
      <div 
        style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 10%, rgba(135, 206, 235, 0.8) 70%)',
            pointerEvents: 'none',
            zIndex: 10
        }}
      />
    </div>
  );
};
