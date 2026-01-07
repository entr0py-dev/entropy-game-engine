import React from "react";

// --- CONFIGURATION ---
const WALL_LEFT_IMG = "/texture_leeds_left_v3.png";
const WALL_RIGHT_IMG = "/texture_leeds_right_v3.png";
const TUNNEL_DEPTH = "400vmax"; 

// PRECISE MATH FOR SEAMLESS LOOP
const TILE_SIZE = "3072px"; 

interface TunnelViewProps {
  isPlaying?: boolean; 
  speedModifier?: number;
}

export const TunnelView: React.FC<TunnelViewProps> = ({ isPlaying = false, speedModifier = 1 }) => {
  
  // SPEED: 1.0s (The requested speed)
  const baseDuration = 1.0; 
  const calculatedDuration = isPlaying ? (baseDuration / speedModifier) : 0;
  const animationDuration = calculatedDuration > 0 ? `${calculatedDuration}s` : "0s";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#1a1a1a", // Darker background to hide any gaps (No more bright blue)
        overflow: "hidden",
        perspective: "350px", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 0, 
      }}
    >
      <style>
        {`
          /* LEFT WALL ANIMATION */
          @keyframes moveWallLeft {
            from { background-position-x: 0px; }
            to { background-position-x: -${TILE_SIZE}; } 
          }

          /* RIGHT WALL ANIMATION */
          @keyframes moveWallRight {
            from { background-position-x: 0px; }
            to { background-position-x: ${TILE_SIZE}; } 
          }

          /* ROAD ANIMATION */
          @keyframes moveRoad {
            from { background-position-y: 0px; }
            to { background-position-y: 200px; } 
          }

          .tunnel-plane {
            position: absolute;
            backface-visibility: hidden;
            transform-style: preserve-3d;
            image-rendering: pixelated; 
          }

          .wall-base {
            /* 1. TEXTURE SIZING: 
               height: 110vh ensures the image itself is tall enough to look correct (shops + roofs).
               auto width maintains aspect ratio. */
            background-size: ${TILE_SIZE} 130vh; 
            
            background-repeat: repeat-x; 
            
            /* 2. ALIGNMENT:
               Align image to the BOTTOM of the container. 
               We will shift the container up/down to place the shops on the road. */
            background-position-y: bottom; 
            
            filter: brightness(0.9); 
          }

          .road-texture {
             background-color: #222; 
             background-image: repeating-linear-gradient(
               to bottom,
               #ffffff,
               #ffffff 50px,   
               transparent 50px,
               transparent 100px 
             );
             background-size: 20px 100%; 
             background-position: center top; 
             background-repeat: no-repeat;
             animation: moveRoad ${isPlaying ? "0.2s" : "0s"} linear infinite; 
          }
        `}
      </style>

      {/* CEILING (Sky) */}
      <div
        className="tunnel-plane"
        style={{
          width: "300vw",
          height: TUNNEL_DEPTH,
          background: "linear-gradient(to bottom, #001133, #87CEEB)", // Night-ish gradient
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
          transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-40vh)",
        }}
      />

      {/* LEFT WALL */}
      <div
        className="tunnel-plane wall-base"
        style={{
          backgroundImage: `url('${WALL_LEFT_IMG}')`,
          width: TUNNEL_DEPTH,
          
          // HEIGHT FIX:
          // 800vh is massive. This ensures the div extends way above the screen so text/roofs exist.
          height: "800vh", 

          top: "50%",
          left: "50%",
          
          // TRANSFORM MATH:
          // translate(-50%, -94%): Shifts the 800vh div UP. 
          // Since the image is at the BOTTOM (background-position-y: bottom), 
          // this keeps the "shops" near the road level, but leaves 700vh of space above for roofs/sky.
          // translateZ(-110vw): Push walls slightly wider (Corridor width).
          transform: "translate(-50%, -94%) rotateY(90deg) translateZ(-110vw)",
          
          animation: `moveWallLeft ${animationDuration} linear infinite`
        }}
      />

      {/* RIGHT WALL */}
      <div
        className="tunnel-plane wall-base"
        style={{
          backgroundImage: `url('${WALL_RIGHT_IMG}')`,
          width: TUNNEL_DEPTH,
          height: "800vh", // Same massive height
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -94%) rotateY(-90deg) translateZ(-110vw)",
          animation: `moveWallRight ${animationDuration} linear infinite`
        }}
      />

      {/* FOG OVERLAY (Hides the end of the tunnel) */}
      <div 
        style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0, 0.8) 95%)',
            pointerEvents: 'none',
            zIndex: 10
        }}
      />
    </div>
  );
};

export default TunnelView;
