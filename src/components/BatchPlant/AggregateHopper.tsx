interface AggregateHopperProps {
  x: number;
  y: number;
  fillLevel?: number;
  isActive?: boolean;
  isFilling?: boolean;
  materialType?: 'pasir' | 'batu';
  width?: number;
}

export const AggregateHopper = ({ 
  x, 
  y, 
  fillLevel = 70, 
  isActive = false, 
  isFilling = false,
  materialType = 'pasir',
  width = 50
}: AggregateHopperProps) => {
  // Determine material color based on type
  const materialColor = materialType === 'batu' 
    ? 'fill-equipment-stone' 
    : 'fill-equipment-aggregate';
  
  const leftInset = width * 0.2;
  const rightInset = width * 0.2;
  const centerX = width / 2;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Hopper body */}
      <path
        d={`M 0 0 L ${width} 0 L ${width} 40 L ${width - leftInset} 60 L ${leftInset} 60 L 0 40 Z`}
        className="fill-card stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Aggregate fill */}
      <path
        d={`M 2 ${60 - fillLevel * 0.6} L ${width - 2} ${60 - fillLevel * 0.6} L ${width - 2} 40 L ${width - leftInset - 2} 58 L ${leftInset + 2} 58 L 2 40 Z`}
        className={materialColor}
      />
      {/* Bottom cone funnel */}
      <path
        d={`M ${leftInset} 60 L ${centerX} 75 L ${width - rightInset} 60`}
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Filling Indicator - Yellow LED at top when material is being filled from bin */}
      {isFilling && (
        <circle cx={width - 5} cy="5" r="3" className="fill-yellow-400">
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      
      {/* Discharge Valve with status indicator (bottom) */}
      <circle 
        cx={centerX} 
        cy="80" 
        r="5" 
        className={isActive ? "fill-red-500" : "fill-green-500"} 
        stroke="white" 
        strokeWidth="1"
      >
        {isActive && (
          <animate
            attributeName="opacity"
            values="1;0.4;1"
            dur="0.3s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      
      {/* LED Indicator for discharge */}
      {isActive && (
        <circle cx={centerX + 8} cy="80" r="2" className="fill-red-400">
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="0.3s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      
      {/* Status Text */}
      <text
        x={centerX}
        y="92"
        textAnchor="middle"
        className={`text-[8px] font-semibold ${isActive ? 'fill-red-400' : 'fill-green-400'}`}
      >
        {isActive ? 'OPEN' : 'CLOSED'}
      </text>
    </g>
  );
};
