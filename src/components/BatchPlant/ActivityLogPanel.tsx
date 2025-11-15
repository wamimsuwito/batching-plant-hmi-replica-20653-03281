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
    <div className="absolute bottom-4 left-4 w-[168px] h-[120px] bg-black/90 border-2 border-red-500 rounded-lg p-2 overflow-hidden shadow-lg">
      <div className="h-full flex flex-col-reverse gap-0.5">
        {filledLogs.map((log, index) => (
          <div
            key={`log-${index}`}
            className="text-green-400 text-[10px] font-mono min-h-[12px]"
            style={{
              opacity: log ? 1 : 0, // Full opacity for logs, invisible for empty rows
            }}
          >
            {log || '\u00A0'} {/* Non-breaking space for empty rows */}
          </div>
        ))}
      </div>
    </div>
  );
};
