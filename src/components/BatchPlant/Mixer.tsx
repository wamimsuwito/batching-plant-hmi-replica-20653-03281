interface MixerProps {
  x: number;
  y: number;
  isRunning?: boolean;
}

export const Mixer = ({ x, y, isRunning = true }: MixerProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Main mixer body */}
      <rect
        x="0"
        y="20"
        width="120"
        height="60"
        rx="8"
        className="fill-equipment-mixer stroke-hmi-border"
        strokeWidth="3"
      />
      
      {/* Motor housing */}
      <rect
        x="-20"
        y="30"
        width="30"
        height="40"
        className="fill-equipment-conveyor stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Mixing blades inside */}
      <g className={isRunning ? "animate-spin" : ""} transform="translate(60, 50)" style={{ transformOrigin: "0 0" }}>
        <ellipse cx="0" cy="0" rx="35" ry="15" className="fill-none stroke-hmi-border" strokeWidth="2" />
        <line x1="-35" y1="0" x2="35" y2="0" className="stroke-hmi-border" strokeWidth="2" />
        <line x1="0" y1="-15" x2="0" y2="15" className="stroke-hmi-border" strokeWidth="2" />
      </g>

      {/* Discharge chute */}
      <path
        d="M 40 80 L 60 100 L 80 80"
        className="fill-equipment-aggregate stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Status indicators */}
      {isRunning && (
        <>
          <circle cx="100" cy="35" r="4" className="fill-valve-active" />
          <circle cx="110" cy="35" r="4" className="fill-valve-active" />
        </>
      )}
    </g>
  );
};
