import React from "react";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left.png";
const WALL_RIGHT_IMG = "/texture_leeds_right.png";
const TUNNEL_DEPTH = "400vmax"; 

// PRECISE MATH FOR SEAMLESS LOOP
const TILE_SIZE = "1024px"; // Must match your image width exactly

interface TunnelViewProps {
  isPlaying?: boolean; 
  speedModifier?: number; // ADDED BACK TO FIX BUILD ERROR
}

// 1. NAMED EXPORT
export const TunnelView: React.FC<TunnelViewProps> = ({ isPlaying = true, speedModifier = 1 }) => {
  
  // Calculate duration based on speed modifier. 
  // Base speed is 1 second per 1024px. 
  // Higher modifier = Lower duration (Faster).
  const baseDuration = 1; 
  const calculatedDuration = isPlaying ? (baseDuration / speedModifier) : 0;
  
  // Convert to string with 's' unit, handling the 0 case safely
  const animationDuration = calculatedDuration > 0 ? `${calculatedDuration}s` : "0s";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#87CEEB",
        overflow: "hidden",
        perspective: "250px", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 0, 
      }}
    >
      <style>
        {`
          /* LEFT WALL: Slides exactly 1 tile width negative */
          @keyframes moveWallLeft {
            from { background-position-x: 0px; }
            to { background-position-x: -${TILE_SIZE}; } 
          }

          /* RIGHT WALL: Slides exactly 1 tile width positive (Reversed) */
          @keyframes moveWallRight {
            from { background-position-x: 0px; }
            to { background-position-x: ${TILE_SIZE}; } 
          }

          /* ROAD: Animates Y-Axis */
          @keyframes moveRoad {
            from { background-position-y: 0px; }
            to { background-position-y: 1000px; } 
          }

          .tunnel-plane {
            position: absolute;
            backface-visibility: hidden;
            image-rendering: pixelated; 
          }

          .wall-base {
            /* FIXED: 
               Width = 1024px (Hardcoded to match animation)
               Height = 100% of the wall (prevents stacking)
            */
            background-size: ${TILE_SIZE} 100%; 
            background-repeat: repeat-x; /* STRICTLY Horizontal repeat only */
            filter: brightness(0.9); 
          }

          .road-texture {
             background-color: #2a2a2a;
             background-image: 
                linear-gradient(90deg, transparent 45%, #ffffff 45%, #ffffff 55%, transparent 55%);
             background-size: 100% 300px; 
             animation: moveRoad ${isPlaying ? "0.3s" : "0s"} linear infinite; 
          }
        `}
      </style>

      {/* CEILING */}
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

      {/* FLOOR */}
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

      {/* LEFT WALL */}
      <div
        className="tunnel-plane wall-base"
        style={{
          backgroundImage: `url('${WALL_LEFT_IMG}')`,
          width: TUNNEL_DEPTH,
          height: "300vh", 
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateY(90deg) translateZ(-50vw)",
          /* Apply Left Animation */
          animation: `moveWallLeft ${animationDuration} linear infinite`
        }}
      />

      {/* RIGHT WALL */}
      <div
        className="tunnel-plane wall-base"
        style={{
          backgroundImage: `url('${WALL_RIGHT_IMG}')`,
          width: TUNNEL_DEPTH,
          height: "300vh", 
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateY(-90deg) translateZ(-50vw)",
          /* Apply Right Animation */
          animation: `moveWallRight ${animationDuration} linear infinite`
        }}
      />

      {/* FOG */}
      <div 
        style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 0%, rgba(135, 206, 235, 1) 80%)',
            pointerEvents: 'none',
            zIndex: 10
        }}
      />
    </div>
  );
};

// 2. DEFAULT EXPORT
export default TunnelView;
