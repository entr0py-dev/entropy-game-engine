import React from "react";

// --- CONFIGURATION ---
const SPEED = 3; // Seconds per loop (Lower = Faster)
const WALL_LEFT_IMG = "/texture_leeds_left.png";
const WALL_RIGHT_IMG = "/texture_leeds_right.png";
const TUNNEL_DEPTH = "400vmax"; // How deep the tunnel renders

interface TunnelViewProps {
  speedModifier?: number; // Optional: to make the tunnel go faster/slower dynamically later
}

export const TunnelView: React.FC<TunnelViewProps> = ({ speedModifier = 1 }) => {
  // Calculate dynamic speed based on prop (useful for "boosting" in game)
  const currentSpeed = SPEED / speedModifier;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#87CEEB", // Fallback Sky Blue
        overflow: "hidden",
        perspective: "300px", // Lower = more intense "speed" feeling
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 0, 
      }}
    >
      {/* --- ANIMATION STYLES --- */}
      <style>
        {`
          @keyframes moveTexture {
            from { background-position: 0 0; }
            to { background-position: 0 -1000px; } 
          }

          @keyframes moveRoad {
            from { background-position: 50% 0; }
            to { background-position: 50% 1000px; } 
          }

          .tunnel-plane {
            position: absolute;
            backface-visibility: hidden;
            image-rendering: pixelated; /* CRISP PIXELS */
          }

          .wall-texture {
            background-size: 500px 500px; 
            background-repeat: repeat;
            animation: moveTexture ${currentSpeed}s linear infinite;
            filter: brightness(0.9); 
          }

          .road-texture {
             /* CSS GENERATED ASPHALT & LINES */
             background-color: #2a2a2a;
             background-image: 
                linear-gradient(90deg, transparent 48%, #ffffff 48%, #ffffff 52%, transparent 52%);
             background-size: 100% 300px; 
             animation: moveRoad ${currentSpeed * 0.3}s linear infinite; 
          }
        `}
      </style>

      {/* --- THE FOUR PLANES --- */}

      {/* 1. CEILING (Sky) */}
      <div
        className="tunnel-plane"
        style={{
          width: "300vw",
          height: TUNNEL_DEPTH,
          background: "linear-gradient(to bottom, #00BFFF, #87CEEB)", // Y2K Sky Gradient
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
          height: "300vh", // Oversized to prevent cutoff
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateY(90deg) translateZ(-50vw)",
        }}
      />

      {/* 4. RIGHT WALL (Shops Side B - Mirrored) */}
      <div
        className="tunnel-plane wall-texture"
        style={{
          backgroundImage: `url('${WALL_RIGHT_IMG}')`,
          width: TUNNEL_DEPTH,
          height: "300vh", // Oversized to prevent cutoff
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateY(-90deg) translateZ(-50vw)",
        }}
      />

      {/* --- DEPTH FOG --- */}
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
