import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CementSilo } from "@/components/BatchPlant/CementSilo";
import { AggregateHopper } from "@/components/BatchPlant/AggregateHopper";
import { AdditiveTank } from "@/components/BatchPlant/AdditiveTank";
import { Mixer } from "@/components/BatchPlant/Mixer";
import { ConveyorBelt } from "@/components/BatchPlant/ConveyorBelt";
import { WeighHopper } from "@/components/BatchPlant/WeighHopper";
import { Pipe } from "@/components/BatchPlant/Pipe";
import { StorageBin } from "@/components/BatchPlant/StorageBin";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { BatchStartDialog } from "@/components/BatchPlant/BatchStartDialog";
import { SiloFillDialog, SiloData } from "@/components/BatchPlant/SiloFillDialog";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Settings, Package, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProductionSequence } from "@/hooks/useProductionSequence";
import { useRaspberryPi } from "@/hooks/useRaspberryPi";

const Index = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false); // Auto mode toggle
  const [binGates, setBinGates] = useState([false, false, false, false]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [batchStartOpen, setBatchStartOpen] = useState(false);
  const [siloFillOpen, setSiloFillOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize 6 cement silos with 120,000 kg capacity each
  const [silos, setSilos] = useState<SiloData[]>([
    { id: 1, currentVolume: 0, capacity: 120000 },
    { id: 2, currentVolume: 0, capacity: 120000 },
    { id: 3, currentVolume: 0, capacity: 120000 },
    { id: 4, currentVolume: 0, capacity: 120000 },
    { id: 5, currentVolume: 0, capacity: 120000 },
    { id: 6, currentVolume: 0, capacity: 120000 },
  ]);

  // Load silo data from localStorage on mount
  useEffect(() => {
    const savedSilos = localStorage.getItem('cement_silos');
    if (savedSilos) {
      try {
        const parsedSilos = JSON.parse(savedSilos);
        setSilos(parsedSilos);
      } catch (error) {
        console.error('Error loading silo data:', error);
      }
    }
  }, []);

  // Save silo data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cement_silos', JSON.stringify(silos));
  }, [silos]);

  // Handle silo filling
  const handleSiloFill = (siloId: number, volume: number) => {
    setSilos(prev => prev.map(silo => {
      if (silo.id === siloId) {
        return {
          ...silo,
          currentVolume: silo.currentVolume + volume,
          lastFilled: new Date().toISOString(),
        };
      }
      return silo;
    }));

    // Check for low level warning
    const updatedSilo = silos.find(s => s.id === siloId);
    if (updatedSilo) {
      const newVolume = updatedSilo.currentVolume + volume;
      const percentage = (newVolume / updatedSilo.capacity) * 100;
      
      if (percentage < 20 && percentage > 0) {
        toast({
          title: "Peringatan",
          description: `Silo ${siloId} masih dalam level rendah (${percentage.toFixed(0)}%)`,
          variant: "destructive",
        });
      }
    }
  };

  // Handle cement deduction from silo (called during production)
  const handleCementDeduction = (siloId: number, amount: number) => {
    setSilos(prev => prev.map(silo => {
      if (silo.id === siloId) {
        const newVolume = Math.max(0, silo.currentVolume - amount);
        return {
          ...silo,
          currentVolume: newVolume,
        };
      }
      return silo;
    }));
  };

  // Load relay settings
  const [relaySettings, setRelaySettings] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('relay_settings');
    if (saved) {
      try {
        setRelaySettings(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading relay settings:', error);
      }
    }
  }, []);

  // Raspberry Pi connection
  const raspberryPi = useRaspberryPi();

  // Production sequence hook with Raspberry Pi integration and auto mode
  const { productionState, componentStates, startProduction, stopProduction } = useProductionSequence(
    handleCementDeduction,
    relaySettings,
    raspberryPi,
    isAutoMode
  );

  const handleStart = () => {
    setIsRunning(true);
  };
  
  const handleStop = () => {
    setIsRunning(false);
    stopProduction();
  };

  return (
    <div className="min-h-screen bg-hmi-background flex flex-col">
      {/* Header */}
      <header className="bg-hmi-header text-white py-3 px-6 border-b-2 border-hmi-border flex items-center justify-between">
        <div className="flex-1 flex items-center gap-3">
          {/* Raspberry Pi Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/20 border border-white/20">
            {raspberryPi.isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-green-400">RPi Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400">Offline Mode</span>
              </>
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center tracking-wide flex-1">
          BATCH PLANT CONTROL SYSTEM
        </h1>
        <div className="flex-1 flex justify-end items-center gap-2">
          {user ? (
            <>
              <span className="text-sm">
                {user.name}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSiloFillOpen(true)}
                className="gap-2"
              >
                <Package className="w-4 h-4" />
                Isi Silo
              </Button>
              {isAdmin() && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login Admin
            </Button>
          )}
        </div>
      </header>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <BatchStartDialog 
        open={batchStartOpen} 
        onOpenChange={setBatchStartOpen}
        onStart={(config) => {
          startProduction(config);
          handleStart();
        }}
        silos={silos}
      />
      <SiloFillDialog
        open={siloFillOpen}
        onOpenChange={setSiloFillOpen}
        silos={silos}
        onFill={handleSiloFill}
      />

      {/* Main HMI Panel */}
      <main className="flex-1 p-4">
        <div className="w-full h-[calc(100vh-80px)] border-4 border-hmi-border bg-hmi-panel relative">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1100 600"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
          >
            {/* Aggregate Section - Left Side */}
            <g id="aggregate-section">
              {/* 4 Storage Bins - Above hoppers - Always FULL initially */}
              <StorageBin x={25} y={130} fillLevel={100} gateOpen={componentStates.sandBinValve} label="PASIR" />
              <StorageBin x={105} y={130} fillLevel={100} gateOpen={componentStates.stoneBinValve} label="BATU 1" />
              <StorageBin x={185} y={130} fillLevel={100} gateOpen={false} label="BATU 2" />
              <StorageBin x={265} y={130} fillLevel={100} gateOpen={false} label="BIN 4" />
              
              {/* Support structure connecting bins to hoppers */}
              <line x1="60" y1="252" x2="65" y2="270" className="stroke-hmi-border" strokeWidth="2" />
              <line x1="140" y1="252" x2="145" y2="270" className="stroke-hmi-border" strokeWidth="2" />
              <line x1="220" y1="252" x2="225" y2="270" className="stroke-hmi-border" strokeWidth="2" />
              <line x1="300" y1="252" x2="305" y2="270" className="stroke-hmi-border" strokeWidth="2" />
              
              {/* 4 Aggregate Hoppers with valve indicators and dynamic fill levels */}
              {/* HOPPER fillLevel: 0 = empty, 100 = full */}
              <AggregateHopper 
                x={40} 
                y={270} 
                fillLevel={
                  productionState.targetWeights.pasir > 0
                    ? Math.min(100, (productionState.currentWeights.pasir / productionState.targetWeights.pasir * 100))
                    : 0
                } 
                isActive={componentStates.sandBinValve} 
              />
              <AggregateHopper 
                x={120} 
                y={270} 
                fillLevel={
                  productionState.targetWeights.batu > 0
                    ? Math.min(100, (productionState.currentWeights.batu / productionState.targetWeights.batu * 100))
                    : 0
                } 
                isActive={componentStates.stoneBinValve} 
              />
              <AggregateHopper x={200} y={270} fillLevel={0} isActive={false} />
              <AggregateHopper x={280} y={270} fillLevel={0} isActive={false} />

              {/* Conveyor Belt 1 - Below hoppers (horizontal) */}
              <ConveyorBelt x={40} y={370} width={290} angle={0} isRunning={componentStates.beltBawah} />

              {/* Conveyor Belt 2 - From bottom left, angled upward to mixer */}
              <ConveyorBelt x={320} y={420} width={180} angle={32} isRunning={componentStates.beltAtas} />
            </g>

            {/* Cement Silos Section - Center */}
            <g id="cement-section">
              {/* 6 Cement Silos */}
              <CementSilo 
                x={460} 
                y={50} 
                label="SILO 1"
                currentVolume={silos[0].currentVolume}
                capacity={silos[0].capacity}
                isActive={componentStates.siloValves[0]}
              />
              <CementSilo 
                x={510} 
                y={50} 
                label="SILO 2"
                currentVolume={silos[1].currentVolume}
                capacity={silos[1].capacity}
                isActive={componentStates.siloValves[1]}
              />
              <CementSilo 
                x={560} 
                y={50} 
                label="SILO 3"
                currentVolume={silos[2].currentVolume}
                capacity={silos[2].capacity}
                isActive={componentStates.siloValves[2]}
              />
              <CementSilo 
                x={610} 
                y={50} 
                label="SILO 4"
                currentVolume={silos[3].currentVolume}
                capacity={silos[3].capacity}
                isActive={componentStates.siloValves[3]}
              />
              <CementSilo 
                x={660} 
                y={50} 
                label="SILO 5"
                currentVolume={silos[4].currentVolume}
                capacity={silos[4].capacity}
                isActive={componentStates.siloValves[4]}
              />
              <CementSilo 
                x={710} 
                y={50} 
                label="SILO 6"
                currentVolume={silos[5].currentVolume}
                capacity={silos[5].capacity}
                isActive={componentStates.siloValves[5]}
              />

              {/* Single Weigh Hopper below silos (BIGGER) */}
              <WeighHopper 
                x={550} 
                y={250} 
                currentWeight={productionState.currentWeights.semen}
                targetWeight={productionState.targetWeights.semen}
                isWeighing={productionState.currentStep === 'weighing'}
                isDischargingActive={componentStates.cementValve}
              />

              {/* Pipes from silos to single weigh hopper with elbows */}
              <Pipe points="480,220 480,235 570,235 570,250" type="material" />
              <Pipe points="530,220 530,240 580,240 580,250" type="material" />
              <Pipe points="580,220 580,250" type="material" />
              <Pipe points="630,220 630,240 610,240 610,250" type="material" />
              <Pipe points="680,220 680,235 620,235 620,250" type="material" />
              <Pipe points="730,220 730,230 620,230 620,250" type="material" />
            </g>

            {/* Additive Tanks Section - Right Side */}
            <g id="additive-section">
              {/* 2 Additive Tanks with valve indicators and dynamic fill levels */}
              <AdditiveTank 
                x={780} 
                y={80} 
                fillLevel={85} 
                label="AIR" 
                isValveActive={componentStates.waterValve}
                currentVolume={productionState.currentWeights.air}
                targetVolume={productionState.targetWeights.air}
              />
              <AdditiveTank 
                x={840} 
                y={80} 
                fillLevel={75} 
                label="ADDITIVE" 
                isValveActive={componentStates.additiveValve}
                currentVolume={productionState.currentWeights.additive}
                targetVolume={productionState.targetWeights.additive}
              />

              {/* Intermediate tank */}
              <g transform="translate(780, 230)">
                <rect
                  x="0"
                  y="0"
                  width="35"
                  height="50"
                  className="fill-equipment-tank stroke-hmi-border"
                  strokeWidth="2"
                />
                <rect x="2" y="15" width="31" height="33" className="fill-equipment-siloFill" />
                <circle cx="17.5" cy="55" r="4" className="fill-valve-active stroke-hmi-border" strokeWidth="1" />
              </g>

              {/* Pipes from additive tanks */}
              <Pipe points="797,205 797,230" type="water" />
              <Pipe points="857,205 857,220 797,220" type="water" />
            </g>

            {/* Mixer Section - Center Bottom */}
            <g id="mixer-section">
              {/* Main Mixer - Twin Shaft Horizontal */}
              <Mixer 
                x={455} 
                y={350} 
                isRunning={componentStates.mixer}
                doorOpen={componentStates.mixerDoor}
                mixingTimeRemaining={productionState.mixingTimeRemaining}
              />

              {/* Pipe to mixer from single weigh hopper */}
              <Pipe points="600,326 600,340 530,340 530,360" type="material" />
              
              {/* Pipe from additive intermediate tank */}
              <Pipe points="797,285 720,285 720,360 605,360" type="water" />
            </g>

          </svg>
          
          {/* Control Buttons - Right Side */}
          <div className="absolute bottom-4 right-60 flex flex-col gap-4 items-center">
            {/* Start and Stop Buttons */}
            <div className="flex gap-4">
              {/* Start Button */}
              <button
                onClick={() => setBatchStartOpen(true)}
                disabled={isRunning}
                className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-4 border-green-800 shadow-lg transition-all"
              >
                <span className="text-white font-bold text-sm">Start</span>
              </button>
              
              {/* Stop Button */}
              <button
                onClick={handleStop}
                disabled={!isRunning}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-4 border-red-800 shadow-lg transition-all"
              >
                <span className="text-white font-bold text-sm">STOP</span>
              </button>
            </div>
            
            {/* Auto/Manual Button */}
            <button
              onClick={() => setIsAutoMode(!isAutoMode)}
              className={`w-32 h-20 border-4 rounded-lg transition-all shadow-lg flex flex-col items-center justify-center gap-1 ${
                isAutoMode 
                  ? 'bg-green-600 border-green-800 hover:bg-green-700' 
                  : 'bg-gray-600 border-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="text-white text-2xl">⏻</div>
              <div className="text-white font-bold text-xs">
                AUTO: {isAutoMode ? 'ON' : 'OFF'}
              </div>
            </button>
          </div>
          
          {/* Material Weight Indicators */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {/* Pasir */}
            <div className={`backdrop-blur-sm border-2 rounded px-3 py-1.5 min-w-[90px] ${
              productionState.targetWeights.pasir > 0 
                ? 'bg-green-900/40 border-green-500/50 animate-pulse' 
                : 'bg-gray-800/40 border-gray-600'
            }`}>
              <div className="text-[10px] text-muted-foreground font-semibold">PASIR</div>
              {productionState.targetWeights.pasir > 0 ? (
                <div className="text-sm font-bold text-green-300">
                  {productionState.currentWeights.pasir.toFixed(0)} / {productionState.targetWeights.pasir.toFixed(0)} kg
                </div>
              ) : (
                <div className="text-sm font-bold text-gray-400">0</div>
              )}
            </div>
            
            {/* Batu */}
            <div className={`backdrop-blur-sm border-2 rounded px-3 py-1.5 min-w-[90px] ${
              productionState.targetWeights.batu > 0 
                ? 'bg-green-900/40 border-green-500/50 animate-pulse' 
                : 'bg-gray-800/40 border-gray-600'
            }`}>
              <div className="text-[10px] text-muted-foreground font-semibold">BATU</div>
              {productionState.targetWeights.batu > 0 ? (
                <div className="text-sm font-bold text-green-300">
                  {productionState.currentWeights.batu.toFixed(0)} / {productionState.targetWeights.batu.toFixed(0)} kg
                </div>
              ) : (
                <div className="text-sm font-bold text-gray-400">0</div>
              )}
            </div>
            
            {/* Semen */}
            <div className={`backdrop-blur-sm border-2 rounded px-3 py-1.5 min-w-[90px] ${
              productionState.targetWeights.semen > 0 
                ? 'bg-green-900/40 border-green-500/50 animate-pulse' 
                : 'bg-gray-800/40 border-gray-600'
            }`}>
              <div className="text-[10px] text-muted-foreground font-semibold">SEMEN</div>
              {productionState.targetWeights.semen > 0 ? (
                <div className="text-sm font-bold text-green-300">
                  {productionState.currentWeights.semen.toFixed(0)} / {productionState.targetWeights.semen.toFixed(0)} kg
                </div>
              ) : (
                <div className="text-sm font-bold text-gray-400">0</div>
              )}
            </div>
            
            {/* Air */}
            <div className={`backdrop-blur-sm border-2 rounded px-3 py-1.5 min-w-[90px] ${
              productionState.targetWeights.air > 0 
                ? 'bg-green-900/40 border-green-500/50 animate-pulse' 
                : 'bg-gray-800/40 border-gray-600'
            }`}>
              <div className="text-[10px] text-muted-foreground font-semibold">AIR</div>
              {productionState.targetWeights.air > 0 ? (
                <div className="text-sm font-bold text-green-300">
                  {productionState.currentWeights.air.toFixed(0)} / {productionState.targetWeights.air.toFixed(0)} kg
                </div>
              ) : (
                <div className="text-sm font-bold text-gray-400">0</div>
              )}
            </div>

            {/* Production Status */}
            {productionState.isProducing && (
              <div className="bg-blue-600/90 backdrop-blur-sm border-2 border-blue-800 rounded px-4 py-2 min-w-[180px]">
                <div className="text-[10px] text-white font-semibold">STATUS PRODUKSI</div>
                <div className="text-sm font-bold text-white uppercase">
                  {productionState.currentStep === 'weighing' && 'PENIMBANGAN'}
                  {productionState.currentStep.startsWith('jogging-') && `JOGGING ${productionState.currentStep.split('-')[1].toUpperCase()}`}
                  {productionState.currentStep === 'discharging' && 'DISCHARGE MATERIAL'}
                  {productionState.currentStep === 'mixing' && `MIXING ${productionState.mixingTimeRemaining}s`}
                  {productionState.currentStep === 'door_cycle' && `BUKA PINTU ${productionState.mixerDoorCycle}/2`}
                  {productionState.currentStep === 'complete' && 'SELESAI'}
                </div>
              </div>
            )}
          </div>
          
          {/* Legend Panel - Bottom Right */}
          <div className="absolute bottom-4 left-[460px] bg-card/90 backdrop-blur-sm border-2 border-hmi-border rounded p-3 shadow-lg">
            <h3 className="text-xs font-bold mb-2 text-foreground">Component Status Legend</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-semibold text-foreground">ACTIVE / ON</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-[10px] font-semibold text-foreground">INACTIVE / OFF</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-semibold text-foreground">WARNING</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
