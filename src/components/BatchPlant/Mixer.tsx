interface MixerProps {
  x: number;
  y: number;
  isRunning?: boolean;
}

export const Mixer = ({ x, y, isRunning = true }: MixerProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Main mixer body - horizontal twin shaft design */}
      <rect
        x="0"
        y="10"
        width="150"
        height="70"
        rx="4"
        className="fill-equipment-mixer stroke-hmi-border"
        strokeWidth="3"
      />
      
      {/* Motor housing left */}
      <rect
        x="-25"
        y="25"
        width="28"
        height="40"
        className="fill-equipment-conveyor stroke-hmi-border"
        strokeWidth="2"
      />
      <circle cx="-11" cy="45" r="8" className="fill-muted stroke-hmi-border" strokeWidth="2" />
      
      {/* Twin paddle shafts */}
      {/* Top shaft with paddles */}
      <line x1="10" y1="30" x2="140" y2="30" className="stroke-hmi-border" strokeWidth="3" />
      <g className={isRunning ? "animate-spin origin-center" : ""}>
        <rect x="25" y="25" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(30 29 42.5)" />
        <rect x="50" y="20" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(-20 54 37.5)" />
        <rect x="75" y="25" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(40 79 42.5)" />
        <rect x="100" y="20" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(-30 104 37.5)" />
        <rect x="125" y="25" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(20 129 42.5)" />
      </g>
      
      {/* Bottom shaft with paddles */}
      <line x1="10" y1="55" x2="140" y2="55" className="stroke-hmi-border" strokeWidth="3" />
      <g className={isRunning ? "animate-spin origin-center" : ""} style={{ animationDirection: "reverse" }}>
        <rect x="25" y="45" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(-35 29 60)" />
        <rect x="50" y="48" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(25 54 63)" />
        <rect x="75" y="45" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(-40 79 60)" />
        <rect x="100" y="48" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(35 104 63)" />
        <rect x="125" y="45" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(-25 129 60)" />
      </g>

      {/* Discharge gate at bottom */}
      <path
        d="M 60 80 L 75 95 L 90 80"
        className="fill-equipment-aggregate stroke-hmi-border"
        strokeWidth="2"
      />
      <rect x="68" y="88" width="14" height="8" className="fill-valve-active stroke-hmi-border" strokeWidth="1" />
      
      {/* Status indicators */}
      {isRunning && (
        <>
          <circle cx="135" cy="20" r="4" className="fill-valve-active animate-pulse" />
          <circle cx="145" cy="20" r="4" className="fill-valve-active animate-pulse" />
        </>
      )}
    </g>
  );
};
