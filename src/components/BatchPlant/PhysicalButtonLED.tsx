interface PhysicalButtonLEDProps {
  x: number;
  y: number;
  isActive: boolean;
  relayName: string;
}

export const PhysicalButtonLED = ({ x, y, isActive, relayName }: PhysicalButtonLEDProps) => {
  if (!isActive) return null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Pulsing red LED indicator */}
      <circle
        cx="0"
        cy="0"
        r="8"
        fill="red"
        opacity="0.8"
        className="animate-pulse"
      >
        <animate
          attributeName="opacity"
          values="0.8;0.3;0.8"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Glow effect */}
      <circle
        cx="0"
        cy="0"
        r="12"
        fill="none"
        stroke="red"
        strokeWidth="2"
        opacity="0.6"
      >
        <animate
          attributeName="r"
          values="8;16;8"
          dur="1s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Label */}
      <text
        x="15"
        y="5"
        fill="red"
        fontSize="10"
        fontWeight="bold"
        className="animate-pulse"
      >
        MANUAL
      </text>
    </g>
  );
};
