interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  return (
    <div className="absolute top-4 left-4 w-[380px] h-[130px] bg-black/90 border-2 border-red-500 rounded-lg p-3 overflow-hidden shadow-lg">
      <div className="h-full flex flex-col-reverse gap-1">
        {logs.map((log, index) => (
          <div
            key={`${log}-${index}`}
            className="text-green-400 text-sm font-mono animate-in slide-in-from-top-2 duration-300"
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
