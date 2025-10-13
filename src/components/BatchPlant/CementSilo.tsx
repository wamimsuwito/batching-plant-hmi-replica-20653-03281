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
        y="20"
        width="40"
        height="110"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Fill level */}
      <rect
        x="2"
        y={128 - fillLevel}
        width="36"
        height={fillLevel}
        className="fill-equipment-siloFill"
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
