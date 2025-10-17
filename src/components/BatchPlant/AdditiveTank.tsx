interface AdditiveTankProps {
  x: number;
  y: number;
  fillLevel?: number;
  label?: string;
  isValveActive?: boolean;
  currentVolume?: number;
  targetVolume?: number;
}

export const AdditiveTank = ({ 
  x, 
  y, 
  fillLevel = 80, 
  label, 
  isValveActive = false,
  currentVolume = 0,
  targetVolume = 0
}: AdditiveTankProps) => {
  // Tank capacity for standby mode (2000 kg for water)
  const TANK_CAPACITY = 2000;
  
  // Dynamic fill level calculation
  // Standby: show full tank (2000 kg)
  // Weighing: show decreasing level as water is dispensed
  const displayFillLevel = targetVolume > 0
    ? Math.max(0, ((TANK_CAPACITY - currentVolume) / TANK_CAPACITY * 100))
    : 100; // Full tank in standby
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Tank body */}
      <rect
        x="0"
        y="15"
        width="35"
        height="70"
        rx="5"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Fill level */}
      <rect
        x="2"
        y={83 - displayFillLevel * 0.7}
        width="31"
        height={displayFillLevel * 0.7}
        rx="4"
        className="fill-equipment-tank"
      />
      {/* Top cap */}
      <ellipse
        cx="17.5"
        cy="15"
        rx="17.5"
        ry="8"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Platform */}
      <rect
        x="-5"
        y="85"
        width="45"
        height="4"
        className="fill-equipment-conveyor stroke-hmi-border"
        strokeWidth="1"
      />
      {/* Support legs */}
      <line x1="5" y1="89" x2="5" y2="110" className="stroke-hmi-border" strokeWidth="2" />
      <line x1="30" y1="89" x2="30" y2="110" className="stroke-hmi-border" strokeWidth="2" />
      {/* Pump/valve at bottom with indicator */}
      <rect
        x="10"
        y="95"
        width="15"
        height="10"
        className="fill-equipment-tank stroke-hmi-border"
        strokeWidth="1"
      />
      {/* Valve indicator - RED blinking when weighing */}
      <circle 
        cx="17.5" 
        cy="100" 
        r="3" 
        className={isValveActive ? "fill-red-500" : "fill-gray-500"} 
        stroke="white" 
        strokeWidth="1"
      >
        {/* Very fast blinking animation when active (weighing) */}
        {isValveActive && (
          <animate
            attributeName="opacity"
            values="1;0.2;1"
            dur="0.3s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      
      {/* Flow indicator when active */}
      {isValveActive && (
        <>
          <line 
            x1="17.5" 
            y1="105" 
            x2="17.5" 
            y2="115" 
            className="stroke-blue-400" 
            strokeWidth="3" 
            strokeDasharray="5,5"
          >
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </line>
          <circle cx="25" cy="100" r="2" className="fill-red-400">
            <animate
              attributeName="opacity"
              values="1;0.2;1"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
      {/* Label and Status */}
      {label && (
        <>
          <text
            x="17.5"
            y="125"
            textAnchor="middle"
            className="fill-hmi-text text-xs font-semibold"
          >
            {label}
          </text>
          <text
            x="17.5"
            y="135"
            textAnchor="middle"
            className={`text-[8px] font-semibold ${isValveActive ? 'fill-red-400' : 'fill-gray-400'}`}
          >
            {isValveActive ? 'WEIGHING' : 'STANDBY'}
          </text>
        </>
      )}
    </g>
  );
};
