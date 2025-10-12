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
    />
  );
};
