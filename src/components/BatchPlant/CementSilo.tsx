interface CementSiloProps {
  x: number;
  y: number;
  fillLevel?: number;
  label?: string;
  currentVolume?: number;
  capacity?: number;
  isActive?: boolean;
}

export const CementSilo = ({ 
  x, 
  y, 
  fillLevel = 0, 
  label,
  currentVolume = 0,
  capacity = 120000,
  isActive = false
}: CementSiloProps) => {
  // Calculate percentage for fill level (0-100)
  const percentage = capacity > 0 ? (currentVolume / capacity) * 100 : 0;
  const calculatedFillLevel = (percentage / 100) * 108; // 108 is the height of silo body

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
        className="fill-equipment-cement transition-all duration-1000 ease-in-out"
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
      <circle 
        cx="20" 
        cy="155" 
        r="5" 
        className={isActive ? "fill-red-500" : "fill-valve-active"} 
        stroke="white" 
        strokeWidth="1" 
      >
        {isActive && (
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="0.6s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      {/* Top platform */}
      <rect
        x="-5"
        y="10"
        width="50"
        height="5"
        className="fill-equipment-conveyor stroke-hmi-border"
        strokeWidth="1"
      />
      
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
    </g>
  );
};
