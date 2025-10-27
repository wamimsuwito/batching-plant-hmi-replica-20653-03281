interface ConveyorBeltProps {
  x: number;
  y: number;
  width?: number;
  angle?: number;
  isRunning?: boolean;
  horizontal?: boolean; // NEW: for horizontal conveyor mode
}

export const ConveyorBelt = ({ x, y, width = 250, angle = 35, isRunning = true, horizontal = false }: ConveyorBeltProps) => {
  // Force horizontal angle if horizontal mode
  const effectiveAngle = horizontal ? 0 : angle;
  const radians = (effectiveAngle * Math.PI) / 180;
  const endX = width * Math.cos(radians);
  const endY = -width * Math.sin(radians);
  
  // Calculate slide direction based on angle
  const slideX = Math.cos(radians) * 20;
  const slideY = -Math.sin(radians) * 20;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Belt body */}
      <line
        x1="0"
        y1="0"
        x2={endX}
        y2={endY}
        className="stroke-equipment-conveyor"
        strokeWidth="20"
      />
      
      {/* Belt edges */}
      <line
        x1="0"
        y1="-10"
        x2={endX}
        y2={endY - 10}
        className="stroke-hmi-border"
        strokeWidth="2"
      />
      <line
        x1="0"
        y1="10"
        x2={endX}
        y2={endY + 10}
        className="stroke-hmi-border"
        strokeWidth="2"
      />

      {/* Rollers with rotation animation */}
      <circle 
        cx="0" 
        cy="0" 
        r="15" 
        className={isRunning ? "fill-green-500 stroke-hmi-border animate-pulse" : "fill-gray-500 stroke-hmi-border"} 
        strokeWidth="2" 
      />
      <circle 
        cx={endX} 
        cy={endY} 
        r="15" 
        className={isRunning ? "fill-green-500 stroke-hmi-border animate-pulse" : "fill-gray-500 stroke-hmi-border"} 
        strokeWidth="2" 
      />
      
      {/* Drive roller at end */}
      <circle 
        cx={endX} 
        cy={endY} 
        r="10" 
        className={isRunning ? "fill-green-600" : "fill-equipment-conveyor"} 
      />
      
      {/* Motor LED Indicator */}
      {isRunning && (
        <>
          <circle cx={endX + 20} cy={endY} r="4" className="fill-red-500">
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          <text 
            x={endX + 20} 
            y={endY + 15} 
            className="fill-white text-[8px] font-semibold" 
            textAnchor="middle"
          >
            MOTOR ON
          </text>
        </>
      )}
      
      {/* Material on belt with sliding animation */}
      {isRunning && (
        <g>
          <ellipse cx="0" cy="0" rx="20" ry="8" className="fill-equipment-aggregate" opacity="0.8">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0,0; ${endX},${endY}`}
              dur="3s"
              repeatCount="indefinite"
            />
          </ellipse>
          <ellipse cx="0" cy="0" rx="18" ry="7" className="fill-equipment-aggregate" opacity="0.8">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0,0; ${endX},${endY}`}
              dur="3s"
              repeatCount="indefinite"
              begin="1s"
            />
          </ellipse>
          <ellipse cx="0" cy="0" rx="19" ry="7.5" className="fill-equipment-aggregate" opacity="0.8">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0,0; ${endX},${endY}`}
              dur="3s"
              repeatCount="indefinite"
              begin="2s"
            />
          </ellipse>
        </g>
      )}
    </g>
  );
};
