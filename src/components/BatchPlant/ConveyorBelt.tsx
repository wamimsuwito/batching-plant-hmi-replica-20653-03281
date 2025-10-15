interface ConveyorBeltProps {
  x: number;
  y: number;
  width?: number;
  angle?: number;
  isRunning?: boolean;
}

export const ConveyorBelt = ({ x, y, width = 250, angle = 35, isRunning = true }: ConveyorBeltProps) => {
  const radians = (angle * Math.PI) / 180;
  const endX = width * Math.cos(radians);
  const endY = -width * Math.sin(radians);

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
        className={isRunning ? "fill-green-500 stroke-hmi-border animate-rotate" : "fill-gray-500 stroke-hmi-border"} 
        strokeWidth="2" 
      />
      <circle 
        cx={endX} 
        cy={endY} 
        r="15" 
        className={isRunning ? "fill-green-500 stroke-hmi-border animate-rotate" : "fill-gray-500 stroke-hmi-border"} 
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
          <circle cx={endX + 20} cy={endY} r="4" className="fill-green-400 animate-pulse" />
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
        <g className="animate-slide">
          <ellipse cx={endX * 0.3} cy={endY * 0.3} rx="20" ry="8" className="fill-equipment-aggregate" opacity="0.8" />
          <ellipse cx={endX * 0.6} cy={endY * 0.6} rx="18" ry="7" className="fill-equipment-aggregate" opacity="0.8" />
        </g>
      )}
    </g>
  );
};
