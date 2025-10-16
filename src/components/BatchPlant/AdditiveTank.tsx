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
  // Dynamic fill level calculation - fill increases as water is added
  const displayFillLevel = targetVolume > 0
    ? Math.max(0, (currentVolume / targetVolume * 100))
    : fillLevel;
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
      <circle 
        cx="17.5" 
        cy="100" 
        r="3" 
        className={isValveActive ? "fill-green-500 animate-pulse" : "fill-red-500"} 
        stroke="white" 
        strokeWidth="1" 
      />
      
      {/* Flow indicator when active */}
      {isValveActive && (
        <>
          <line 
            x1="17.5" 
            y1="105" 
            x2="17.5" 
            y2="115" 
            className="stroke-blue-400 animate-pulse" 
            strokeWidth="3" 
            strokeDasharray="5,5"
          />
          <circle cx="25" cy="100" r="2" className="fill-green-400 animate-pulse" />
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
            className={`text-[8px] font-semibold ${isValveActive ? 'fill-green-400' : 'fill-red-400'}`}
          >
            {isValveActive ? 'ACTIVE' : 'IDLE'}
          </text>
        </>
      )}
    </g>
  );
};
