import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CementSilo } from "@/components/BatchPlant/CementSilo";
import { AggregateHopper } from "@/components/BatchPlant/AggregateHopper";
import { AdditiveTank } from "@/components/BatchPlant/AdditiveTank";
import { Mixer } from "@/components/BatchPlant/Mixer";
import { MixerTruck } from "@/components/BatchPlant/MixerTruck";
import { ConveyorBelt } from "@/components/BatchPlant/ConveyorBelt";
import { WeighHopper } from "@/components/BatchPlant/WeighHopper";
import { Pipe } from "@/components/BatchPlant/Pipe";
import { StorageBin } from "@/components/BatchPlant/StorageBin";
import { ActivityLogPanel } from "@/components/BatchPlant/ActivityLogPanel";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { BatchStartDialog } from "@/components/BatchPlant/BatchStartDialog";
import { SiloFillDialog, SiloData } from "@/components/BatchPlant/SiloFillDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PrintTicketDialog, TicketData } from "@/pages/admin/PrintTicket";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Settings, Package, Wifi, WifiOff, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProductionSequence } from "@/hooks/useProductionSequence";
import { useRaspberryPi } from "@/hooks/useRaspberryPi";
import farikaLogo from "@/assets/farika-logo.png";

const Index = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false); // Auto mode toggle
  const [binGates, setBinGates] = useState([false, false, false, false]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [batchStartOpen, setBatchStartOpen] = useState(false);
  const [siloFillOpen, setSiloFillOpen] = useState(false);
  const [printTicketOpen, setPrintTicketOpen] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [productionStartTime, setProductionStartTime] = useState<Date | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [currentBatchConfig, setCurrentBatchConfig] = useState<any>(null);
  const currentBatchConfigRef = useRef<any>(null); // Use ref to persist config in callback
  const [manualTimerDuration, setManualTimerDuration] = useState(10); // Default 10 detik
  const [showTimerControl, setShowTimerControl] = useState(true); // Toggle visibility
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

  // Initialize aggregate bins with 10,000 kg capacity each
  const [aggregateBins, setAggregateBins] = useState([
    { id: 1, label: 'pasir 1', currentVolume: 10000, capacity: 10000, type: 'pasir' as const },
    { id: 2, label: 'pasir 2', currentVolume: 10000, capacity: 10000, type: 'pasir' as const },
    { id: 3, label: 'Batu 1', currentVolume: 10000, capacity: 10000, type: 'batu' as const },
    { id: 4, label: 'Batu 2', currentVolume: 10000, capacity: 10000, type: 'batu' as const },
  ]);

  // Initialize water tank with 2000 kg capacity
  const [waterTank, setWaterTank] = useState({
    currentVolume: 2000, // Start full
    capacity: 2000
  });

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

  // Load aggregate bin data from localStorage on mount with migration
  useEffect(() => {
    const savedBins = localStorage.getItem('aggregate_bins');
    if (savedBins) {
      try {
        const parsedBins = JSON.parse(savedBins);
        // Migrate: ensure correct type based on label
        const migratedBins = parsedBins.map((bin: any) => ({
          ...bin,
          type: bin.label.toLowerCase().includes('batu') ? 'batu' : 'pasir'
        }));
        setAggregateBins(migratedBins);
        // Save migrated data back to localStorage
        localStorage.setItem('aggregate_bins', JSON.stringify(migratedBins));
      } catch (error) {
        console.error('Error loading aggregate bin data:', error);
      }
    }
  }, []);

  // Save aggregate bin data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aggregate_bins', JSON.stringify(aggregateBins));
  }, [aggregateBins]);

  // Load water tank data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('water_tank');
    if (saved) {
      try {
        const parsedTank = JSON.parse(saved);
        setWaterTank(parsedTank);
      } catch (error) {
        console.error('Error loading water tank data:', error);
      }
    }
  }, []);

  // Save water tank data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('water_tank', JSON.stringify(waterTank));
  }, [waterTank]);

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

  // Handle aggregate deduction from bin (called during weighing and refill)
  const handleAggregateDeduction = (binId: number, amount: number) => {
    setAggregateBins(prev => prev.map(bin => {
      if (bin.id === binId) {
        let newVolume;
        
        if (amount < 0) {
          // Negative amount = REFILL (add to bin)
          newVolume = Math.min(bin.capacity, bin.currentVolume + Math.abs(amount));
          console.log(`📈 Refilling ${bin.label}: ${bin.currentVolume}kg → ${newVolume}kg`);
        } else {
          // Positive amount = DEDUCT (remove from bin)
          newVolume = Math.max(0, bin.currentVolume - amount);
          console.log(`📉 Deducting ${amount.toFixed(1)}kg from ${bin.label}: ${bin.currentVolume.toFixed(1)}kg → ${newVolume.toFixed(1)}kg`);
        }
        
        return {
          ...bin,
          currentVolume: newVolume,
        };
      }
      return bin;
    }));
  };

  // Handle water deduction from tank (called after discharge complete)
  const handleWaterDeduction = (amount: number) => {
    setWaterTank(prev => {
      const newVolume = Math.max(0, prev.currentVolume - amount);
      console.log(`💧 Deducting ${amount.toFixed(1)}kg water from tank: ${prev.currentVolume.toFixed(1)}kg → ${newVolume.toFixed(1)}kg`);
      
      return {
        ...prev,
        currentVolume: newVolume
      };
    });
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
  const { productionState, componentStates, startProduction, stopProduction, pauseProduction, resumeProduction } = useProductionSequence(
    handleCementDeduction,
    handleAggregateDeduction,
    handleWaterDeduction,
    relaySettings,
    raspberryPi,
    isAutoMode,
    (finalWeights) => {
      // Auto-stop when production completes
      setIsRunning(false);
      console.log('✅ Production complete - Start button ready for next batch');
      
      // Generate ticket data
      const endTime = new Date();
      const startTime = productionStartTime || endTime;
      
      // Use ref to access latest batch config (avoid closure issue)
      const batchConfig = currentBatchConfigRef.current;
      
      console.log('🔍 DEBUG - Checking available data:', {
        hasBatchConfig: !!batchConfig,
        batchConfigTargets: batchConfig?.targetWeights,
        productionStateTargets: productionState.targetWeights,
        finalWeights
      });
      
      // Get target weights from production state (already per mixing)
      // Use targetWeights from currentBatchConfig (already saved when batch started)
      const targetWeights = batchConfig?.targetWeights || productionState.targetWeights;
      const targetPasir = Math.round((targetWeights.pasir1 || 0) + (targetWeights.pasir2 || 0));
      const targetBatu = Math.round((targetWeights.batu1 || 0) + (targetWeights.batu2 || 0));
      const targetSemen = Math.round(targetWeights.semen || 0);
      const targetAir = Math.round(targetWeights.air || 0);
      
      // Get realisasi from finalWeights parameter (actual scale data)
      const realisasiPasir = Math.round(finalWeights?.pasir || 0);
      const realisasiBatu = Math.round(finalWeights?.batu || 0);
      const realisasiSemen = Math.round(finalWeights?.semen || 0);
      const realisasiAir = Math.round(finalWeights?.air || 0);
      
      console.log('🎫 Ticket data:', {
        source: 'currentBatchConfig',
        configTargets: currentBatchConfig?.targetWeights,
        calculatedTargets: { targetPasir, targetBatu, targetSemen, targetAir },
        realisasi: { realisasiPasir, realisasiBatu, realisasiSemen, realisasiAir },
        deviasi: {
          pasir: realisasiPasir - targetPasir,
          batu: realisasiBatu - targetBatu,
          semen: realisasiSemen - targetSemen,
          air: realisasiAir - targetAir
        }
      });
      
      // Calculate total volume (use volume per mixing if available, otherwise calculate)
      const volumePerMixing = batchConfig?.volume 
        ? (batchConfig.volume / productionState.jumlahMixing).toFixed(2)
        : ((targetPasir + targetBatu + targetSemen + targetAir) / 2400).toFixed(2);

      const ticket: TicketData = {
        id: `TICKET-${Date.now()}`,
        jobOrder: `${productionState.currentMixing}`,
        nomorPO: "-",
        tanggal: endTime.toLocaleDateString('id-ID'),
        jamMulai: startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        jamSelesai: endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        namaPelanggan: batchConfig?.pelanggan || "PT SIDOMUNCUL",
        lokasiProyek: batchConfig?.lokasi || "Pabrik Baru Pekanbaru",
        mutuBeton: batchConfig?.mutuBeton || "K300",
        slump: `${batchConfig?.slump || "12"} cm`,
        volume: `${volumePerMixing} M³`,
        namaSopir: batchConfig?.sopir || "UMAR",
        nomorMobil: batchConfig?.noKendaraan || "BM 0978 VOX",
        nomorLambung: "FC98",
        nomorRitasi: `${productionState.currentMixing}`,
        totalVolume: `${batchConfig?.volume || volumePerMixing} M³`,
        materials: {
          pasir: {
            target: targetPasir,
            realisasi: realisasiPasir,
            deviasi: realisasiPasir - targetPasir
          },
          batu: {
            target: targetBatu,
            realisasi: realisasiBatu,
            deviasi: realisasiBatu - targetBatu
          },
          semen: {
            target: targetSemen,
            realisasi: realisasiSemen,
            deviasi: realisasiSemen - targetSemen
          },
          air: {
            target: targetAir,
            realisasi: realisasiAir,
            deviasi: realisasiAir - targetAir
          }
        }
      };
      
      // Save to localStorage
      const savedTickets = localStorage.getItem('production_tickets');
      const tickets = savedTickets ? JSON.parse(savedTickets) : [];
      tickets.unshift(ticket); // Add to beginning
      localStorage.setItem('production_tickets', JSON.stringify(tickets));
      
      setTicketData(ticket);
      setPrintTicketOpen(true);
    }
  );

  const handleStart = () => {
    if (isPaused) {
      // Resume dari pause
      setIsPaused(false);
      resumeProduction();
      toast({
        title: "▶️ Produksi Dilanjutkan",
        description: "Produksi berjalan kembali",
      });
    } else {
      // Start produksi baru
      setIsRunning(true);
      setProductionStartTime(new Date());
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    pauseProduction();
    toast({
      title: "⏸️ Produksi Di-Pause",
      description: "Klik START untuk melanjutkan",
    });
  };
  
  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    stopProduction();
  };

  return (
    <div className="min-h-screen bg-hmi-background flex flex-col">
      {/* Header */}
      <header className="bg-hmi-header text-white py-3 px-6 border-b-2 border-hmi-border flex items-center justify-between relative">
        <div className="flex-1"></div>
        <h1 className="text-2xl font-bold text-center tracking-wide flex-1">
          BATCHING PLANT CONTROL SYSTEM
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

      {/* Help Dialog */}
      <AlertDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">
              ℹ️ Informasi Developer
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3 pt-4">
              <div className="text-base font-semibold text-foreground">
                Designed and Created by
              </div>
              <div className="text-lg font-bold text-primary">
                Wamin Suwito
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-medium">Email:</span>
                  <a 
                    href="mailto:Waminsuwito@yahoo.com" 
                    className="text-blue-600 hover:underline"
                  >
                    Waminsuwito@yahoo.com
                  </a>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-medium">HP/WhatsApp:</span>
                  <a 
                    href="https://wa.me/6281271963847" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    081271963847
                  </a>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => setHelpDialogOpen(false)}
              className="w-24"
            >
              Tutup
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <BatchStartDialog
        open={batchStartOpen} 
        onOpenChange={setBatchStartOpen}
        onStart={(config) => {
          console.log('📝 Batch Config Saved:', {
            targetWeights: config.targetWeights,
            mutuBeton: config.mutuBeton,
            volume: config.volume
          });
          setCurrentBatchConfig(config); // Store batch config for ticket generation
          currentBatchConfigRef.current = config; // Store in ref for callback access
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
      {ticketData && (
        <PrintTicketDialog
          open={printTicketOpen}
          onOpenChange={setPrintTicketOpen}
          ticketData={ticketData}
        />
      )}

      {/* Main HMI Panel */}
      <main className="flex-1 p-4">
        <div className="w-full h-[calc(100vh-80px)] border-4 border-hmi-border bg-hmi-panel relative">
          {/* Activity Log Panel - TOP LEFT */}
          <ActivityLogPanel logs={productionState.activityLog} />
          
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 720"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
          >
            {/* Aggregate Section - Left Side */}
            <g id="aggregate-section">
              {/* 4 Storage Bins - Dynamic fill level based on bin state */}
              {/* Bin 1 - Pasir 1 */}
              <StorageBin 
                x={25} 
                y={250}
                fillLevel={(aggregateBins[0].currentVolume / aggregateBins[0].capacity) * 100} 
                gateOpen={componentStates.sandBin1Valve} 
                label="PASIR 1"
                materialType="pasir"
              />
              {/* Bin 2 - Pasir 2 */}
              <StorageBin 
                x={105} 
                y={250}
                fillLevel={(aggregateBins[1].currentVolume / aggregateBins[1].capacity) * 100} 
                gateOpen={componentStates.sandBin2Valve} 
                label="PASIR 2"
                materialType="pasir"
              />
              {/* Bin 3 - Batu 1 */}
              <StorageBin 
                x={185} 
                y={250}
                fillLevel={(aggregateBins[2].currentVolume / aggregateBins[2].capacity) * 100} 
                gateOpen={componentStates.stoneBin1Valve} 
                label="BATU 1"
                materialType="batu"
              />
              {/* Bin 4 - Batu 2 */}
              <StorageBin 
                x={265} 
                y={250}
                fillLevel={(aggregateBins[3].currentVolume / aggregateBins[3].capacity) * 100} 
                gateOpen={componentStates.stoneBin2Valve} 
                label="BATU 2"
                materialType="batu"
              />
              
              {/* 2 Aggregate Hoppers - Cumulative weighing */}
              {/* Hopper 1 - PASIR (Cumulative: Pasir 1 + Pasir 2) */}
              <AggregateHopper 
                x={31} 
                y={390}
                fillLevel={productionState.hopperFillLevels?.pasir || 0} 
                isActive={componentStates.hopperValvePasir}
                isFilling={componentStates.sandBin1Valve || componentStates.sandBin2Valve}
                materialType="pasir"
                width={140}
              />
              {/* Hopper 2 - BATU (Cumulative: Batu 1 + Batu 2) */}
              <AggregateHopper 
                x={196} 
                y={390}
                fillLevel={productionState.hopperFillLevels?.batu || 0} 
                isActive={componentStates.hopperValveBatu}
                isFilling={componentStates.stoneBin1Valve || componentStates.stoneBin2Valve}
                materialType="batu"
                width={130}
              />

              {/* Conveyor Belt 1 - Below hoppers (horizontal) */}
              <ConveyorBelt x={50} y={496} width={260} angle={0} isRunning={componentStates.beltBawah} />

              {/* Conveyor Belt 2 - From bottom left, angled upward to mixer */}
              <ConveyorBelt x={320} y={540} width={180} angle={32} isRunning={isRunning} />
            </g>

            {/* Cement Silos Section - Center */}
            <g id="cement-section">
              {/* 6 Cement Silos */}
              <CementSilo 
                x={460} 
                y={170}
                label="SILO 1"
                currentVolume={silos[0].currentVolume}
                capacity={silos[0].capacity}
                isActive={componentStates.siloValves[0]}
              />
              <CementSilo 
                x={510} 
                y={170}
                label="SILO 2"
                currentVolume={silos[1].currentVolume}
                capacity={silos[1].capacity}
                isActive={componentStates.siloValves[1]}
              />
              <CementSilo 
                x={560} 
                y={170}
                label="SILO 3"
                currentVolume={silos[2].currentVolume}
                capacity={silos[2].capacity}
                isActive={componentStates.siloValves[2]}
              />
              <CementSilo 
                x={610} 
                y={170}
                label="SILO 4"
                currentVolume={silos[3].currentVolume}
                capacity={silos[3].capacity}
                isActive={componentStates.siloValves[3]}
              />
              <CementSilo 
                x={660} 
                y={170}
                label="SILO 5"
                currentVolume={silos[4].currentVolume}
                capacity={silos[4].capacity}
                isActive={componentStates.siloValves[4]}
              />
              <CementSilo 
                x={710} 
                y={170}
                label="SILO 6"
                currentVolume={silos[5].currentVolume}
                capacity={silos[5].capacity}
                isActive={componentStates.siloValves[5]}
              />

              {/* Single Weigh Hopper below silos (BIGGER) */}
              <WeighHopper 
                x={550} 
                y={370}
                currentWeight={productionState.currentWeights.semen}
                targetWeight={productionState.targetWeights.semen}
                isWeighing={productionState.targetWeights.semen > 0 && !productionState.weighingComplete.semen}
                isDischargingActive={componentStates.cementValve}
                materialType="cement"
              />

              {/* Pipes from silos to single weigh hopper with elbows */}
              <Pipe points="480,340 480,355 570,355 570,370" type="material" isActive={componentStates.siloValves[0]} />
              <Pipe points="530,340 530,360 580,360 580,370" type="material" isActive={componentStates.siloValves[1]} />
              <Pipe points="580,340 580,370" type="material" isActive={componentStates.siloValves[2]} />
              <Pipe points="630,340 630,360 610,360 610,370" type="material" isActive={componentStates.siloValves[3]} />
              <Pipe points="680,340 680,355 620,355 620,370" type="material" isActive={componentStates.siloValves[4]} />
              <Pipe points="730,340 730,350 620,350 620,370" type="material" isActive={componentStates.siloValves[5]} />
            </g>

            {/* Additive Tanks Section - Right Side */}
            <g id="additive-section">
              {/* Water Tank - Storage (2000 kg capacity) */}
              <AdditiveTank 
                x={780} 
                y={200}
                label="TANK AIR" 
                isValveActive={componentStates.waterTankValve}
                currentVolume={waterTank.currentVolume}
                targetVolume={productionState.targetWeights.air}
              />
              
              <AdditiveTank 
                x={840} 
                y={200}
                fillLevel={75} 
                label="ADDITIVE" 
                isValveActive={componentStates.additiveValve}
                currentVolume={productionState.currentWeights.additive}
                targetVolume={productionState.targetWeights.additive}
              />

              {/* Intermediate Tank dengan fungsi Weighing */}
              <g transform="translate(780, 350)">
                {/* Tank body */}
                <rect
                  x="0"
                  y="0"
                  width="35"
                  height="50"
                  className={`${(componentStates.waterTankValve || productionState.currentWeights.air > 0) ? 'fill-equipment-tank' : 'fill-equipment-silo'} stroke-hmi-border`}
                  strokeWidth="2"
                />
                
                {/* Fill level - dinamis berdasarkan weighing */}
                {componentStates.waterTankValve || productionState.currentWeights.air > 0 ? (
                  <rect 
                    x="2" 
                    y={50 - (productionState.currentWeights.air / (productionState.targetWeights.air || 1)) * 46} 
                    width="31" 
                    height={Math.max(2, (productionState.currentWeights.air / (productionState.targetWeights.air || 1)) * 46)}
                    className={`fill-blue-400 ${componentStates.waterTankValve ? 'animate-pulse' : ''}`}
                    opacity="0.9"
                  />
                ) : (
                  /* Empty state - animasi kosong */
                  <g>
                    {/* Garis horizontal untuk menunjukkan tank kosong */}
                    <line x1="5" y1="15" x2="30" y2="15" className="stroke-hmi-border opacity-30" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="5" y1="25" x2="30" y2="25" className="stroke-hmi-border opacity-30" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="5" y1="35" x2="30" y2="35" className="stroke-hmi-border opacity-30" strokeWidth="1" strokeDasharray="2,2" />
                    
                  </g>
                )}
                
                {/* Valve indicator di bawah */}
                <circle 
                  cx="17.5" 
                  cy="55" 
                  r="4" 
                  className={componentStates.waterHopperValve ? "fill-red-500" : "fill-green-500"} 
                  stroke="white" 
                  strokeWidth="1"
                >
                  {componentStates.waterHopperValve && (
                    <animate
                      attributeName="opacity"
                      values="1;0.4;1"
                      dur="0.3s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                
                {/* Label */}
                <text
                  x="17.5"
                  y="70"
                  textAnchor="middle"
                  className="fill-hmi-text text-[10px] font-semibold"
                >
                  AIR
                </text>
                
                {/* Discharging indicator */}
                {componentStates.waterHopperValve && (
                  <text
                    x="17.5"
                    y="80"
                    textAnchor="middle"
                    className="fill-red-400 text-[7px] font-semibold"
                  >
                    DISCHARGE
                  </text>
                )}
              </g>

              {/* Pipe from water tank to intermediate tank */}
              <Pipe 
                points="797,315 797,350" 
                type="water" 
                isActive={false}
              />

              {/* Pipe from intermediate tank to mixer */}
              <Pipe 
                points="797,405 797,450 605,450 605,480" 
                type="water" 
                isActive={componentStates.waterHopperValve}
              />

            </g>

            {/* Mixer Section - Center Bottom */}
            <g id="mixer-section">
              {/* Main Mixer - Twin Shaft Horizontal */}
            <Mixer 
              x={455} 
              y={470}
              isRunning={componentStates.mixer}
              doorOpen={componentStates.mixerDoor}
              isDoorMoving={productionState.isDoorMoving}
              mixingTimeRemaining={productionState.mixingTimeRemaining || manualTimerDuration}
              totalMixingTime={currentBatchConfig?.mixingTime || manualTimerDuration}
              currentMixing={productionState.currentMixing}
              totalMixing={productionState.jumlahMixing}
              isTimerActive={productionState.mixingTimeRemaining > 0}
            />

              {/* Mixer Truck - Below discharge chute */}
              <MixerTruck 
                x={510} 
                y={570}
                isReceiving={componentStates.mixerDoor}
                isMoving={false}
              />

              {/* Pipe to mixer from single weigh hopper */}
              <Pipe points="600,446 600,460 530,460 530,480" type="material" isActive={componentStates.cementValve} />
              
              {/* Pipe from additive intermediate tank */}
              <Pipe points="797,405 720,405 720,480 605,480" type="water" isActive={false} />
            </g>

          </svg>

          
          {/* Control Buttons - Right Side */}
          <div className="absolute bottom-4 right-[200px] flex flex-col gap-4 items-center">
            {/* Start and Stop Buttons */}
            <div className="flex gap-4">
              {/* Start/Pause/Resume Button */}
              <button
                onClick={isPaused ? handleStart : (isRunning ? handlePause : () => setBatchStartOpen(true))}
                disabled={false}
                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg transition-all ${
                  isPaused 
                    ? 'bg-green-600 hover:bg-green-700 border-green-800' 
                    : isRunning 
                      ? 'bg-yellow-600 hover:bg-yellow-700 border-yellow-800' 
                      : 'bg-green-600 hover:bg-green-700 border-green-800'
                }`}
              >
                <span className="text-white font-bold text-sm">
                  {isPaused ? 'RESUME' : (isRunning ? 'PAUSE' : 'Start')}
                </span>
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
          {/* Logo Perusahaan - Top Right */}
          <div className="absolute top-4 right-4 flex flex-col items-center bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg p-2">
            <img 
              src={farikaLogo} 
              alt="PT Farika Riau Perkasa Indonesia" 
              className="w-20 h-20 object-contain"
            />
          </div>
          
          {/* Material Weight Indicators - Horizontal on Top Left */}
          <div className="absolute top-4 left-4 flex flex-row gap-3">
            {/* Pasir */}
            <div className="flex flex-col gap-1">
              {/* Target box */}
              <div className="backdrop-blur-sm bg-blue-900/40 border border-blue-500/50 rounded px-2 py-1">
                <div className="text-[9px] text-blue-300 font-semibold">TARGET</div>
                <div className="text-xs font-bold text-blue-200 tabular-nums">
                  {productionState.cumulativeTargets.pasir.toFixed(0)} kg
                </div>
              </div>
              {/* Current weight indicator */}
              <div className={`backdrop-blur-sm border-2 rounded px-4 py-2 min-w-[150px] ${
                productionState.cumulativeTargets.pasir > 0
                  ? 'bg-green-900/40 border-green-500/50' 
                  : 'bg-gray-800/40 border-gray-600'
              }`}>
                <div className="text-xs text-muted-foreground font-semibold">PASIR</div>
                <div className="text-lg font-bold text-green-300 tabular-nums">
                  {productionState.currentWeights.pasir.toFixed(0)} kg
                </div>
              </div>
            </div>
            
            {/* Batu */}
            <div className="flex flex-col gap-1">
              {/* Target box */}
              <div className="backdrop-blur-sm bg-blue-900/40 border border-blue-500/50 rounded px-2 py-1">
                <div className="text-[9px] text-blue-300 font-semibold">TARGET</div>
                <div className="text-xs font-bold text-blue-200 tabular-nums">
                  {productionState.cumulativeTargets.batu.toFixed(0)} kg
                </div>
              </div>
              {/* Current weight indicator */}
              <div className={`backdrop-blur-sm border-2 rounded px-4 py-2 min-w-[150px] ${
                productionState.cumulativeTargets.batu > 0
                  ? 'bg-green-900/40 border-green-500/50' 
                  : 'bg-gray-800/40 border-gray-600'
              }`}>
                <div className="text-xs text-muted-foreground font-semibold">BATU</div>
                <div className="text-lg font-bold text-green-300 tabular-nums">
                  {productionState.currentWeights.batu.toFixed(0)} kg
                </div>
              </div>
            </div>
            
            {/* Semen */}
            <div className="flex flex-col gap-1">
              {/* Target box */}
              <div className="backdrop-blur-sm bg-blue-900/40 border border-blue-500/50 rounded px-2 py-1">
                <div className="text-[9px] text-blue-300 font-semibold">TARGET</div>
                <div className="text-xs font-bold text-blue-200 tabular-nums">
                  {productionState.targetWeights.semen.toFixed(0)} kg
                </div>
              </div>
              {/* Current weight indicator */}
              <div className={`backdrop-blur-sm border-2 rounded px-4 py-2 min-w-[150px] ${
                productionState.targetWeights.semen > 0 
                  ? 'bg-green-900/40 border-green-500/50' 
                  : 'bg-gray-800/40 border-gray-600'
              }`}>
                <div className="text-xs text-muted-foreground font-semibold">SEMEN</div>
                <div className="text-lg font-bold text-green-300 tabular-nums">
                  {productionState.currentWeights.semen.toFixed(0)} kg
                </div>
              </div>
            </div>
            
            {/* Air */}
            <div className="flex flex-col gap-1">
              {/* Target box */}
              <div className="backdrop-blur-sm bg-blue-900/40 border border-blue-500/50 rounded px-2 py-1">
                <div className="text-[9px] text-blue-300 font-semibold">TARGET</div>
                <div className="text-xs font-bold text-blue-200 tabular-nums">
                  {productionState.targetWeights.air.toFixed(0)} kg
                </div>
              </div>
              {/* Current weight indicator */}
              <div className={`backdrop-blur-sm border-2 rounded px-4 py-2 min-w-[150px] ${
                productionState.targetWeights.air > 0 
                  ? 'bg-green-900/40 border-green-500/50' 
                  : 'bg-gray-800/40 border-gray-600'
              }`}>
                <div className="text-xs text-muted-foreground font-semibold">AIR</div>
                <div className="text-lg font-bold text-green-300 tabular-nums">
                  {productionState.currentWeights.air.toFixed(0)} kg
                </div>
              </div>
            </div>
          </div>

          {/* Help Button - Bottom Right Corner */}
          <button
            onClick={() => setHelpDialogOpen(true)}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center border-2 border-blue-800 shadow-lg transition-all z-50"
            title="Informasi Developer"
          >
            <HelpCircle className="w-6 h-6 text-white" />
          </button>
          
        </div>
      </main>
    </div>
  );
};

export default Index;
