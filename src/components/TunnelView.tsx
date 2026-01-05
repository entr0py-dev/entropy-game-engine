import React from "react";

// --- CONFIGURATION ---
// UPDATE THESE PATHS TO YOUR NEW V3 IMAGES
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
const TUNNEL_DEPTH = "400vmax"; 

// PRECISE MATH FOR SEAMLESS LOOP - UPDATED FOR NEW 3072px WIDTH
const TILE_SIZE = "3072px"; 

interface TunnelViewProps {
  isPlaying?: boolean; 
  speedModifier?: number;
}

export const TunnelView: React.FC<TunnelViewProps> = ({ isPlaying = true, speedModifier = 1 }) => {
  
  // Slower base duration for wider image to keep speed feeling similar
  const baseDuration = 3; 
  const calculatedDuration = isPlaying ? (baseDuration / speedModifier) : 0;
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
            to { background-position-y: 200px; } /* Moves by one dash cycle */
          }

          .tunnel-plane {
            position: absolute;
            backface-visibility: hidden;
            image-rendering: pixelated; 
          }

          .wall-base {
            /* FIXED: Width=3072px, Height=100% */
            background-size: ${TILE_SIZE} 100%; 
            background-repeat: repeat-x; /* Horizontal repeat only */
            filter: brightness(0.9); 
          }

          .road-texture {
             background-color: #333333; /* Darker grey to match new pavement */
             /* Centered white dashed line */
             background-image: repeating-linear-gradient(
               to bottom,
               #ffffff,
               #ffffff 50px,   /* Dash length */
               transparent 50px,
               transparent 100px /* Gap length */
             );
             background-size: 20px 100%; /* Width of the dashed line */
             background-position: center top; /* Center the line */
             background-repeat: no-repeat;
             animation: moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite; 
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
          transform: "translate(-50%, -50%) rotateX(-90deg) translateZ(-40vh)",
        }}
      />

      {/* FLOOR (Road) */}
      <div
        className="tunnel-plane road-texture"
        style={{
          width: "300vw",
          height: TUNNEL_DEPTH,
          top: "50%",
          left: "50%",
          /* Lowered (-40vh) for a better running perspective */
          transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-40vh)",
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
          /* Widened tunnel (-80vw) */
          transform: "translate(-50%, -50%) rotateY(90deg) translateZ(-80vw)",
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
          /* Widened tunnel (-80vw) */
          transform: "translate(-50%, -50%) rotateY(-90deg) translateZ(-80vw)",
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

export default TunnelView;
