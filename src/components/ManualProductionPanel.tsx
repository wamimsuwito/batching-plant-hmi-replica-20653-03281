import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface ManualProductionPanelProps {
  isManualSessionActive: boolean;
  onOpenForm: () => void;
  onStopManual: () => void;
  isAutoMode: boolean;
  currentSession: {
    formData: {
      mutuBeton: string;
      slump: string;
      targetProduksi: string;
      selectedSilo: string;
    };
    materials: {
      pasir: { totalDischarged: number };
      batu: { totalDischarged: number };
      semen: { totalDischarged: number };
      air: { totalDischarged: number };
    };
  } | null;
}

export const ManualProductionPanel = ({
  isManualSessionActive,
  onOpenForm,
  onStopManual,
  isAutoMode,
  currentSession,
}: ManualProductionPanelProps) => {
  // Only show when Auto Mode is OFF
  if (isAutoMode) return null;

  return (
    <div className="absolute top-[23px] right-[136px] bg-background/95 backdrop-blur border-2 border-primary rounded-lg p-4 shadow-lg w-[280px]">
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-sm font-bold text-foreground">MANUAL PRODUCTION</h3>
          <p className="text-xs text-muted-foreground">Recording Mode</p>
        </div>

        {/* Session Status */}
        {isManualSessionActive ? (
          <>
            <div className="bg-green-500/10 border border-green-500 rounded p-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-green-600">SESSION ACTIVE</span>
              </div>
              
              {/* Session Info */}
              {currentSession && (
                <div className="space-y-1 text-[10px] mb-2">
                  <div className="flex justify-between border-b border-green-500/30 pb-1">
                    <span className="text-muted-foreground">Mutu:</span>
                    <span className="font-bold">{currentSession.formData.mutuBeton}</span>
                  </div>
                  <div className="flex justify-between border-b border-green-500/30 pb-1">
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="font-bold">{currentSession.formData.targetProduksi} m3</span>
                  </div>
                  <div className="flex justify-between border-b border-green-500/30 pb-1">
                    <span className="text-muted-foreground">Slump:</span>
                    <span className="font-bold">{currentSession.formData.slump} cm</span>
                  </div>
                  <div className="flex justify-between border-b border-green-500/30 pb-1 mb-2">
                    <span className="text-muted-foreground">Silo:</span>
                    <span className="font-bold">Silo {currentSession.formData.selectedSilo}</span>
                  </div>
                </div>
              )}
              
              {/* Current Totals */}
              {currentSession && (
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Pasir:</span>
                    <span className="font-bold">{currentSession.materials.pasir.totalDischarged.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Batu:</span>
                    <span className="font-bold">{currentSession.materials.batu.totalDischarged.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Semen:</span>
                    <span className="font-bold">{currentSession.materials.semen.totalDischarged.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Air:</span>
                    <span className="font-bold">{currentSession.materials.air.totalDischarged.toFixed(0)} kg</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={onStopManual}
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
              size="sm"
            >
              <Square className="w-4 h-4" />
              STOP MANUAL
            </Button>
          </>
        ) : (
          <>
            <div className="bg-muted/50 border border-border rounded p-2 text-center">
              <span className="text-xs text-muted-foreground">Standby</span>
            </div>

            <Button
              onClick={onOpenForm}
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              size="sm"
            >
              <Play className="w-4 h-4" />
              MULAI MANUAL
            </Button>
          </>
        )}

        {/* Instructions */}
        <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
          <p className="font-semibold mb-1">Instruksi:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Pilih mutu & isi form</li>
            <li>Tekan "MULAI MANUAL"</li>
            <li>Timbang semua material</li>
            <li>Tekan "STOP" untuk print</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
