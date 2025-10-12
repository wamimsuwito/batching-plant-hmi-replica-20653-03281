interface CementSiloProps {
  x: number;
  y: number;
  fillLevel?: number;
  label?: string;
}

export const CementSilo = ({ x, y, fillLevel = 60, label }: CementSiloProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Silo body */}
      <rect
        x="0"
        y="30"
        width="40"
        height="100"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Fill level */}
      <rect
        x="2"
        y={130 - fillLevel}
        width="36"
        height={fillLevel}
        className="fill-equipment-siloFill"
      />
      {/* Top cone */}
      <path
        d="M 0 30 L 20 0 L 40 30 Z"
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
        y="25"
        width="50"
        height="5"
        className="fill-equipment-conveyor stroke-hmi-border"
        strokeWidth="1"
      />
    </g>
  );
};
