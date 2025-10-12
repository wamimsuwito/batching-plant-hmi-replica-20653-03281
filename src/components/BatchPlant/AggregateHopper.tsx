interface AggregateHopperProps {
  x: number;
  y: number;
  fillLevel?: number;
}

export const AggregateHopper = ({ x, y, fillLevel = 70 }: AggregateHopperProps) => {
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
      {/* Valve */}
      <circle cx="25" cy="80" r="5" className="fill-valve-active stroke-hmi-border" strokeWidth="1" />
    </g>
  );
};
