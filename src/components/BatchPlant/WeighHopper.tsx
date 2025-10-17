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
        r="6" 
        className={isDischargingActive ? "fill-red-500" : "fill-green-500"} 
        stroke="white" 
        strokeWidth="1"
      >
        {isDischargingActive && (
          <animate
            attributeName="opacity"
            values="1;0.4;1"
            dur="0.3s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      
      {/* LED Indicator */}
      {isDischargingActive && (
        <>
          <circle cx="60" cy="76" r="2" className="fill-red-400">
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            x="50"
            y="90"
            textAnchor="middle"
            className="fill-red-400 text-[8px] font-semibold"
          >
            DISCHARGING
          </text>
        </>
      )}
      
      {/* Label */}
      {label && (
        <text
          x="50"
          y="100"
          textAnchor="middle"
          className="fill-hmi-text text-[10px] font-semibold"
        >
          {label}
        </text>
      )}
    </g>
  );
};
