interface MixerProps {
  x: number;
  y: number;
  isRunning?: boolean;
  doorOpen?: boolean;
  mixingTimeRemaining?: number;
}

export const Mixer = ({ x, y, isRunning = true, doorOpen = false, mixingTimeRemaining = 0 }: MixerProps) => {
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
      
      {/* Motor housing left with indicator */}
      <rect
        x="-25"
        y="25"
        width="28"
        height="40"
        className="fill-equipment-conveyor stroke-hmi-border"
        strokeWidth="2"
      />
      <circle 
        cx="-11" 
        cy="45" 
        r="8" 
        className={isRunning ? "fill-green-500 animate-pulse" : "fill-muted"} 
        stroke={isRunning ? "white" : "hsl(var(--hmi-border))"} 
        strokeWidth="2" 
      />
      
      {/* Motor LED indicator */}
      {isRunning && (
        <>
          <circle cx="-11" cy="60" r="3" className="fill-green-400 animate-pulse" />
          <text 
            x="-11" 
            y="70" 
            className="fill-white text-[8px] font-semibold" 
            textAnchor="middle"
          >
            MOTOR
          </text>
        </>
      )}
      
      {/* Twin paddle shafts */}
      {/* Top shaft with paddles */}
      <line x1="10" y1="30" x2="140" y2="30" className="stroke-hmi-border" strokeWidth="3" />
      <g>
        <rect x="25" y="25" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(30 29 42.5)" />
        <rect x="50" y="20" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(-20 54 37.5)" />
        <rect x="75" y="25" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(40 79 42.5)" />
        <rect x="100" y="20" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(-30 104 37.5)" />
        <rect x="125" y="25" width="8" height="35" rx="1" className="fill-equipment-conveyor" transform="rotate(20 129 42.5)" />
      </g>
      
      {/* Bottom shaft with paddles */}
      <line x1="10" y1="55" x2="140" y2="55" className="stroke-hmi-border" strokeWidth="3" />
      <g>
        <rect x="25" y="45" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(-35 29 60)" />
        <rect x="50" y="48" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(25 54 63)" />
        <rect x="75" y="45" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(-40 79 60)" />
        <rect x="100" y="48" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(35 104 63)" />
        <rect x="125" y="45" width="8" height="30" rx="1" className="fill-equipment-conveyor" transform="rotate(-25 129 60)" />
      </g>

      {/* Discharge gate at bottom with enhanced indicator */}
      <path
        d="M 60 80 L 75 95 L 90 80"
        className="fill-equipment-aggregate stroke-hmi-border"
        strokeWidth="2"
      />
      <rect 
        x="68" 
        y="88" 
        width="14" 
        height="8" 
        className={doorOpen ? "fill-green-500 animate-pulse" : "fill-red-500"} 
        stroke="white" 
        strokeWidth="2" 
      />
      
      {/* Door status text and LED */}
      {doorOpen && (
        <>
          <circle cx="85" cy="92" r="2" className="fill-green-400 animate-pulse" />
          <text
            x="75"
            y="107"
            className="fill-green-400 text-[8px] font-semibold animate-pulse"
            textAnchor="middle"
          >
            DOOR OPEN
          </text>
        </>
      )}
      
      {!doorOpen && (
        <text
          x="75"
          y="107"
          className="fill-red-400 text-[8px] font-semibold"
          textAnchor="middle"
        >
          DOOR CLOSED
        </text>
      )}
      
      {/* Status indicators */}
      {isRunning && (
        <>
          <circle cx="135" cy="20" r="4" className="fill-valve-active animate-pulse" />
          <circle cx="145" cy="20" r="4" className="fill-valve-active animate-pulse" />
        </>
      )}
      
      {/* Mixing countdown display */}
      {mixingTimeRemaining > 0 && (
        <text
          x="75"
          y="50"
          className="fill-white text-sm font-bold"
          textAnchor="middle"
          style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
        >
          MIXING: {mixingTimeRemaining}s
        </text>
      )}
    </g>
  );
};
