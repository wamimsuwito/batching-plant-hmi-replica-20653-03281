interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  // Always show 8 rows - fill with empty strings if needed
  const displayLogs = logs.slice(-8);
  const filledLogs = [...displayLogs];
  while (filledLogs.length < 8) {
    filledLogs.unshift(''); // Add empty strings at the beginning
  }
  
  return (
    <div className="absolute bottom-2 left-2 w-[320px] h-[140px] bg-black/90 border-2 border-red-500 rounded-lg p-2 overflow-hidden shadow-lg">
      <div className="text-red-500 font-bold text-base mb-1 border-b border-red-500 pb-0.5">
        Activity Log
      </div>
      <div className="h-[calc(100%-28px)] flex flex-col-reverse gap-0.5">
        {filledLogs.map((log, index) => (
          <div
            key={`log-${index}`}
            className="text-green-400 text-sm font-mono min-h-[16px]"
            style={{
              opacity: log ? 1 : 0,
            }}
          >
            {log || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
};
