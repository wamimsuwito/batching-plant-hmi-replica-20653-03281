import { Card } from '@/components/ui/card';
import { useRaspberryPi } from '@/hooks/useRaspberryPi';
import { useSlumpEstimation } from '@/hooks/useSlumpEstimation';

export const AmpereMeterDisplay = () => {
  const { ampereData, isConnected, productionMode } = useRaspberryPi();
  const { estimatedSlump, slumpStatus } = useSlumpEstimation(ampereData.ampere);

  // Show "N/A" in simulation mode or when not connected
  const isDataAvailable = productionMode === 'production' && isConnected;

  return (
    <div className="flex flex-col gap-2 w-[220px]">
      {/* Ampere Display */}
      <Card className="p-3 bg-card border-cyan-500/30 border-2">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
            Ampere Mixer
          </p>
          <p className="text-4xl font-bold text-cyan-400 tabular-nums">
            {isDataAvailable ? ampereData.ampere.toFixed(1) : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">A</p>
          
          {/* Progress bar */}
          <div className="mt-2 bg-muted h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-yellow-500 transition-all duration-500 rounded-full"
              style={{ width: `${isDataAvailable ? Math.min((ampereData.ampere / 150) * 100, 100) : 0}%` }}
            />
          </div>
          
          {/* Compact info */}
          {isDataAvailable && (
            <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">
              <span>{ampereData.voltage.toFixed(0)}V</span>
              <span>{(ampereData.power / 1000).toFixed(1)}kW</span>
            </div>
          )}

          {!isDataAvailable && (
            <p className="text-[9px] text-muted-foreground mt-2">
              {productionMode === 'simulation' ? '🎮 Simulasi' : '⚠️ N/A'}
            </p>
          )}
        </div>
      </Card>

      {/* Slump Estimation */}
      <Card className={`p-3 border-2 transition-colors ${
        !isDataAvailable ? 'bg-card border-border' :
        slumpStatus.color === 'green' ? 'bg-green-950/20 border-green-500/50' :
        slumpStatus.color === 'yellow' ? 'bg-yellow-950/20 border-yellow-500/50' :
        slumpStatus.color === 'orange' ? 'bg-orange-950/20 border-orange-500/50' :
        'bg-red-950/20 border-red-500/50'
      }`}>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
            Estimasi Slump
          </p>
          <div className="text-3xl mb-1">
            {isDataAvailable ? slumpStatus.icon : '❓'}
          </div>
          <p className="text-4xl font-bold text-foreground tabular-nums">
            {isDataAvailable ? estimatedSlump : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">cm</p>
          
          {isDataAvailable && (
            <p className={`text-sm font-semibold mt-1.5 ${
              slumpStatus.color === 'green' ? 'text-green-400' :
              slumpStatus.color === 'yellow' ? 'text-yellow-400' :
              slumpStatus.color === 'orange' ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {slumpStatus.label}
            </p>
          )}

          {!isDataAvailable && (
            <p className="text-[9px] text-muted-foreground mt-1">
              {productionMode === 'simulation' ? '🎮 Simulasi' : '⚠️ N/A'}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
