interface MixerProps {
  x: number;
  y: number;
  isRunning?: boolean;
  doorOpen?: boolean;
  isDoorMoving?: boolean;
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
  isDoorMoving = false,
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
      
      {/* Rotating drum indicator - always visible when running (including during pause) */}
      {isRunning && (
        <g className="animate-spin-slow" style={{ transformOrigin: '75px 45px' }}>
          {/* Drum rotation indicator - circular stripes */}
          <ellipse
            cx="75"
            cy="45"
            rx="60"
            ry="25"
            fill="none"
            stroke="#7f8c8d"
            strokeWidth="3"
            strokeDasharray="12,8"
            opacity="0.4"
          />
          
          {/* Rotation indicator lines - vertical bars */}
          <line 
            x1="40" 
            y1="30" 
            x2="40" 
            y2="60" 
            stroke="#7f8c8d" 
            strokeWidth="2.5" 
            opacity="0.35" 
          />
          <line 
            x1="75" 
            y1="25" 
            x2="75" 
            y2="65" 
            stroke="#7f8c8d" 
            strokeWidth="2.5" 
            opacity="0.35" 
          />
          <line 
            x1="110" 
            y1="30" 
            x2="110" 
            y2="60" 
            stroke="#7f8c8d" 
            strokeWidth="2.5" 
            opacity="0.35" 
          />
        </g>
      )}
      
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
      
      {/* Discharge Chute - Compact design with animated door */}
      <g id="discharge-chute">
        {/* Funnel connecting to mixer body */}
        <path
          d="M 67 80 L 65 88 L 65 95 L 85 95 L 85 88 L 83 80 Z"
          className="fill-equipment-aggregate stroke-hmi-border"
          strokeWidth="2"
        />
        
        {/* Bottom outlet */}
        <path
          d="M 65 95 L 68 105 L 82 105 L 85 95 Z"
          className="fill-equipment-aggregate stroke-hmi-border"
          strokeWidth="2"
        />
        
        {/* Door panels - animated when door opens */}
        {!doorOpen && (
          <>
            {/* Left door panel */}
            <path
              d="M 65 95 L 68 105 L 75 105 L 75 95 Z"
              className="fill-equipment-mixer stroke-hmi-border"
              strokeWidth="1.5"
            />
            {/* Right door panel */}
            <path
              d="M 75 95 L 75 105 L 82 105 L 85 95 Z"
              className="fill-equipment-mixer stroke-hmi-border"
              strokeWidth="1.5"
            />
            {/* Center line */}
            <line
              x1="75"
              y1="95"
              x2="75"
              y2="105"
              className="stroke-hmi-border"
              strokeWidth="2"
            />
          </>
        )}
        
        {/* Door opening animation */}
        {doorOpen && isDoorMoving && (
          <>
            {/* Left door panel sliding left */}
            <path
              d="M 65 95 L 68 105 L 70 105 L 70 95 Z"
              className="fill-equipment-mixer stroke-hmi-border"
              strokeWidth="1.5"
              opacity="0.5"
            >
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="0.4s"
                repeatCount="indefinite"
              />
            </path>
            {/* Right door panel sliding right */}
            <path
              d="M 80 95 L 80 105 L 82 105 L 85 95 Z"
              className="fill-equipment-mixer stroke-hmi-border"
              strokeWidth="1.5"
              opacity="0.5"
            >
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="0.4s"
                repeatCount="indefinite"
              />
            </path>
          </>
        )}
        
        {/* Chute outlet indicator line when fully open */}
        {doorOpen && !isDoorMoving && (
          <line
            x1="68"
            y1="105"
            x2="82"
            y2="105"
            className="stroke-green-500"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </g>
      
      {/* Door indicator at middle of chute */}
      <rect 
        x="71" 
        y="90" 
        width="8" 
        height="5" 
        className={isDoorMoving ? "fill-red-500" : "fill-green-500"} 
        stroke="white" 
        strokeWidth="2" 
      >
        {/* Animasi kedip cepat hanya saat bergerak */}
        {isDoorMoving && (
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="0.3s"
            repeatCount="indefinite"
          />
        )}
      </rect>
      
      {/* Door status text and LED */}
      {isDoorMoving && (
        <>
          <circle cx="75" cy="92" r="2" className="fill-red-400">
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            x="75"
            y="101"
            className="fill-red-400 text-[8px] font-semibold"
            textAnchor="middle"
          >
            {doorOpen ? "OPENING..." : "CLOSING..."}
          </text>
        </>
      )}
      
      {!isDoorMoving && doorOpen && (
        <>
          <circle cx="75" cy="92" r="2" className="fill-green-400" />
          <text
            x="75"
            y="101"
            className="fill-green-400 text-[8px] font-semibold"
            textAnchor="middle"
          >
            DOOR STANDBY
          </text>
        </>
      )}
      
      {!isDoorMoving && !doorOpen && (
        <text
          x="75"
          y="101"
          className="fill-green-400 text-[8px] font-semibold"
          textAnchor="middle"
        >
          DOOR CLOSED
        </text>
      )}
      
      {/* Concrete dumping animation - when door is open */}
      {doorOpen && (
        <g id="concrete-dumping">
          {/* Top stream - thicker */}
          <ellipse 
            cx="75" 
            cy="110" 
            rx="10" 
            ry="15" 
            className="fill-equipment-aggregate" 
            opacity="0.8" 
          >
            <animate
              attributeName="opacity"
              values="0.8;0.5;0.8"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </ellipse>
          
          {/* Middle stream */}
          <ellipse 
            cx="75" 
            cy="125" 
            rx="8" 
            ry="13" 
            className="fill-equipment-aggregate" 
            opacity="0.7" 
          >
            <animate
              attributeName="opacity"
              values="0.7;0.4;0.7"
              dur="0.5s"
              repeatCount="indefinite"
              begin="0.15s"
            />
          </ellipse>
          
          {/* Bottom stream - thinner */}
          <ellipse 
            cx="75" 
            cy="140" 
            rx="6" 
            ry="10" 
            className="fill-equipment-aggregate" 
            opacity="0.6" 
          >
            <animate
              attributeName="opacity"
              values="0.6;0.3;0.6"
              dur="0.5s"
              repeatCount="indefinite"
              begin="0.3s"
            />
          </ellipse>
          
          {/* Left side stream untuk efek lebih realistis */}
          <ellipse 
            cx="70" 
            cy="118" 
            rx="5" 
            ry="8" 
            className="fill-equipment-aggregate" 
            opacity="0.5" 
          >
            <animate
              attributeName="opacity"
              values="0.5;0.2;0.5"
              dur="0.6s"
              repeatCount="indefinite"
              begin="0.1s"
            />
          </ellipse>
          
          {/* Right side stream */}
          <ellipse 
            cx="80" 
            cy="118" 
            rx="5" 
            ry="8" 
            className="fill-equipment-aggregate" 
            opacity="0.5" 
          >
            <animate
              attributeName="opacity"
              values="0.5;0.2;0.5"
              dur="0.6s"
              repeatCount="indefinite"
              begin="0.2s"
            />
          </ellipse>
        </g>
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
