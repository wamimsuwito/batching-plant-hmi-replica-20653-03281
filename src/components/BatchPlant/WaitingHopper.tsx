interface WaitingHopperProps {
  x: number;
  y: number;
  fillLevel: number; // 0-100%
  isActive: boolean;
}

export const WaitingHopper = ({ x, y, fillLevel = 0, isActive = false }: WaitingHopperProps) => {
  const hopperWidth = 100;
  const hopperHeight = 120;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Hopper body - trapezoid shape */}
      <path
        d={`M 20,0 L 80,0 L ${hopperWidth},${hopperHeight * 0.7} L 0,${hopperHeight * 0.7} Z`}
        className="fill-equipment-hopper stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Hopper cone bottom */}
      <path
        d={`M 0,${hopperHeight * 0.7} L ${hopperWidth},${hopperHeight * 0.7} L ${hopperWidth / 2 + 10},${hopperHeight} L ${hopperWidth / 2 - 10},${hopperHeight} Z`}
        className="fill-equipment-hopper stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Fill level indicator */}
      {fillLevel > 0 && (
        <path
          d={`M 20,${hopperHeight * 0.7 * (1 - fillLevel / 100)} 
              L 80,${hopperHeight * 0.7 * (1 - fillLevel / 100)} 
              L ${hopperWidth},${hopperHeight * 0.7} 
              L 0,${hopperHeight * 0.7} Z`}
          className="fill-equipment-aggregate opacity-70"
        />
      )}
      
      {/* Status indicator */}
      <g transform={`translate(${hopperWidth / 2}, ${hopperHeight + 20})`}>
        <circle
          r="6"
          className={isActive ? "fill-red-500 animate-pulse" : "fill-green-500"}
        />
        <text
          y="20"
          className="fill-white text-[10px] font-semibold"
          textAnchor="middle"
        >
          {isActive ? 'ACTIVE' : 'READY'}
        </text>
      </g>
      
      {/* Label */}
      <text
        x={hopperWidth / 2}
        y="-10"
        className="fill-white text-xs font-semibold"
        textAnchor="middle"
      >
        WAITING HOPPER
      </text>
      
      {/* Fill level text */}
      <text
        x={hopperWidth / 2}
        y={hopperHeight * 0.35}
        className="fill-white text-sm font-bold"
        textAnchor="middle"
      >
        {fillLevel.toFixed(0)}%
      </text>
    </g>
  );
};