interface WeighHopperProps {
  x: number;
  y: number;
  fillLevel?: number;
  currentWeight?: number;
  targetWeight?: number;
  isWeighing?: boolean;
  isDischargingActive?: boolean;
  materialType?: 'aggregate' | 'water' | 'cement';
  label?: string;
  width?: number; // New prop for elongated hopper (System 1)
}

export const WeighHopper = ({ 
  x, 
  y, 
  fillLevel = 0,
  currentWeight = 0,
  targetWeight = 0,
  isWeighing = false,
  isDischargingActive = false,
  materialType = 'aggregate',
  label,
  width = 100 // Default width for normal hopper
}: WeighHopperProps) => {
  const displayFillLevel =
    typeof fillLevel === 'number'
      ? Math.min(50, Math.max(0, (fillLevel / 100) * 50))
      : targetWeight > 0
        ? Math.min(50, Math.max(0, (currentWeight / targetWeight) * 50))
        : 0;
  
  // Determine fill color based on material type
  const getFillColor = () => {
    if (materialType === 'water') return 'fill-blue-400';
    if (materialType === 'cement') return 'fill-equipment-cement';
    return 'fill-equipment-aggregate';
  };
  
  // Calculate dimensions based on width
  const hopperWidth = width;
  const leftEdge = 10;
  const rightEdge = leftEdge + hopperWidth - 20;
  const bottomLeft = leftEdge + 20;
  const bottomRight = rightEdge - 20;
  const centerX = leftEdge + (hopperWidth - 20) / 2;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Hopper body - trapezoid shape (scalable width) */}
      <path
        d={`M ${leftEdge} 0 L ${rightEdge} 0 L ${bottomRight} 50 L ${bottomLeft} 50 Z`}
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Fill level */}
      {displayFillLevel > 0 && (
        <path
          d={`M ${leftEdge + (50 - displayFillLevel) * 0.4} ${50 - displayFillLevel} L ${rightEdge - (50 - displayFillLevel) * 0.4} ${50 - displayFillLevel} L ${bottomRight} 50 L ${bottomLeft} 50 Z`}
          className={`${getFillColor()}`}
          opacity="0.9"
        />
      )}
      
      {/* Bottom outlet */}
      <path
        d={`M ${bottomLeft} 50 L ${centerX} 70 L ${bottomRight} 50`}
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Discharge Valve with indicator */}
      <circle 
        cx={centerX} 
        cy="76" 
        r="8" 
        className={isDischargingActive ? "fill-red-500" : "fill-green-500"} 
        stroke="white" 
        strokeWidth="2"
      >
        {isDischargingActive && (
          <animate
            attributeName="opacity"
            values="1;0.2;1"
            dur="0.4s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      
      {/* LED Indicator - Enhanced visibility */}
      {isDischargingActive && (
        <>
          {/* Main blinking LED */}
          <circle cx={centerX} cy="76" r="3" className="fill-red-400">
            <animate
              attributeName="opacity"
              values="1;0.2;1"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Secondary LED ring */}
          <circle cx={centerX} cy="76" r="6" className="stroke-red-400" fill="none" strokeWidth="1">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Discharge text with blinking */}
          <text
            x={centerX}
            y="95"
            textAnchor="middle"
            className="fill-red-400 text-[9px] font-bold"
          >
            <tspan>DISCHARGING</tspan>
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </text>
        </>
      )}
      
      {/* Label */}
      {label && (
        <text
          x={centerX}
          y="105"
          textAnchor="middle"
          className="fill-hmi-text text-[10px] font-semibold"
        >
          {label}
        </text>
      )}
    </g>
  );
};
