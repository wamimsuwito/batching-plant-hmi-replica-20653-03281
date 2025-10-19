interface MixerProps {
  x: number;
  y: number;
  isRunning?: boolean;
  doorOpen?: boolean;
  mixingTimeRemaining?: number;
  totalMixingTime?: number;
  currentMixing?: number;
  totalMixing?: number;
  isTimerActive?: boolean;
}

export const Mixer = ({ 
  x, 
  y, 
  isRunning = true, 
  doorOpen = false, 
  mixingTimeRemaining = 0,
  totalMixingTime = 10,
  currentMixing = 1,
  totalMixing = 2,
  isTimerActive = false
}: MixerProps) => {
  // Calculate progress percentage for circular timer
  const progressPercentage = totalMixingTime > 0 
    ? ((totalMixingTime - mixingTimeRemaining) / totalMixingTime) * 100 
    : 0;
  
  // Circle parameters for progress ring
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
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

      {/* Extended Chute - Longer discharge funnel */}
      <g id="discharge-chute">
        {/* Funnel top part connecting to mixer body */}
        <path
          d="M 60 80 L 50 95 L 50 135 L 100 135 L 100 95 L 90 80 Z"
          className="fill-equipment-aggregate stroke-hmi-border"
          strokeWidth="2"
        />
        
        {/* Center vertical chute extension */}
        <rect
          x="50"
          y="135"
          width="50"
          height="60"
          className="fill-equipment-mixer stroke-hmi-border"
          strokeWidth="2"
        />
        
        {/* Bottom outlet narrowing */}
        <path
          d="M 50 195 L 60 210 L 90 210 L 100 195 Z"
          className="fill-equipment-aggregate stroke-hmi-border"
          strokeWidth="2"
        />
        
        {/* Chute outlet indicator line */}
        <line
          x1="60"
          y1="210"
          x2="90"
          y2="210"
          className="stroke-hmi-border"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      
      {/* Door indicator at middle of chute */}
      <rect 
        x="68" 
        y="140" 
        width="14" 
        height="8" 
        className={doorOpen ? "fill-green-500 animate-pulse" : "fill-red-500"} 
        stroke="white" 
        strokeWidth="2" 
      />
      
      {/* Door status text and LED */}
      {doorOpen && (
        <>
          <circle cx="75" cy="144" r="2" className="fill-green-400 animate-pulse" />
          <text
            x="75"
            y="160"
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
          y="160"
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
      
      {/* Circular timer display - ALWAYS VISIBLE */}
      {(
        <g transform="translate(199, 59)">
          {/* Background box for better visibility */}
          <rect
            x="-35"
            y="-40"
            width="70"
            height="90"
            rx="8"
            className="fill-slate-900/90 stroke-cyan-500"
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))'
            }}
          />
          
          {/* Background circle */}
          <circle
            cx="0"
            cy="0"
            r={radius}
            className="fill-slate-800/90 stroke-cyan-500"
            strokeWidth="3"
          />
          
          {/* Progress ring background */}
          <circle
            cx="0"
            cy="0"
            r={radius - 5}
            className="fill-none stroke-slate-600"
            strokeWidth="6"
            opacity="0.3"
          />
          
          {/* Progress ring */}
          <circle
            cx="0"
            cy="0"
            r={radius - 5}
            className="fill-none stroke-cyan-500"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90)"
            style={{ 
              transition: isTimerActive ? 'stroke-dashoffset 1s linear' : 'none',
              filter: isTimerActive ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' : 'none'
            }}
          />
          
          {/* Timer countdown number */}
          <text
            x="0"
            y="10"
            className="fill-white text-2xl font-bold"
            textAnchor="middle"
            style={{ 
              textShadow: '0 0 10px rgba(0,0,0,0.9)',
              fontFamily: 'monospace'
            }}
          >
            {isTimerActive ? mixingTimeRemaining : 0}
          </text>
          
          {/* Label above circle */}
          <text
            x="0"
            y="-32"
            className="fill-white text-[7px] font-semibold"
            textAnchor="middle"
          >
            WAKTU MIXING
          </text>
          
          {/* Mixing count below */}
          <text
            x="0"
            y="38"
            className="fill-white text-[8px] font-semibold"
            textAnchor="middle"
          >
            ✓ {currentMixing}x{totalMixing}
          </text>
          
          {/* Yellow indicator dot - animate only when active */}
          {isTimerActive && (
            <circle
              cx="18"
              cy="-3"
              r="3"
              className="fill-yellow-400"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>
      )}
    </g>
  );
};
