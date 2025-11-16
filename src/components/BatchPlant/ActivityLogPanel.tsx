interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  // Always show 6 rows - fill with empty strings if needed
  const displayLogs = logs.slice(-6);
  const filledLogs = [...displayLogs];
  while (filledLogs.length < 6) {
    filledLogs.unshift(''); // Add empty strings at the beginning
  }
  
  return (
    <div className="absolute bottom-2 left-2 w-[320px] h-[165px] bg-black/90 border-2 border-red-500 rounded-lg p-2 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="text-center text-red-400 font-bold text-sm border-b border-red-500/50 pb-1 mb-1">
        ACTIVITY LOG
      </div>
      
      {/* Log Container */}
      <div className="h-[calc(100%-32px)] flex flex-col-reverse gap-1.5">
        {filledLogs.map((log, index) => (
          <div
            key={`log-${index}`}
            className="text-green-400 text-sm font-mono min-h-[18px] leading-relaxed"
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
