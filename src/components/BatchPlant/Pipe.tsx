interface PipeProps {
  points: string;
  type?: "material" | "water";
  isActive?: boolean;
}

export const Pipe = ({ points, type = "material", isActive = true }: PipeProps) => {
  const strokeClass = type === "water" ? "stroke-pipe-water" : "stroke-pipe-material";
  
  return (
    <polyline
      points={points}
      fill="none"
      className={strokeClass}
      strokeWidth="4"
      opacity={isActive ? 1 : 0.4}
    >
      {isActive && (
        <>
          {/* Main opacity animation - more aggressive */}
          <animate
            attributeName="opacity"
            values="1;0.2;1"
            dur="0.5s"
            repeatCount="indefinite"
          />
          
          {/* Additional stroke-width animation for emphasis */}
          <animate
            attributeName="stroke-width"
            values="4;6;4"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </>
      )}
    </polyline>
  );
};
