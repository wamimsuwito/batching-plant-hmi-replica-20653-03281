import mixerTruckImage from "@/assets/mixer-truck.png";

interface MixerTruckProps {
  x: number;
  y: number;
  isReceiving?: boolean;
  isMoving?: boolean;
}

export const MixerTruck = ({ x, y, isReceiving = false, isMoving = false }: MixerTruckProps) => {
  const truckWidth = 180;
  const truckHeight = 110;
  
  // Drum position for overlay animation (relative to truck image)
  const drumX = truckWidth * 0.55; // 55% from left (center of drum)
  const drumY = truckHeight * 0.35; // 35% from top
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Real Truck Image */}
      <image
        href={mixerTruckImage}
        width={truckWidth}
        height={truckHeight}
        x={0}
        y={0}
        preserveAspectRatio="xMidYMid meet"
      />
      
      {/* Rotating Drum Overlay - visible when receiving concrete */}
      {isReceiving && (
        <g className="animate-spin-slow" style={{ transformOrigin: `${drumX}px ${drumY}px` }}>
          {/* Drum rotation indicator - circular stripes */}
          <ellipse
            cx={drumX}
            cy={drumY}
            rx="22"
            ry="16"
            fill="none"
            stroke="#7f8c8d"
            strokeWidth="3"
            strokeDasharray="10,6"
            opacity="0.4"
          />
          
          {/* Rotation indicator lines */}
          <line 
            x1={drumX - 20} 
            y1={drumY - 10} 
            x2={drumX - 20} 
            y2={drumY + 10} 
            stroke="#7f8c8d" 
            strokeWidth="2" 
            opacity="0.3" 
          />
          <line 
            x1={drumX} 
            y1={drumY - 14} 
            x2={drumX} 
            y2={drumY + 14} 
            stroke="#7f8c8d" 
            strokeWidth="2" 
            opacity="0.3" 
          />
          <line 
            x1={drumX + 20} 
            y1={drumY - 10} 
            x2={drumX + 20} 
            y2={drumY + 10} 
            stroke="#7f8c8d" 
            strokeWidth="2" 
            opacity="0.3" 
          />
        </g>
      )}
      
      {/* Concrete flow indicator from chute to drum opening */}
      {isReceiving && (
        <g opacity="0.6">
          <path 
            d={`M ${drumX - 15} ${-10} Q ${drumX - 14} ${0} ${drumX - 13} ${10}`}
            stroke="#95a5a6" 
            strokeWidth="3" 
            strokeLinecap="round"
            fill="none"
          >
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.8s" repeatCount="indefinite" />
          </path>
          <path 
            d={`M ${drumX} ${-10} Q ${drumX} ${0} ${drumX} ${10}`}
            stroke="#95a5a6" 
            strokeWidth="3" 
            strokeLinecap="round"
            fill="none"
          >
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
          </path>
          <path 
            d={`M ${drumX + 15} ${-10} Q ${drumX + 14} ${0} ${drumX + 13} ${10}`}
            stroke="#95a5a6" 
            strokeWidth="3" 
            strokeLinecap="round"
            fill="none"
          >
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
          </path>
        </g>
      )}
    </g>
  );
};
