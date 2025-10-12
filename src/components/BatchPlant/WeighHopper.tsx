interface WeighHopperProps {
  x: number;
  y: number;
  fillLevel?: number;
}

export const WeighHopper = ({ x, y, fillLevel = 40 }: WeighHopperProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Hopper body - trapezoid shape */}
      <path
        d="M 10 0 L 50 0 L 40 30 L 20 30 Z"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Fill level */}
      {fillLevel > 0 && (
        <path
          d={`M ${10 + (40 - fillLevel) * 0.3} ${30 - fillLevel} L ${50 - (40 - fillLevel) * 0.3} ${30 - fillLevel} L ${40} 30 L 20 30 Z`}
          className="fill-equipment-aggregate"
          opacity="0.9"
        />
      )}
      
      {/* Bottom outlet */}
      <path
        d="M 20 30 L 30 40 L 40 30"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Valve */}
      <circle cx="30" cy="44" r="4" className="fill-valve-active stroke-hmi-border" strokeWidth="1" />
    </g>
  );
};
