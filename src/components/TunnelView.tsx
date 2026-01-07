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
  
  // SPEED: 1.0s is the "Goldilocks" zone (Faster than 3s, slower than 0.5s)
  const baseDuration = 1.0; 
  const calculatedDuration = isPlaying ? (baseDuration / speedModifier) : 0;
  const animationDuration = calculatedDuration > 0 ? `${calculatedDuration}s` : "0s";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#87CEEB",
        overflow: "hidden",
        perspective: "350px", // Increased slightly to widen the feel
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 0, 
      }}
    >
      <style>
        {`
          /* LEFT WALL */
          @keyframes moveWallLeft {
            from { background-position-x: 0px; }
            to { background-position-x: -${TILE_SIZE}; } 
          }

          /* RIGHT WALL */
          @keyframes moveWallRight {
            from { background-position-x: 0px; }
            to { background-position-x: ${TILE_SIZE}; } 
          }

          /* ROAD */
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
            /* 1. TEXTURE HEIGHT FIX: 
               We force the image to be ~120vh tall so it doesn't look stretched 
               inside the massive container. */
            background-size: ${TILE_SIZE} 120vh; 
            
            background-repeat: repeat-x; 
            
            /* 2. ALIGNMENT:
               Keep image at the bottom of the container. 
               We will move the whole container UP in the transform to align shops with road. */
            background-position-y: bottom; 
            
            filter: brightness(0.9); 
          }

          .road-texture {
             background-color: #333333; 
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
          transform: "translate(-50%, -50%) rotateX(90deg) translateZ(-40vh)",
        }}
      />

      {/* LEFT WALL */}
      <div
        className="tunnel-plane wall-base"
        style={{
          backgroundImage: `url('${WALL_LEFT_IMG}')`,
          width: TUNNEL_DEPTH,
          
          // HEIGHT: Tall enough to show full skyscrapers without clipping tops
          height: "400vh", 

          top: "50%",
          left: "50%",
          
          // TRANSFORM EXPLANATION:
          // translate(-50%, -82%): This moves the wall UP. Since the image is at the bottom,
          // this aligns the shop-fronts with the road.
          // translateZ(-120vw): Pushes walls wider apart (Corridor Width).
          transform: "translate(-50%, -82%) rotateY(90deg) translateZ(-120vw)",
          
          animation: `moveWallLeft ${animationDuration} linear infinite`
        }}
      />

      {/* RIGHT WALL */}
      <div
        className="tunnel-plane wall-base"
        style={{
          backgroundImage: `url('${WALL_RIGHT_IMG}')`,
          width: TUNNEL_DEPTH,
          height: "400vh", 
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -82%) rotateY(-90deg) translateZ(-120vw)",
          animation: `moveWallRight ${animationDuration} linear infinite`
        }}
      />

      {/* FOG */}
      <div 
        style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 30%, rgba(135, 206, 235, 1) 90%)',
            pointerEvents: 'none',
            zIndex: 10
        }}
      />
    </div>
  );
};

export default TunnelView;
