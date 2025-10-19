interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  return (
    <div className="absolute bottom-4 left-4 w-[280px] h-[100px] bg-black/90 border-2 border-red-500 rounded-lg p-2 overflow-hidden shadow-lg">
      <div className="h-full flex flex-col-reverse gap-0.5">
        {logs.map((log, index) => (
          <div
            key={`${log}-${index}`}
            className="text-green-400 text-xs font-mono animate-in slide-in-from-top-2 duration-300"
            style={{
              opacity: 1 - (index * 0.15), // Older logs fade out slightly
            }}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
