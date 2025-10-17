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
  label
}: WeighHopperProps) => {
  const displayFillLevel = targetWeight > 0 ? (currentWeight / targetWeight) * 50 : 0;
  
  // Determine fill color based on material type
  const getFillColor = () => {
    if (materialType === 'water') return 'fill-blue-400';
    if (materialType === 'cement') return 'fill-equipment-cement';
    return 'fill-equipment-aggregate';
  };
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Hopper body - trapezoid shape (BIGGER) */}
      <path
        d="M 10 0 L 90 0 L 70 50 L 30 50 Z"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Fill level */}
      {displayFillLevel > 0 && (
        <path
          d={`M ${10 + (50 - displayFillLevel) * 0.4} ${50 - displayFillLevel} L ${90 - (50 - displayFillLevel) * 0.4} ${50 - displayFillLevel} L ${70} 50 L 30 50 Z`}
          className={`${getFillColor()} ${isWeighing ? 'animate-pulse' : ''}`}
          opacity="0.9"
        />
      )}
      
      {/* Bottom outlet (LONGER) */}
      <path
        d="M 30 50 L 50 70 L 70 50"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Discharge Valve with indicator */}
      <circle 
        cx="50" 
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
          <circle cx="50" cy="76" r="3" className="fill-red-400">
            <animate
              attributeName="opacity"
              values="1;0.2;1"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Secondary LED ring */}
          <circle cx="50" cy="76" r="6" className="stroke-red-400" fill="none" strokeWidth="1">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Discharge text with blinking */}
          <text
            x="50"
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
          x="50"
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
