import { Card } from '@/components/ui/card';
import { useRaspberryPi } from '@/hooks/useRaspberryPi';
import { useSlumpEstimation } from '@/hooks/useSlumpEstimation';

export const AmpereMeterDisplay = () => {
  const { ampereData, isConnected, productionMode } = useRaspberryPi();
  const { estimatedSlump, slumpStatus } = useSlumpEstimation(ampereData.ampere);

  // Show "N/A" in simulation mode or when not connected
  const isDataAvailable = productionMode === 'production' && isConnected;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Ampere Display */}
      <Card className="p-6 bg-card border-cyan-500/30 border-2">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2 font-medium">Konsumsi Listrik Mixer</p>
          <div className="relative">
            <p className="text-7xl font-bold text-cyan-400 tabular-nums">
              {isDataAvailable ? ampereData.ampere.toFixed(1) : '--'}
            </p>
            <p className="text-muted-foreground text-lg mt-2">Ampere</p>
          </div>
          
          {/* Additional info */}
          {isDataAvailable && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="text-left">
                <span className="text-muted-foreground">Tegangan:</span>
                <span className="ml-2 text-foreground font-semibold">{ampereData.voltage.toFixed(0)}V</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Daya:</span>
                <span className="ml-2 text-foreground font-semibold">{(ampereData.power / 1000).toFixed(1)}kW</span>
              </div>
            </div>
          )}
          
          {/* Progress bar */}
          <div className="mt-4 bg-muted h-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-yellow-500 transition-all duration-500 rounded-full"
              style={{ width: `${isDataAvailable ? Math.min((ampereData.ampere / 150) * 100, 100) : 0}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>80A (encer)</span>
            <span>130A (kental)</span>
          </div>

          {!isDataAvailable && (
            <p className="text-xs text-muted-foreground mt-3">
              {productionMode === 'simulation' ? '🎮 Mode Simulasi' : '⚠️ Tidak terhubung'}
            </p>
          )}
        </div>
      </Card>

      {/* Slump Estimation */}
      <Card className={`p-6 border-2 transition-colors ${
        !isDataAvailable ? 'bg-card border-border' :
        slumpStatus.color === 'green' ? 'bg-green-950/20 border-green-500/50' :
        slumpStatus.color === 'yellow' ? 'bg-yellow-950/20 border-yellow-500/50' :
        slumpStatus.color === 'orange' ? 'bg-orange-950/20 border-orange-500/50' :
        'bg-red-950/20 border-red-500/50'
      }`}>
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2 font-medium">Estimasi Slump Beton</p>
          <div className="text-6xl mb-3">
            {isDataAvailable ? slumpStatus.icon : '❓'}
          </div>
          <p className="text-7xl font-bold text-foreground tabular-nums">
            {isDataAvailable ? estimatedSlump : '--'}
          </p>
          <p className="text-muted-foreground text-lg mt-2">cm</p>
          
          {isDataAvailable && (
            <div className="mt-4">
              <p className={`text-xl font-semibold ${
                slumpStatus.color === 'green' ? 'text-green-400' :
                slumpStatus.color === 'yellow' ? 'text-yellow-400' :
                slumpStatus.color === 'orange' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {slumpStatus.label}
              </p>
            </div>
          )}

          {!isDataAvailable && (
            <p className="text-xs text-muted-foreground mt-4">
              Data tidak tersedia
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
