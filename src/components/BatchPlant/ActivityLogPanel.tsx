interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  // Always show 7 rows - fill with empty strings if needed
  const displayLogs = logs.slice(-7);
  const filledLogs = [...displayLogs];
  while (filledLogs.length < 7) {
    filledLogs.unshift(''); // Add empty strings at the beginning
  }
  
  return (
    <div className="absolute bottom-2 left-2 w-[320px]">
      {/* Header - Outside the box */}
      <div className="text-center text-red-400 font-bold text-sm mb-1">
        ACTIVITY LOG
      </div>
      
      {/* Log Box */}
      <div className="w-full h-[140px] bg-black/90 border-2 border-red-500 rounded-lg p-2 overflow-hidden shadow-lg">
        <div className="h-full flex flex-col-reverse gap-1.5">
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
    </div>
  );
};
