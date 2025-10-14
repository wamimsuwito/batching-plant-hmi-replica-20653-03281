interface CementSiloProps {
  x: number;
  y: number;
  fillLevel?: number;
  label?: string;
  currentVolume?: number;
  capacity?: number;
}

export const CementSilo = ({ 
  x, 
  y, 
  fillLevel = 0, 
  label,
  currentVolume = 0,
  capacity = 120000
}: CementSiloProps) => {
  // Calculate percentage for fill level (0-100)
  const percentage = capacity > 0 ? (currentVolume / capacity) * 100 : 0;
  const calculatedFillLevel = (percentage / 100) * 108; // 108 is the height of silo body
  
  // Determine fill color based on percentage
  const getFillColor = () => {
    if (percentage === 0) return "fill-gray-400";
    if (percentage < 20) return "fill-red-500";
    if (percentage < 50) return "fill-yellow-500";
    return "fill-green-500";
  };

  const fillColor = getFillColor();

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Silo body */}
      <rect
        x="0"
        y="20"
        width="40"
        height="110"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Fill level with smooth transition */}
      <rect
        x="2"
        y={128 - calculatedFillLevel}
        width="36"
        height={calculatedFillLevel}
        className={`${fillColor} transition-all duration-1000 ease-in-out`}
      />
      {/* Top flat (not cone) */}
      <rect
        x="0"
        y="15"
        width="40"
        height="5"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Bottom cone */}
      <path
        d="M 0 130 L 20 150 L 40 130 Z"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Valve at bottom */}
      <circle cx="20" cy="155" r="5" className="fill-valve-active stroke-hmi-border" strokeWidth="1" />
      {/* Top platform */}
      <rect
        x="-5"
        y="10"
        width="50"
        height="5"
        className="fill-equipment-conveyor stroke-hmi-border"
        strokeWidth="1"
      />
      {/* Percentage display inside silo */}
      <text
        x="20"
        y="80"
        textAnchor="middle"
        className="fill-white text-xl font-bold"
        style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
      >
        {percentage.toFixed(0)}%
      </text>
      
      {/* Label */}
      {label && (
        <text
          x="20"
          y="175"
          textAnchor="middle"
          className="fill-hmi-text text-xs font-semibold"
        >
          {label}
        </text>
      )}
      
      {/* Volume display */}
      <text
        x="20"
        y="188"
        textAnchor="middle"
        className="fill-hmi-text text-[9px]"
      >
        {currentVolume.toLocaleString("id-ID")} kg
      </text>
    </g>
  );
};
