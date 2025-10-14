interface WeighHopperProps {
  x: number;
  y: number;
  fillLevel?: number;
}

export const WeighHopper = ({ x, y, fillLevel = 40 }: WeighHopperProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Hopper body - trapezoid shape (BIGGER) */}
      <path
        d="M 10 0 L 90 0 L 70 50 L 30 50 Z"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Fill level */}
      {fillLevel > 0 && (
        <path
          d={`M ${10 + (50 - fillLevel) * 0.4} ${50 - fillLevel} L ${90 - (50 - fillLevel) * 0.4} ${50 - fillLevel} L ${70} 50 L 30 50 Z`}
          className="fill-equipment-aggregate"
          opacity="0.9"
        />
      )}
      
      {/* Bottom outlet (LONGER) */}
      <path
        d="M 30 50 L 50 70 L 70 50"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Valve (BIGGER) */}
      <circle cx="50" cy="76" r="6" className="fill-valve-active stroke-hmi-border" strokeWidth="1" />
    </g>
  );
};
