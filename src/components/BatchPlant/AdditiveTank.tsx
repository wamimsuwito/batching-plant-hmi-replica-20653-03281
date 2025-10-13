interface AdditiveTankProps {
  x: number;
  y: number;
  fillLevel?: number;
  label?: string;
}

export const AdditiveTank = ({ x, y, fillLevel = 80, label }: AdditiveTankProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Tank body */}
      <rect
        x="0"
        y="15"
        width="35"
        height="70"
        rx="5"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Fill level */}
      <rect
        x="2"
        y={83 - fillLevel * 0.7}
        width="31"
        height={fillLevel * 0.7}
        rx="4"
        className="fill-equipment-tank"
      />
      {/* Top cap */}
      <ellipse
        cx="17.5"
        cy="15"
        rx="17.5"
        ry="8"
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      {/* Platform */}
      <rect
        x="-5"
        y="85"
        width="45"
        height="4"
        className="fill-equipment-conveyor stroke-hmi-border"
        strokeWidth="1"
      />
      {/* Support legs */}
      <line x1="5" y1="89" x2="5" y2="110" className="stroke-hmi-border" strokeWidth="2" />
      <line x1="30" y1="89" x2="30" y2="110" className="stroke-hmi-border" strokeWidth="2" />
      {/* Pump/valve at bottom */}
      <rect
        x="10"
        y="95"
        width="15"
        height="10"
        className="fill-equipment-tank stroke-hmi-border"
        strokeWidth="1"
      />
      <circle cx="17.5" cy="100" r="3" className="fill-valve-active stroke-hmi-border" strokeWidth="1" />
      {/* Label */}
      {label && (
        <text
          x="17.5"
          y="125"
          textAnchor="middle"
          className="fill-hmi-text text-xs font-semibold"
        >
          {label}
        </text>
      )}
    </g>
  );
};
