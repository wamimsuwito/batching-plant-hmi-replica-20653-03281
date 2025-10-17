interface AggregateHopperProps {
  x: number;
  y: number;
  fillLevel?: number;
  isActive?: boolean;
}

export const AggregateHopper = ({ x, y, fillLevel = 70, isActive = false }: AggregateHopperProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Hopper body */}
      <path
        d="M 0 0 L 50 0 L 50 40 L 40 60 L 10 60 L 0 40 Z"
        className="fill-card stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Aggregate fill */}
      <path
        d={`M 2 ${60 - fillLevel * 0.6} L 48 ${60 - fillLevel * 0.6} L 48 40 L 38 58 L 12 58 L 2 40 Z`}
        className="fill-equipment-aggregate"
      />
      {/* Bottom cone funnel */}
      <path
        d="M 10 60 L 25 75 L 40 60"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Valve with status indicator */}
      <circle 
        cx="25" 
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
      
      {/* LED Indicator */}
      {isActive && (
        <circle cx="33" cy="80" r="2" className="fill-red-400">
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
        x="25"
        y="92"
        textAnchor="middle"
        className={`text-[8px] font-semibold ${isActive ? 'fill-red-400' : 'fill-green-400'}`}
      >
        {isActive ? 'OPEN' : 'CLOSED'}
      </text>
    </g>
  );
};
