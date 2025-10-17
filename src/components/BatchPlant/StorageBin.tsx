interface StorageBinProps {
  x: number;
  y: number;
  fillLevel?: number;
  gateOpen?: boolean;
  label?: string;
  materialType?: 'pasir' | 'batu';
}

export const StorageBin = ({ 
  x, 
  y, 
  fillLevel = 80, 
  gateOpen = false, 
  label = "BIN",
  materialType = 'pasir'
}: StorageBinProps) => {
  const binWidth = 70;
  const binHeight = 90;
  const fillHeight = (fillLevel / 100) * (binHeight - 20);
  
  // Determine material color based on type
  const materialColor = materialType === 'batu' 
    ? 'fill-equipment-stone' 
    : 'fill-equipment-aggregate';

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Bin body - main storage container */}
      <rect
        x="0"
        y="0"
        width={binWidth}
        height={binHeight}
        className="fill-card stroke-hmi-border"
        strokeWidth="2"
        rx="2"
      />
      
      {/* Support frame corners */}
      <line x1="0" y1="0" x2="10" y2="10" className="stroke-hmi-border" strokeWidth="2" />
      <line x1={binWidth} y1="0" x2={binWidth - 10} y2="10" className="stroke-hmi-border" strokeWidth="2" />
      
      {/* Material fill level */}
      <rect
        x="2"
        y={binHeight - fillHeight - 10}
        width={binWidth - 4}
        height={fillHeight}
        className={materialColor}
        opacity="0.9"
      />
      
      {/* Bottom funnel/outlet */}
      <path
        d={`M 10 ${binHeight} L ${binWidth / 2} ${binHeight + 12} L ${binWidth - 10} ${binHeight}`}
        className="fill-equipment-silo stroke-hmi-border"
        strokeWidth="2"
      />
      
      {/* Gate/pintu di bawah bin */}
      <rect
        x={binWidth / 2 - 15}
        y={binHeight + 12}
        width="30"
        height="8"
        className={gateOpen ? "fill-red-500" : "fill-green-500"}
        stroke="white"
        strokeWidth="1"
        rx="1"
      >
        {gateOpen && (
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="0.6s"
            repeatCount="indefinite"
          />
        )}
      </rect>
      
      {/* Gate indicator line */}
      {gateOpen && (
        <line
          x1={binWidth / 2 - 12}
          y1={binHeight + 16}
          x2={binWidth / 2 + 12}
          y2={binHeight + 16}
          className="stroke-white"
          strokeWidth="2"
        />
      )}
      
      {/* Material flowing when gate is open */}
      {gateOpen && (
        <>
          <ellipse 
            cx={binWidth / 2} 
            cy={binHeight + 25} 
            rx="8" 
            ry="12" 
            className={materialColor} 
            opacity="0.7" 
          />
          <ellipse 
            cx={binWidth / 2} 
            cy={binHeight + 35} 
            rx="6" 
            ry="10" 
            className={materialColor} 
            opacity="0.6" 
          />
        </>
      )}
      
      {/* Label */}
      <text
        x={binWidth / 2}
        y="20"
        className="fill-hmi-border text-xs font-bold"
        textAnchor="middle"
      >
        {label}
      </text>
      
      {/* Fill level percentage */}
      <text
        x={binWidth / 2}
        y="35"
        className="fill-hmi-border text-[10px]"
        textAnchor="middle"
      >
        {fillLevel}%
      </text>
    </g>
  );
};
