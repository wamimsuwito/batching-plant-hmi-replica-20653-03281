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
  doorTimeRemaining?: number;
  totalDoorTime?: number;
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
  isTimerActive = false,
  doorTimeRemaining = 0,
  totalDoorTime = 0
}: MixerProps) => {
  // Determine if we're in door mode
  const isDoorMode = doorTimeRemaining > 0 && (doorOpen || isDoorMoving);
  
  // Calculate progress percentage for circular timer
  const progressPercentage = isDoorMode
    ? totalDoorTime > 0 
      ? ((totalDoorTime - doorTimeRemaining) / totalDoorTime) * 100 
      : 0
    : totalMixingTime > 0 
      ? ((totalMixingTime - mixingTimeRemaining) / totalMixingTime) * 100 
      : 0;
  
  // Circle parameters for progress ring - ENLARGED 50%
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  // Different strokeDashoffset calculation for door mode (counter-clockwise)
  const strokeDashoffset = isDoorMode
    ? (progressPercentage / 100) * circumference  // Door: start from 0, increase to circumference (reverse fill)
    : circumference - (progressPercentage / 100) * circumference; // Mixing: normal clockwise fill
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
        <>
          {/* First rotating animation - left side */}
          <g className="animate-spin-slow" style={{ transformOrigin: '40px 45px' }}>
            <ellipse
              cx="40"
              cy="45"
              rx="28"
              ry="12"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="8,5"
              opacity="0.6"
            />
            <line 
              x1="25" 
              y1="40" 
              x2="25" 
              y2="50" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
            <line 
              x1="40" 
              y1="36" 
              x2="40" 
              y2="54" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
            <line 
              x1="55" 
              y1="40" 
              x2="55" 
              y2="50" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
          </g>
          
          {/* Second rotating animation - center */}
          <g className="animate-spin-slow" style={{ transformOrigin: '75px 45px' }}>
            <ellipse
              cx="75"
              cy="45"
              rx="28"
              ry="12"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="8,5"
              opacity="0.6"
            />
            <line 
              x1="60" 
              y1="40" 
              x2="60" 
              y2="50" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
            <line 
              x1="75" 
              y1="36" 
              x2="75" 
              y2="54" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
            <line 
              x1="90" 
              y1="40" 
              x2="90" 
              y2="50" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
          </g>
          
          {/* Third rotating animation - right side */}
          <g className="animate-spin-slow" style={{ transformOrigin: '110px 45px' }}>
            <ellipse
              cx="110"
              cy="45"
              rx="28"
              ry="12"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="8,5"
              opacity="0.6"
            />
            <line 
              x1="95" 
              y1="40" 
              x2="95" 
              y2="50" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
            <line 
              x1="110" 
              y1="36" 
              x2="110" 
              y2="54" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
            <line 
              x1="125" 
              y1="40" 
              x2="125" 
              y2="50" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              opacity="0.5" 
            />
          </g>
        </>
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
      
      {/* Concrete dumping animation - when door is open or moving */}
      {(doorOpen || isDoorMoving) && (
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
      
      {/* Circular timer display - ALWAYS VISIBLE - ENLARGED */}
      {(
        <g transform="translate(509, 145)">
          {/* Background box - ENLARGED 50% */}
          <rect
            x="-82"
            y="-97"
            width="165"
            height="195"
            rx="12"
            className="fill-slate-900/90 stroke-cyan-500"
            strokeWidth="3"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))'
            }}
          />
          
          {/* Background circle - ENLARGED 50% */}
          <circle
            cx="0"
            cy="0"
            r={radius}
            className="fill-slate-800/90 stroke-cyan-500"
            strokeWidth="4"
          />
          
          {/* Progress ring background - ENLARGED 50% */}
          <circle
            cx="0"
            cy="0"
            r={45}
            className="fill-none stroke-slate-600"
            strokeWidth="12"
            opacity="0.3"
          />
          
          {/* Progress ring - ENLARGED 50% */}
          <circle
            cx="0"
            cy="0"
            r={45}
            className={isDoorMode ? "fill-none stroke-red-500" : "fill-none stroke-cyan-500"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={
              // Snap ke 0 atau circumference untuk precision
              progressPercentage >= 99.5 
                ? (isDoorMode ? circumference : 0)  
                : progressPercentage <= 0.5 
                  ? (isDoorMode ? 0 : circumference)  
                  : strokeDashoffset
            }
            transform="rotate(-90)"
            style={{ 
              transition: 'stroke-dashoffset 0.3s ease-out',
              filter: (isTimerActive || isDoorMode) 
                ? isDoorMode 
                  ? 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.6))' 
                  : 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' 
                : 'none'
            }}
          />
          
          {/* Timer countdown number - ENLARGED 50% */}
          <text
            x="0"
            y="22"
            className="fill-white text-7xl font-bold"
            textAnchor="middle"
            style={{ 
              textShadow: '0 0 15px rgba(0,0,0,0.9)',
              fontFamily: 'monospace'
            }}
          >
            {isDoorMode 
              ? Math.ceil(doorTimeRemaining)
              : (isTimerActive ? Math.ceil(mixingTimeRemaining) : 0)
            }
          </text>
          
          {/* Label above circle - ENLARGED 50% */}
          <text
            x="0"
            y="-63"
            className={isDoorMode ? "fill-red-400 text-[18px] font-semibold" : "fill-white text-[18px] font-semibold"}
            textAnchor="middle"
          >
            {isDoorMode ? "PINTU DUMPING" : "WAKTU MIXING"}
          </text>
          
          {/* Mixing count below - ENLARGED 50% + NEW FORMAT */}
          <text
            x="0"
            y="72"
            className="fill-white text-[21px] font-semibold"
            textAnchor="middle"
          >
            Mix {currentMixing} Dari {totalMixing}
          </text>
          
          {/* Indicator dot - animate only when active - ENLARGED 50% - SYNCED WITH PROGRESS */}
          {(isTimerActive || isDoorMode) && (
            <circle
              cx="38"
              cy="-8"
              r="6"
              className={isDoorMode ? "fill-red-400" : "fill-yellow-400"}
              transform={`rotate(${isDoorMode ? -progressPercentage * 3.6 : progressPercentage * 3.6} 0 0)`}
              style={{
                transition: 'transform 0.3s ease-out',
                filter: 'drop-shadow(0 0 6px currentColor)'
              }}
            />
          )}
        </g>
      )}
    </g>
  );
};
