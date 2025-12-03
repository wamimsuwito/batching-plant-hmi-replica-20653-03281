import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CementSilo } from "@/components/BatchPlant/CementSilo";
import { AggregateHopper } from "@/components/BatchPlant/AggregateHopper";
import { AdditiveTank } from "@/components/BatchPlant/AdditiveTank";
import { Mixer } from "@/components/BatchPlant/Mixer";
import { MixerTruck } from "@/components/BatchPlant/MixerTruck";
import { ConveyorBelt } from "@/components/BatchPlant/ConveyorBelt";
import { WeighHopper } from "@/components/BatchPlant/WeighHopper";
import { WaitingHopper } from "@/components/BatchPlant/WaitingHopper";
import { Pipe } from "@/components/BatchPlant/Pipe";
import { StorageBin } from "@/components/BatchPlant/StorageBin";
import { ActivityLogPanel } from "@/components/BatchPlant/ActivityLogPanel";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { ActivationDialog } from "@/components/auth/ActivationDialog";
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
import { LogIn, Settings, Package, Wifi, WifiOff, HelpCircle, User, LogOut } from "lucide-react";
import { OperatorLoginDialog } from "@/components/BatchPlant/OperatorLoginDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useProductionSequence } from "@/hooks/useProductionSequence";
import { useRaspberryPi } from "@/hooks/useRaspberryPi";
import { useManualProduction } from "@/hooks/useManualProduction";
import { ManualProductionPanel } from "@/components/ManualProductionPanel";
import { ManualFormDialog } from "@/components/BatchPlant/ManualFormDialog";
import { AggregateNoteDialog } from "@/components/BatchPlant/AggregateNoteDialog";
import { PhysicalButtonLED } from "@/components/BatchPlant/PhysicalButtonLED";
import { AmpereMeterDisplay } from "@/components/BatchPlant/AmpereMeterDisplay";
import { MoistureControlDialog } from "@/components/BatchPlant/MoistureControlDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import defaultLogo from "@/assets/default-company-logo.png";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const Index = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true); // Auto mode toggle - default ON
  const [aggregateNoteDialogOpen, setAggregateNoteDialogOpen] = useState(false);
  const [currentAggregateNotes, setCurrentAggregateNotes] = useState<{
    pasir1?: string;
    pasir2?: string;
    batu1?: string;
    batu2?: string;
  }>({});
  const [binGates, setBinGates] = useState([false, false, false, false]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);
  const [isLicenseValid, setIsLicenseValid] = useState(false);
  const [batchStartOpen, setBatchStartOpen] = useState(false);
  const [siloFillOpen, setSiloFillOpen] = useState(false);
  const [printTicketOpen, setPrintTicketOpen] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [productionStartTime, setProductionStartTime] = useState<Date | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    const saved = localStorage.getItem('auto_print_enabled');
    return saved !== null ? JSON.parse(saved) : true; // Default: true (dicentang)
  });
  const [currentBatchConfig, setCurrentBatchConfig] = useState<any>(null);
  const currentBatchConfigRef = useRef<any>(null); // Use ref to persist config in callback
  const [manualTimerDuration, setManualTimerDuration] = useState(10); // Default 10 detik
  const [showTimerControl, setShowTimerControl] = useState(true); // Toggle visibility
  const [stableWeights, setStableWeights] = useState({ pasir: 0, batu: 0, semen: 0, air: 0, aggregate: 0 });
  const weightStabilizationTimer = useRef<NodeJS.Timeout | null>(null);
  const [bpNaming, setBpNaming] = useState<{inisialBP?: string; nomorBP?: string}>({});
  const [moistureControlDialogOpen, setMoistureControlDialogOpen] = useState(false);
  const [moistureSettings, setMoistureSettings] = useState({ pasir: 0, batu: 0, air: 0 });
  const [loggedOperator, setLoggedOperator] = useState<{
    id: string;
    namaUser: string;
    nik: string;
    jabatan: string;
  } | null>(null);
  const [operatorLoginOpen, setOperatorLoginOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { companySettings } = useCompanySettings();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load operator from localStorage on mount
  useEffect(() => {
    const savedOperator = localStorage.getItem('logged_operator');
    if (savedOperator) {
      try {
        setLoggedOperator(JSON.parse(savedOperator));
      } catch (error) {
        console.error('Error loading operator:', error);
      }
    }
  }, []);

  // Helper function to format volume (remove .00 for whole numbers)
  const formatVolume = (value: number): string => {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    const str = value.toFixed(2);
    if (str.endsWith('.00')) {
      return Math.round(value).toString();
    }
    if (str.endsWith('0') && !str.endsWith('.00')) {
      return value.toFixed(1);
    }
    return value.toFixed(2);
  };

  const handleOperatorLogin = (operator: { id: string; namaUser: string; nik: string; jabatan: string }) => {
    setLoggedOperator(operator);
    localStorage.setItem('logged_operator', JSON.stringify(operator));
  };

  const handleOperatorLogout = () => {
    setLoggedOperator(null);
    localStorage.removeItem('logged_operator');
    toast({
      title: "Logout Berhasil",
      description: "Operator telah keluar",
    });
  };

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

  // Save auto print setting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('auto_print_enabled', JSON.stringify(autoPrintEnabled));
  }, [autoPrintEnabled]);

  // Load moisture control settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('moisture_control_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setMoistureSettings(settings);
      } catch (error) {
        console.error('Error loading moisture control settings:', error);
      }
    }
  }, []);

  // Check license on mount (only in Electron)
  useEffect(() => {
    if (window.licensing) {
      window.licensing.checkLicense().then((result: any) => {
        if (result.valid) {
          setIsLicenseValid(true);
          console.log('License valid until:', result.expiryDate);
        } else {
          setIsLicenseValid(false);
          setActivationOpen(true);
          if (result.expired) {
            toast({
              variant: "destructive",
              title: "⚠️ License Expired",
              description: "Please contact PT Farika to renew your license.",
            });
          }
        }
      });
    } else {
      // Not in Electron, skip license check
      setIsLicenseValid(true);
    }
  }, []);

  // Load saved aggregate notes on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('aggregate_notes');
    if (savedNotes) {
      try {
        setCurrentAggregateNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Error loading aggregate notes:', error);
      }
    }
  }, []);

  const handleActivationSuccess = () => {
    setActivationOpen(false);
    setIsLicenseValid(true);
    toast({
      title: "✅ Software Activated",
      description: "License activated successfully!",
    });
  };

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

  // ✅ NEW: Refill aggregate bins after production complete (System 3, Simulation mode)
  const handleAggregateBinsRefill = () => {
    console.log('🔄 Refilling aggregate bins to 10,000 kg');
    setAggregateBins(prev => prev.map(bin => ({
      ...bin,
      currentVolume: 10000, // Reset to full capacity
    })));
  };

  // ✅ Helper functions for serial number generation
  const getBPPrefix = () => {
    const cfg = localStorage.getItem('bp_naming_config');
    if (!cfg) return null;
    try {
      const { inisialBP, nomorBP } = JSON.parse(cfg);
      if (!inisialBP || !nomorBP) return null;
      return `${inisialBP}-${nomorBP}-`;
    } catch (error) {
      console.error('Error parsing BP naming config:', error);
      return null;
    }
  };

  const generateSerialNumber = (prefix: string, width = 7): string => {
    const key = `serial_counter_${prefix.replace(/-/g, '_')}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10) || 0;
    const next = current + 1;
    localStorage.setItem(key, String(next));
    const num = String(next).padStart(width, '0');
    return `${prefix}${num}`;
  };

  // Load BP naming configuration
  useEffect(() => {
    const saved = localStorage.getItem('bp_naming_config');
    if (saved) {
      try {
        setBpNaming(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading BP naming config:', error);
      }
    }
  }, []);

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

  // ✅ CRITICAL: Klakson bunyi saat print ticket muncul (alert driver)
  useEffect(() => {
    if (printTicketOpen && raspberryPi?.isConnected) {
      console.log('🔔 Print ticket opened - Activating klakson for driver alert');
      
      // Find klakson relay settings
      const klaksonRelay = relaySettings.find(r => r.name.toLowerCase() === 'klakson');
      const modbusCoil = klaksonRelay ? parseInt(klaksonRelay.modbusCoil) : 15; // Default coil 15
      
      // Klakson ON
      raspberryPi.sendRelayCommand('klakson', true, modbusCoil);
      
      // OFF setelah 2 detik
      const timer = setTimeout(() => {
        raspberryPi.sendRelayCommand('klakson', false, modbusCoil);
        console.log('🔕 Klakson OFF');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [printTicketOpen, raspberryPi, relaySettings]);
  
  // Show simulation mode notification (once per session)
  useEffect(() => {
    const hasShownSimulationToast = sessionStorage.getItem('simulation_toast_shown');
    if (raspberryPi?.productionMode === 'simulation' && !hasShownSimulationToast) {
      toast({
        title: "🎮 Mode Simulasi Aktif",
        description: "Controller tidak terhubung (normal untuk simulasi)",
      });
      sessionStorage.setItem('simulation_toast_shown', 'true');
    }
  }, [raspberryPi?.productionMode, toast]);

  // Production sequence hook with Raspberry Pi integration and auto mode
  const { productionState, componentStates, productionStartTimestamp, productionEndTimestamp, systemConfig, accessories, startProduction, stopProduction, pauseProduction, resumeProduction } = useProductionSequence(
    handleCementDeduction,
    handleAggregateDeduction,
    handleWaterDeduction,
    relaySettings,
    raspberryPi,
    isAutoMode,
    (finalWeights?: { pasir: number; batu: number; semen: number; air: number; startTime?: string; endTime?: string }) => {
      // Auto-stop when production completes
      setIsRunning(false);
      console.log('✅ Production complete - Start button ready for next batch');
      
      // ✅ CRITICAL: Calculate duration using accurate timestamps
      const endTime = productionEndTimestamp || new Date();
      const startTime = productionStartTimestamp || endTime;
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);
      const durationSeconds = Math.floor((durationMs % 60000) / 1000);
      console.log(`⏱️ Production duration: ${durationMinutes}m ${durationSeconds}s (from ${startTime.toISOString()} to ${endTime.toISOString()})`);
      
      // Use ref to access latest batch config (avoid closure issue)
      const batchConfig = currentBatchConfigRef.current;
      
      console.log('🔍 DEBUG - Checking available data:', {
        hasBatchConfig: !!batchConfig,
        batchConfigTargets: batchConfig?.targetWeights,
        batchConfigJumlahMixing: batchConfig?.jumlahMixing,
        productionStateTargets: productionState.targetWeights,
        productionStateJumlahMixing: productionState.jumlahMixing,
        finalWeights
      });
      
      // ✅ FIX: Calculate CUMULATIVE target weights (per mixing × jumlahMixing)
      const targetWeights = batchConfig?.targetWeights || productionState.targetWeights;
      const targetPasirPerMixing = (targetWeights.pasir1 || 0) + (targetWeights.pasir2 || 0);
      const targetBatuPerMixing = (targetWeights.batu1 || 0) + (targetWeights.batu2 || 0);
      const targetSemenPerMixing = targetWeights.semen || 0;
      const targetAirPerMixing = targetWeights.air || 0;
      
      // ✅ CRITICAL FIX: MULTIPLY by jumlahMixing to get TOTAL CUMULATIVE target
      // Ambil dari batchConfig DULU (lebih akurat), baru fallback ke productionState
      const jumlahMixing = batchConfig?.jumlahMixing || productionState.jumlahMixing || 1;
      const targetPasir = Math.round(targetPasirPerMixing * jumlahMixing);
      const targetBatu = Math.round(targetBatuPerMixing * jumlahMixing);
      const targetSemen = Math.round(targetSemenPerMixing * jumlahMixing);
      const targetAir = Math.round(targetAirPerMixing * jumlahMixing);
      
      // ✅ Get realisasi from finalWeights (already CUMULATIVE from all mixings)
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
        ? formatVolume(batchConfig.volume / productionState.jumlahMixing)
        : formatVolume((targetPasir + targetBatu + targetSemen + targetAir) / 2400);

      // Helper function: Extract time from activity log
      const extractTimeFromLog = (logMessage: string): string => {
        const match = logMessage.match(/\[(\d{2}:\d{2}:\d{2})\]/);
        return match ? match[1] : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      };

      // Helper function: Get start and end time from activity logs
      const getProductionTimes = (activityLogs: string[]) => {
        let startTime = '';
        let endTime = '';
        
        // Cari log "🚀 Starting production sequence" untuk jam mulai
        const startLog = activityLogs.find(log => log.includes('🚀 Starting production sequence'));
        if (startLog) {
          startTime = extractTimeFromLog(startLog);
        }
        
        // Cari log "🎉 Production complete!" untuk jam selesai
        const endLog = activityLogs.find(log => log.includes('🎉 Production complete!'));
        if (endLog) {
          endTime = extractTimeFromLog(endLog);
        }
        
        // Fallback: Gunakan waktu saat ini jika tidak ditemukan
        if (!startTime) startTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (!endTime) endTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        return { startTime, endTime };
      };

      // ✅ FIXED: Get start and end time from callback (more accurate)
      const jamMulai = finalWeights?.startTime || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const jamSelesai = finalWeights?.endTime || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // ✅ NEW: Generate serial number
      const prefix = getBPPrefix();
      const serialNumber = prefix ? generateSerialNumber(prefix, 7) : undefined;

      // ✅ Calculate individual material targets from targetWeights
      const pasir1Target = Math.round((targetWeights.pasir1 || 0) * jumlahMixing);
      const pasir2Target = Math.round((targetWeights.pasir2 || 0) * jumlahMixing);
      const batu1Target = Math.round((targetWeights.batu1 || 0) * jumlahMixing);
      const batu2Target = Math.round((targetWeights.batu2 || 0) * jumlahMixing);

      // ✅ Calculate individual material realisasi (proportional split from cumulative)
      const totalPasirTarget = pasir1Target + pasir2Target;
      const totalBatuTarget = batu1Target + batu2Target;
      
      const pasir1Realisasi = totalPasirTarget > 0 
        ? Math.round(realisasiPasir * (pasir1Target / totalPasirTarget))
        : 0;
      const pasir2Realisasi = totalPasirTarget > 0
        ? Math.round(realisasiPasir * (pasir2Target / totalPasirTarget))
        : 0;
      const batu1Realisasi = totalBatuTarget > 0
        ? Math.round(realisasiBatu * (batu1Target / totalBatuTarget))
        : 0;
      const batu2Realisasi = totalBatuTarget > 0
        ? Math.round(realisasiBatu * (batu2Target / totalBatuTarget))
        : 0;

      const ticket: TicketData = {
        id: `TICKET-${Date.now()}`,
        jobOrder: `${productionState.currentMixing}`,
        productionType: 'AUTO', // Mark as auto production
        serialNumber, // ✅ NEW: Add serial number
        operatorName: loggedOperator?.namaUser, // ✅ NEW: Add operator name
        nomorPO: "-",
        tanggal: endTime.toLocaleDateString('id-ID'),
        jamMulai: jamMulai,
        jamSelesai: jamSelesai,
        namaPelanggan: batchConfig?.pelanggan || "",
        lokasiProyek: batchConfig?.lokasi || "",
        mutuBeton: batchConfig?.mutuBeton || "",
        slump: batchConfig?.slump ? `${batchConfig.slump} cm` : "",
        volume: volumePerMixing ? `${volumePerMixing} M³` : "",
        namaSopir: batchConfig?.sopir || "",
        nomorMobil: batchConfig?.noKendaraan || "",
        nomorLambung: "",
        nomorRitasi: "",
        totalVolume: "",
        materials: {
          pasir1: {
            target: pasir1Target,
            realisasi: pasir1Realisasi,
            deviasi: pasir1Realisasi - pasir1Target
          },
          pasir2: {
            target: pasir2Target,
            realisasi: pasir2Realisasi,
            deviasi: pasir2Realisasi - pasir2Target
          },
          batu1: {
            target: batu1Target,
            realisasi: batu1Realisasi,
            deviasi: batu1Realisasi - batu1Target
          },
          batu2: {
            target: batu2Target,
            realisasi: batu2Realisasi,
            deviasi: batu2Realisasi - batu2Target
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
        },
        aggregateNote: currentAggregateNotes, // Include persistent aggregate notes
      };
      
      // Save to localStorage
      const savedTickets = localStorage.getItem('production_tickets');
      const tickets = savedTickets ? JSON.parse(savedTickets) : [];
      tickets.unshift(ticket); // Add to beginning
      localStorage.setItem('production_tickets', JSON.stringify(tickets));
      
      setTicketData(ticket);
      if (autoPrintEnabled) {
        setPrintTicketOpen(true);
      }
    },
    handleAggregateBinsRefill // ✅ NEW: Pass refill callback for System 3
  );

  // Manual production hook - transform weights and relay states
  const manualProduction = useManualProduction(
    {
      aggregate: (raspberryPi?.actualWeights?.pasir || 0) + (raspberryPi?.actualWeights?.batu || 0),
      semen: raspberryPi?.actualWeights?.semen || 0,
      air: raspberryPi?.actualWeights?.air || 0,
    },
    {
      pintu_pasir_1: componentStates.sandBin1Valve || false,
      pintu_pasir_2: componentStates.sandBin2Valve || false,
      pintu_batu_1: componentStates.stoneBin1Valve || false,
      pintu_batu_2: componentStates.stoneBin2Valve || false,
    }
  );

  // ✅ NEW: Stabilize weight display to prevent flickering during mixing transitions
  useEffect(() => {
    const currentWeights = productionState.currentWeights;
    
    // ✅ FIX: Freeze display during mixer waiting to prevent flicker
    if (productionState.isWaitingForMixer) {
      console.log('⏸️ Freezing weight display: isWaitingForMixer=true');
      return; // Don't update weights while waiting for mixer
    }
    
    // ✅ FIX: Freeze display during mixing transition when next mixing is ready
    if (productionState.currentStep === 'mixing' && productionState.nextMixingReady) {
      console.log('⏸️ Freezing weight display: mixing transition phase (nextMixingReady=true)');
      return; // Don't update weights during mixing transition to prevent flicker
    }
    
    // Clear existing timer
    if (weightStabilizationTimer.current) {
      clearTimeout(weightStabilizationTimer.current);
    }
    
    // ✅ IMPROVED: Higher threshold for aggregate (25kg), 10kg for others
    const hasSignificantChange = 
      Math.abs(currentWeights.pasir - stableWeights.pasir) > 10 ||
      Math.abs(currentWeights.batu - stableWeights.batu) > 10 ||
      Math.abs(currentWeights.semen - stableWeights.semen) > 10 ||
      Math.abs(currentWeights.air - stableWeights.air) > 10 ||
      Math.abs((currentWeights.aggregate || 0) - stableWeights.aggregate) > 25;
    
    if (hasSignificantChange) {
      // ✅ IMPROVED: Increased debounce to 300ms for smoother display
      weightStabilizationTimer.current = setTimeout(() => {
        // ✅ SYSTEM 1 FIX: Monotonic clamp for aggregate during weighing (prevent flickering)
        let newAggregateWeight = currentWeights.aggregate || 0;
        
        // Only apply clamp during System 1 aggregate weighing, NOT during discharge
        const systemConfig = parseInt(localStorage.getItem('system_config') || '1');
        if (systemConfig === 1 && 
            componentStates.isAggregateWeighing && 
            !componentStates.hopperValveAggregate) {
          
          // Prevent sudden drops > 5kg (likely flickering between pasir/batu channels)
          if (newAggregateWeight < stableWeights.aggregate - 5) {
            console.log(`🛡️ CLAMP: Aggregate drop prevented (${newAggregateWeight.toFixed(1)}kg → keeping ${stableWeights.aggregate.toFixed(1)}kg)`);
            newAggregateWeight = stableWeights.aggregate; // Keep previous stable value
          }
        }
        
        setStableWeights({
          pasir: currentWeights.pasir,
          batu: currentWeights.batu,
          semen: currentWeights.semen,
          air: currentWeights.air,
          aggregate: newAggregateWeight,
        });
      }, 300); // 300ms debounce (increased from 150ms)
    }
    
    return () => {
      if (weightStabilizationTimer.current) {
        clearTimeout(weightStabilizationTimer.current);
      }
    };
  }, [productionState.currentWeights, stableWeights, productionState.isWaitingForMixer, productionState.currentStep, productionState.nextMixingReady]);

  const handleStart = () => {
    if (!loggedOperator) {
      toast({
        title: "Operator Belum Login",
        description: "Harap login operator terlebih dahulu sebelum memulai produksi",
        variant: "destructive",
      });
      return;
    }
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

  // Manual production handlers
  const handleOpenManualForm = () => {
    setManualFormOpen(true);
  };

  const handleManualFormSubmit = (formData: {
    pelanggan: string;
    lokasiProyek: string;
    mutuBeton: string;
    slump: string;
    targetProduksi: string;
    selectedSilo: string;
    namaSopir: string;
    nomorMobil: string;
  }) => {
    manualProduction.startManualSession(formData);
    setManualFormOpen(false);
  };

  const handleStopManual = () => {
    const finalSession = manualProduction.stopManualSession();
    
    if (finalSession) {
      const prefix = getBPPrefix();
      const serialNumber = prefix ? generateSerialNumber(prefix, 7) : undefined;

      const ticket: TicketData = {
        id: finalSession.sessionId,
        jobOrder: 'MANUAL',
        productionType: 'MANUAL',
        serialNumber,
        operatorName: loggedOperator?.namaUser,
        nomorPO: '-',
        tanggal: finalSession.endTime?.toLocaleDateString('id-ID') || new Date().toLocaleDateString('id-ID'),
        jamMulai: finalSession.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        jamSelesai: finalSession.endTime?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        namaPelanggan: finalSession.formData.pelanggan,
        lokasiProyek: finalSession.formData.lokasiProyek,
        mutuBeton: finalSession.formData.mutuBeton,
        slump: finalSession.formData.slump ? `${finalSession.formData.slump} cm` : '-',
        volume: finalSession.formData.targetProduksi ? `${formatVolume(parseFloat(finalSession.formData.targetProduksi))} M³` : '-',
        namaSopir: finalSession.formData.namaSopir,
        nomorMobil: finalSession.formData.nomorMobil,
        nomorLambung: '-',
        nomorRitasi: '-',
        totalVolume: '-',
        materials: {
          pasir1: { 
            target: Math.round(finalSession.materials.pasir1.target || 0), 
            realisasi: Math.round(finalSession.materials.pasir1.totalDischarged), 
            deviasi: Math.round(finalSession.materials.pasir1.totalDischarged - (finalSession.materials.pasir1.target || 0))
          },
          pasir2: { 
            target: Math.round(finalSession.materials.pasir2.target || 0), 
            realisasi: Math.round(finalSession.materials.pasir2.totalDischarged), 
            deviasi: Math.round(finalSession.materials.pasir2.totalDischarged - (finalSession.materials.pasir2.target || 0))
          },
          batu1: { 
            target: Math.round(finalSession.materials.batu1.target || 0), 
            realisasi: Math.round(finalSession.materials.batu1.totalDischarged), 
            deviasi: Math.round(finalSession.materials.batu1.totalDischarged - (finalSession.materials.batu1.target || 0))
          },
          batu2: { 
            target: Math.round(finalSession.materials.batu2.target || 0), 
            realisasi: Math.round(finalSession.materials.batu2.totalDischarged), 
            deviasi: Math.round(finalSession.materials.batu2.totalDischarged - (finalSession.materials.batu2.target || 0))
          },
          semen: { 
            target: Math.round(finalSession.materials.semen.target || 0), 
            realisasi: Math.round(finalSession.materials.semen.totalDischarged), 
            deviasi: Math.round(finalSession.materials.semen.totalDischarged - (finalSession.materials.semen.target || 0))
          },
          air: { 
            target: Math.round(finalSession.materials.air.target || 0), 
            realisasi: Math.round(finalSession.materials.air.totalDischarged), 
            deviasi: Math.round(finalSession.materials.air.totalDischarged - (finalSession.materials.air.target || 0))
          },
        },
        aggregateNote: currentAggregateNotes, // Use notes from main screen
      };

      const saved = localStorage.getItem('production_tickets');
      const tickets = saved ? JSON.parse(saved) : [];
      tickets.push(ticket);
      localStorage.setItem('production_tickets', JSON.stringify(tickets));

      setTicketData(ticket);
      setPrintTicketOpen(true);
      
      // DO NOT clear aggregate notes - keep for next production (persistent)
      // setCurrentAggregateNotes({});
    }
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
          {/* Operator Login/Display */}
          {loggedOperator ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <User className="w-4 h-4" />
                  Operator: {loggedOperator.namaUser}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleOperatorLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout Operator
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setOperatorLoginOpen(true)}
              className="gap-2"
            >
              <User className="w-4 h-4" />
              Login Operator
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSiloFillOpen(true)}
            className="gap-2"
          >
            <Package className="w-4 h-4" />
            Isi Silo
          </Button>
          
          {bpNaming.inisialBP && bpNaming.nomorBP && (
            <span className="text-sm font-semibold text-white/90 px-3 py-1 bg-primary/20 rounded-md border border-primary/30">
              {bpNaming.inisialBP}-{bpNaming.nomorBP}
            </span>
          )}
          
          {user ? (
            <>
              <span className="text-sm">
                {user.name}
              </span>
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

      <OperatorLoginDialog
        open={operatorLoginOpen}
        onOpenChange={setOperatorLoginOpen}
        onLoginSuccess={handleOperatorLogin}
      />

      <ActivationDialog
        open={activationOpen}
        onActivationSuccess={handleActivationSuccess}
      />

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
          // ✅ CRITICAL: Safety check - Block production if mode is "production" but controller not connected
          if (raspberryPi?.productionMode === 'production' && !raspberryPi?.isConnected) {
            console.error('❌ BLOCKED: Cannot start production - Controller not connected in Production mode');
            toast({
              title: "❌ Tidak Dapat Memulai Produksi",
              description: "Mode Produksi memerlukan koneksi Autonics. Hubungkan controller atau switch ke Mode Simulasi di COM & Port Settings.",
              variant: "destructive",
              duration: 8000, // Longer duration untuk visibility
            });
            
            // Close dialog agar user sadar ada masalah
            setBatchStartOpen(false);
            return; // BLOCK production start
          }
          
          console.log('✅ Safety check passed - Starting production');
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

      {/* Manual Production Form Dialog */}
      <ManualFormDialog
        open={manualFormOpen}
        onOpenChange={setManualFormOpen}
        onStart={handleManualFormSubmit}
        silos={silos}
      />

      {/* Aggregate Note Dialog - Main Screen */}
      <AggregateNoteDialog
        open={aggregateNoteDialogOpen}
        onOpenChange={setAggregateNoteDialogOpen}
        currentNotes={currentAggregateNotes}
        onSave={(notes) => {
          setCurrentAggregateNotes(notes);
          
          // Persist to localStorage
          localStorage.setItem('aggregate_notes', JSON.stringify(notes));
          
          if (manualProduction.currentSession) {
            manualProduction.updateAggregateNote(notes);
          }
          
          toast({
            title: "Aggregate Note Tersimpan",
            description: "Note akan digunakan untuk produksi berikutnya",
          });
        }}
      />

      {/* Moisture Control Dialog */}
      <MoistureControlDialog
        open={moistureControlDialogOpen}
        onOpenChange={setMoistureControlDialogOpen}
        onSettingsChange={(settings) => {
          setMoistureSettings(settings);
        }}
      />

      {/* Main HMI Panel */}
      <main className="flex-1 p-4 relative">
        {/* Logo Perusahaan - Top Right (Outside overflow-hidden) */}
        <div className="absolute top-6 right-6 z-20 flex flex-col items-center bg-black/30 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
          <img 
            src={companySettings.logo || defaultLogo} 
            alt={companySettings.name} 
            className="w-24 h-24 object-contain"
          />
        </div>
        
        <div className="w-full h-[calc(100vh-100px)] border-4 border-hmi-border bg-hmi-panel relative overflow-hidden">
          {/* Activity Log Panel - BOTTOM LEFT (dikembalikan) */}
          <ActivityLogPanel logs={productionState.activityLog} />
          
          {/* Manual Production Panel - TOP RIGHT */}
          <ManualProductionPanel
            isManualSessionActive={manualProduction.isManualSessionActive}
            onOpenForm={handleOpenManualForm}
            onStopManual={handleStopManual}
            isAutoMode={isAutoMode}
            currentSession={manualProduction.currentSession}
          />
          
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 893"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
          >
            {/* Aggregate Section - Left Side */}
            <g id="aggregate-section">
              {/* System 1: 1 Elongated Hopper + Horizontal Conveyor */}
              {systemConfig === 1 && (
                <>
                  {/* 4 Storage Bins */}
                  <StorageBin 
                    x={25} 
                    y={423}
                    fillLevel={(aggregateBins[0].currentVolume / aggregateBins[0].capacity) * 100} 
                    gateOpen={componentStates.sandBin1Valve} 
                    label="PASIR 1"
                    materialType="pasir"
                  />
                  <StorageBin 
                    x={105} 
                    y={423}
                    fillLevel={(aggregateBins[1].currentVolume / aggregateBins[1].capacity) * 100} 
                    gateOpen={componentStates.sandBin2Valve} 
                    label="PASIR 2"
                    materialType="pasir"
                  />
                  <StorageBin 
                    x={185} 
                    y={423}
                    fillLevel={(aggregateBins[2].currentVolume / aggregateBins[2].capacity) * 100} 
                    gateOpen={componentStates.stoneBin1Valve} 
                    label="BATU 1"
                    materialType="batu"
                  />
                  <StorageBin 
                    x={265} 
                    y={423}
                    fillLevel={(aggregateBins[3].currentVolume / aggregateBins[3].capacity) * 100} 
                    gateOpen={componentStates.stoneBin2Valve} 
                    label="BATU 2"
                    materialType="batu"
                  />
                  
                  {/* Single Elongated WeighHopper for ALL aggregate */}
                  <WeighHopper 
                    x={20} 
                    y={563}
                    fillLevel={productionState.hopperFillLevels?.aggregate || 0}
                    currentWeight={stableWeights.aggregate}
                    targetWeight={productionState.cumulativeTargets.pasir + productionState.cumulativeTargets.batu}
                    isWeighing={componentStates.isAggregateWeighing && !productionState.isWaitingForMixer}
                    isDischargingActive={componentStates.hopperValveAggregate}
                    materialType="aggregate"
                    label="AGGREGATE HOPPER"
                    width={330}
                  />
                  
                  {/* Horizontal Conveyor below hopper (integrated) */}
                  <ConveyorBelt 
                    x={50} 
                    y={669}
                    width={260} 
                    horizontal={true}
                    isRunning={componentStates.beltBawah} 
                  />
                  
                  {/* Angled Conveyor to mixer */}
                  <ConveyorBelt x={320} y={713} width={180} angle={32} isRunning={componentStates.beltAtas} />
                </>
              )}
              
              {/* System 2: 2 Separate Hoppers (Default - Current System) */}
              {systemConfig === 2 && (
                <>
                  {/* 4 Storage Bins */}
                  <StorageBin 
                    x={25} 
                    y={423}
                    fillLevel={(aggregateBins[0].currentVolume / aggregateBins[0].capacity) * 100} 
                    gateOpen={componentStates.sandBin1Valve} 
                    label="PASIR 1"
                    materialType="pasir"
                  />
                  <StorageBin 
                    x={105} 
                    y={423}
                    fillLevel={(aggregateBins[1].currentVolume / aggregateBins[1].capacity) * 100} 
                    gateOpen={componentStates.sandBin2Valve} 
                    label="PASIR 2"
                    materialType="pasir"
                  />
                  <StorageBin 
                    x={185} 
                    y={423}
                    fillLevel={(aggregateBins[2].currentVolume / aggregateBins[2].capacity) * 100} 
                    gateOpen={componentStates.stoneBin1Valve} 
                    label="BATU 1"
                    materialType="batu"
                  />
                  <StorageBin 
                    x={265} 
                    y={423}
                    fillLevel={(aggregateBins[3].currentVolume / aggregateBins[3].capacity) * 100} 
                    gateOpen={componentStates.stoneBin2Valve} 
                    label="BATU 2"
                    materialType="batu"
                  />
                  
                  {/* 2 Aggregate Hoppers - Cumulative weighing */}
                  <AggregateHopper 
                    x={31} 
                    y={563}
                    fillLevel={productionState.hopperFillLevels?.pasir || 0} 
                    isActive={componentStates.hopperValvePasir}
                    isFilling={componentStates.sandBin1Valve || componentStates.sandBin2Valve}
                    materialType="pasir"
                    width={140}
                  />
                  <AggregateHopper 
                    x={196} 
                    y={563}
                    fillLevel={productionState.hopperFillLevels?.batu || 0} 
                    isActive={componentStates.hopperValveBatu}
                    isFilling={componentStates.stoneBin1Valve || componentStates.stoneBin2Valve}
                    materialType="batu"
                    width={130}
                  />

                  {/* Conveyor Belt 1 - Below hoppers (horizontal) */}
                  <ConveyorBelt x={50} y={669} width={260} angle={0} isRunning={componentStates.beltBawah} />

                  {/* Conveyor Belt 2 - From bottom left, angled upward to mixer */}
                  <ConveyorBelt x={320} y={713} width={180} angle={32} isRunning={componentStates.beltAtas} />
                </>
              )}
              
              {/* System 3: Storage Bin Weighing (No Weigh Hopper) */}
              {systemConfig === 3 && (
                <>
                  {/* 4 Storage Bins - LOWERED for aesthetic balance without weigh hopper */}
                  <StorageBin 
                    x={25} 
                    y={493}
                    fillLevel={(aggregateBins[0].currentVolume / aggregateBins[0].capacity) * 100} 
                    gateOpen={componentStates.sandBin1Valve} 
                    label="PASIR 1"
                    materialType="pasir"
                    currentWeight={aggregateBins[0].currentVolume}
                    isWeighing={componentStates.sandBin1Valve}
                  />
                  <StorageBin 
                    x={105} 
                    y={493}
                    fillLevel={(aggregateBins[1].currentVolume / aggregateBins[1].capacity) * 100} 
                    gateOpen={componentStates.sandBin2Valve} 
                    label="PASIR 2"
                    materialType="pasir"
                    currentWeight={aggregateBins[1].currentVolume}
                    isWeighing={componentStates.sandBin2Valve}
                  />
                  <StorageBin 
                    x={185} 
                    y={493}
                    fillLevel={(aggregateBins[2].currentVolume / aggregateBins[2].capacity) * 100} 
                    gateOpen={componentStates.stoneBin1Valve} 
                    label="BATU 1"
                    materialType="batu"
                    currentWeight={aggregateBins[2].currentVolume}
                    isWeighing={componentStates.stoneBin1Valve}
                  />
                  <StorageBin 
                    x={265} 
                    y={493}
                    fillLevel={(aggregateBins[3].currentVolume / aggregateBins[3].capacity) * 100} 
                    gateOpen={componentStates.stoneBin2Valve} 
                    label="BATU 2"
                    materialType="batu"
                    currentWeight={aggregateBins[3].currentVolume}
                    isWeighing={componentStates.stoneBin2Valve}
                  />
                  
                  {/* NO Weigh Hopper - material goes directly to horizontal conveyor */}
                  
                  {/* Horizontal Conveyor - SAME POSITION as other systems */}
                  <ConveyorBelt 
                    x={50} 
                    y={669}
                    width={260} 
                    horizontal={true}
                    isRunning={componentStates.beltBawah} 
                  />
                  
                  {/* Angled Conveyor to mixer - SAME POSITION as other systems */}
                  <ConveyorBelt x={320} y={713} width={180} angle={32} isRunning={componentStates.beltAtas} />
                </>
              )}
              
              {/* Accessory 4: Waiting Hopper (if enabled) */}
              {accessories.includes('4') && (
                <WaitingHopper 
                  x={500} 
                  y={623}
                  fillLevel={componentStates.waitingHopperFillLevel || 0}
                  isActive={componentStates.isWaitingHopperActive || false}
                />
              )}
            </g>

            {/* Cement Silos Section - Center */}
            <g id="cement-section">
              {/* 6 Cement Silos */}
              <CementSilo 
                x={460} 
                y={283}
                label="SILO 1"
                currentVolume={silos[0].currentVolume}
                capacity={silos[0].capacity}
                isActive={componentStates.siloValves[0]}
              />
              <CementSilo 
                x={510} 
                y={283}
                label="SILO 2"
                currentVolume={silos[1].currentVolume}
                capacity={silos[1].capacity}
                isActive={componentStates.siloValves[1]}
              />
              <CementSilo 
                x={560} 
                y={283}
                label="SILO 3"
                currentVolume={silos[2].currentVolume}
                capacity={silos[2].capacity}
                isActive={componentStates.siloValves[2]}
              />
              <CementSilo 
                x={610} 
                y={283}
                label="SILO 4"
                currentVolume={silos[3].currentVolume}
                capacity={silos[3].capacity}
                isActive={componentStates.siloValves[3]}
              />
              <CementSilo 
                x={660} 
                y={283}
                label="SILO 5"
                currentVolume={silos[4].currentVolume}
                capacity={silos[4].capacity}
                isActive={componentStates.siloValves[4]}
              />
              <CementSilo 
                x={710} 
                y={283}
                label="SILO 6"
                currentVolume={silos[5].currentVolume}
                capacity={silos[5].capacity}
                isActive={componentStates.siloValves[5]}
              />

              {/* Single Weigh Hopper below silos (BIGGER) */}
              <WeighHopper 
                x={550} 
                y={543}
                fillLevel={productionState.hopperFillLevels.semen}
                currentWeight={stableWeights.semen}
                targetWeight={productionState.targetWeights.semen}
                isWeighing={productionState.targetWeights.semen > 0 && !productionState.weighingComplete.semen}
                isDischargingActive={componentStates.cementValve}
                materialType="cement"
              />

              {/* Pipes from silos to single weigh hopper with elbows */}
              <Pipe points="480,453 480,528 570,528 570,543" type="material" isActive={componentStates.siloValves[0]} />
              <Pipe points="530,453 530,533 580,533 580,543" type="material" isActive={componentStates.siloValves[1]} />
              <Pipe points="580,453 580,543" type="material" isActive={componentStates.siloValves[2]} />
              <Pipe points="630,453 630,533 610,533 610,543" type="material" isActive={componentStates.siloValves[3]} />
              <Pipe points="680,453 680,528 620,528 620,543" type="material" isActive={componentStates.siloValves[4]} />
              <Pipe points="730,453 730,523 620,523 620,543" type="material" isActive={componentStates.siloValves[5]} />
            </g>

            {/* Additive Tanks Section - Right Side */}
            <g id="additive-section">
              {/* Water Tank - Storage (2000 kg capacity) */}
              <AdditiveTank 
                x={780} 
                y={313}
                label="TANK AIR" 
                isValveActive={componentStates.waterTankValve}
                currentVolume={waterTank.currentVolume}
                targetVolume={productionState.targetWeights.air}
              />
              
              <AdditiveTank 
                x={840} 
                y={313}
                fillLevel={75} 
                label="ADDITIVE" 
                isValveActive={componentStates.additiveValve}
                currentVolume={productionState.currentWeights.additive}
                targetVolume={productionState.targetWeights.additive}
              />

              {/* Intermediate Tank dengan fungsi Weighing */}
              <g transform="translate(780, 523)">
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
                points="797,428 797,523" 
                type="water" 
                isActive={false}
              />

              {/* Pipe from intermediate tank to mixer */}
              <Pipe 
                points="797,578 797,623 605,623 605,653" 
                type="water" 
                isActive={componentStates.waterHopperValve}
              />

            </g>

            {/* Mixer Section - Center Bottom */}
            <g id="mixer-section">
            {/* Main Mixer - Twin Shaft Horizontal */}
            <Mixer 
              x={455} 
              y={643}
              isRunning={componentStates.mixer}
              doorOpen={componentStates.mixerDoor}
              isDoorMoving={productionState.isDoorMoving}
              mixingTimeRemaining={productionState.mixingTimeRemaining || manualTimerDuration}
              totalMixingTime={currentBatchConfig?.mixingTime || manualTimerDuration}
              currentMixing={productionState.currentMixing}
              totalMixing={productionState.jumlahMixing}
              isTimerActive={productionState.mixingTimeRemaining > 0}
              doorTimeRemaining={productionState.doorTimeRemaining}
              totalDoorTime={productionState.totalDoorTime}
            />
            
            {/* Physical Button LED Indicators */}
            <PhysicalButtonLED 
              x={440} 
              y={665} 
              isActive={raspberryPi?.physicalButtonStates?.mixer || false}
              relayName="mixer"
            />
            <PhysicalButtonLED 
              x={440} 
              y={700} 
              isActive={raspberryPi?.physicalButtonStates?.pintu_mixer || false}
              relayName="pintu_mixer"
            />
            <PhysicalButtonLED 
              x={600} 
              y={640} 
              isActive={raspberryPi?.physicalButtonStates?.semen || false}
              relayName="semen"
            />
            <PhysicalButtonLED 
              x={800} 
              y={600} 
              isActive={raspberryPi?.physicalButtonStates?.pompa_air || false}
              relayName="pompa_air"
            />

              {/* Mixer Truck - Below discharge chute */}
              <MixerTruck 
                x={510} 
                y={743}
                isReceiving={componentStates.mixerDoor}
                isMoving={false}
              />

              {/* Pipe to mixer from single weigh hopper */}
              <Pipe points="600,619 600,633 530,633 530,653" type="material" isActive={componentStates.cementValve} />
              
              {/* Pipe from additive intermediate tank */}
              <Pipe points="797,578 720,578 720,653 605,653" type="water" isActive={false} />
            </g>

          </svg>

          {/* Ampere Meter and Slump Estimation Display - TOP LEFT */}
          <div className="absolute top-[190px] left-2">
            <AmpereMeterDisplay />
          </div>
          
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
          
          {/* Material Weight Indicators - Horizontal on Top Left - ENLARGED & STANDARDIZED */}
          <div className="absolute top-2 left-2 flex flex-row gap-6"> {/* Adjusted positioning to prevent clipping */}
            {systemConfig === 1 ? (
              <>
                {/* SYSTEM 1: 3 Indikator - Aggregate (komulatif), Semen, Air */}
                {/* Aggregate */}
                <div className="flex flex-col gap-2">
                  {/* Target box - STANDARDIZED */}
                  <div className="backdrop-blur-sm bg-blue-900/40 border-2 border-blue-500/50 rounded-lg px-4 py-3 w-[220px] h-[70px] flex flex-col justify-center">
                    <div className="text-[12px] text-blue-300 font-semibold uppercase tracking-wide">TARGET</div>
                    <div className="text-xl font-bold text-blue-200 tabular-nums">
                      {(productionState.cumulativeTargets.pasir + productionState.cumulativeTargets.batu).toFixed(0)} kg
                    </div>
                    {/* Detail target pasir & batu */}
                    <div className="text-[10px] text-blue-400/70 mt-1 flex gap-2">
                      <span>Pasir: {productionState.cumulativeTargets.pasir.toFixed(0)}</span>
                      <span>|</span>
                      <span>Batu: {productionState.cumulativeTargets.batu.toFixed(0)}</span>
                    </div>
                  </div>
                  {/* Current weight indicator - STANDARDIZED */}
                  <div className={`backdrop-blur-sm border-2 rounded-lg px-5 py-4 w-[220px] h-[85px] flex flex-col justify-center ${
                    (productionState.cumulativeTargets.pasir + productionState.cumulativeTargets.batu) > 0
                      ? 'bg-green-900/40 border-green-500/50' 
                      : 'bg-gray-800/40 border-gray-600'
                  }`}>
                    <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">AGGREGATE</div>
                    <div className="text-3xl font-bold text-green-300 tabular-nums">
                      {(productionState.currentWeights.aggregate || 0).toFixed(0)} kg
                    </div>
                  </div>
                </div>
                
                {/* Semen */}
                <div className="flex flex-col gap-2">
                  {/* Target box - STANDARDIZED */}
                  <div className="backdrop-blur-sm bg-blue-900/40 border-2 border-blue-500/50 rounded-lg px-4 py-3 w-[220px] h-[60px] flex flex-col justify-center">
                    <div className="text-[12px] text-blue-300 font-semibold uppercase tracking-wide">TARGET</div>
                    <div className="text-xl font-bold text-blue-200 tabular-nums">
                      {productionState.targetWeights.semen.toFixed(0)} kg
                    </div>
                  </div>
                  {/* Current weight indicator - STANDARDIZED */}
                  <div className={`backdrop-blur-sm border-2 rounded-lg px-5 py-4 w-[220px] h-[85px] flex flex-col justify-center ${
                    productionState.targetWeights.semen > 0 
                      ? 'bg-green-900/40 border-green-500/50' 
                      : 'bg-gray-800/40 border-gray-600'
                  }`}>
                    <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">SEMEN</div>
                    <div className="text-3xl font-bold text-green-300 tabular-nums">
                      {productionState.currentWeights.semen.toFixed(0)} kg
                    </div>
                  </div>
                </div>
                
                {/* Air */}
                <div className="flex flex-col gap-2">
                  {/* Target box - STANDARDIZED */}
                  <div className="backdrop-blur-sm bg-blue-900/40 border-2 border-blue-500/50 rounded-lg px-4 py-3 w-[220px] h-[60px] flex flex-col justify-center">
                    <div className="text-[12px] text-blue-300 font-semibold uppercase tracking-wide">TARGET</div>
                    <div className="text-xl font-bold text-blue-200 tabular-nums">
                      {productionState.targetWeights.air.toFixed(0)} kg
                    </div>
                  </div>
                  {/* Current weight indicator - STANDARDIZED */}
                  <div className={`backdrop-blur-sm border-2 rounded-lg px-5 py-4 w-[220px] h-[85px] flex flex-col justify-center ${
                    productionState.targetWeights.air > 0 
                      ? 'bg-green-900/40 border-green-500/50' 
                      : 'bg-gray-800/40 border-gray-600'
                  }`}>
                    <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">AIR</div>
                    <div className="text-3xl font-bold text-green-300 tabular-nums">
                      {productionState.currentWeights.air.toFixed(0)} kg
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* SYSTEM 2: 4 Indikator - Pasir, Batu, Semen, Air - STANDARDIZED */}
                {/* Pasir */}
                <div className="flex flex-col gap-2">
                  {/* Target box - STANDARDIZED */}
                  <div className="backdrop-blur-sm bg-blue-900/40 border-2 border-blue-500/50 rounded-lg px-4 py-3 w-[220px] h-[60px] flex flex-col justify-center">
                    <div className="text-[12px] text-blue-300 font-semibold uppercase tracking-wide">TARGET</div>
                    <div className="text-xl font-bold text-blue-200 tabular-nums">
                      {productionState.cumulativeTargets.pasir.toFixed(0)} kg
                    </div>
                  </div>
                  {/* Current weight indicator - STANDARDIZED */}
                  <div className={`backdrop-blur-sm border-2 rounded-lg px-5 py-4 w-[220px] h-[85px] flex flex-col justify-center ${
                    productionState.cumulativeTargets.pasir > 0
                      ? 'bg-green-900/40 border-green-500/50' 
                      : 'bg-gray-800/40 border-gray-600'
                  }`}>
                    <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      PASIR
                    </div>
                    <div className="text-3xl font-bold text-green-300 tabular-nums">
{systemConfig === 3 ? (
  // Production mode: always read real load cell; no fallback to simulation
  raspberryPi?.productionMode === 'production'
    ? ((raspberryPi?.actualWeights['pasir'] ?? 0).toFixed(0))
    : ((aggregateBins[0].currentVolume + aggregateBins[1].currentVolume).toFixed(0))
) : (
  /* System 1 & 2: Show weighing hopper weight */
  productionState.currentWeights.pasir.toFixed(0)
)} kg
                    </div>
                  </div>
                </div>
                
                {/* Batu */}
                <div className="flex flex-col gap-2">
                  {/* Target box - STANDARDIZED */}
                  <div className="backdrop-blur-sm bg-blue-900/40 border-2 border-blue-500/50 rounded-lg px-4 py-3 w-[220px] h-[60px] flex flex-col justify-center">
                    <div className="text-[12px] text-blue-300 font-semibold uppercase tracking-wide">TARGET</div>
                    <div className="text-xl font-bold text-blue-200 tabular-nums">
                      {productionState.cumulativeTargets.batu.toFixed(0)} kg
                    </div>
                  </div>
                  {/* Current weight indicator - STANDARDIZED */}
                  <div className={`backdrop-blur-sm border-2 rounded-lg px-5 py-4 w-[220px] h-[85px] flex flex-col justify-center ${
                    productionState.cumulativeTargets.batu > 0
                      ? 'bg-green-900/40 border-green-500/50' 
                      : 'bg-gray-800/40 border-gray-600'
                  }`}>
                    <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      BATU
                    </div>
                    <div className="text-3xl font-bold text-green-300 tabular-nums">
{systemConfig === 3 ? (
  // Production mode: always read real load cell; no fallback to simulation
  raspberryPi?.productionMode === 'production'
    ? ((raspberryPi?.actualWeights['batu'] ?? 0).toFixed(0))
    : ((aggregateBins[2].currentVolume + aggregateBins[3].currentVolume).toFixed(0))
) : (
  /* System 1 & 2: Show weighing hopper weight */
  productionState.currentWeights.batu.toFixed(0)
)} kg
                    </div>
                  </div>
                </div>
                
                {/* Semen */}
                <div className="flex flex-col gap-2">
                  {/* Target box - STANDARDIZED */}
                  <div className="backdrop-blur-sm bg-blue-900/40 border-2 border-blue-500/50 rounded-lg px-4 py-3 w-[220px] h-[60px] flex flex-col justify-center">
                    <div className="text-[12px] text-blue-300 font-semibold uppercase tracking-wide">TARGET</div>
                    <div className="text-xl font-bold text-blue-200 tabular-nums">
                      {productionState.targetWeights.semen.toFixed(0)} kg
                    </div>
                  </div>
                  {/* Current weight indicator - STANDARDIZED */}
                  <div className={`backdrop-blur-sm border-2 rounded-lg px-5 py-4 w-[220px] h-[85px] flex flex-col justify-center ${
                    productionState.targetWeights.semen > 0 
                      ? 'bg-green-900/40 border-green-500/50' 
                      : 'bg-gray-800/40 border-gray-600'
                  }`}>
                    <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">SEMEN</div>
                    <div className="text-3xl font-bold text-green-300 tabular-nums">
                      {productionState.currentWeights.semen.toFixed(0)} kg
                    </div>
                  </div>
                </div>
                
                {/* Air */}
                <div className="flex flex-col gap-2">
                  {/* Target box - STANDARDIZED */}
                  <div className="backdrop-blur-sm bg-blue-900/40 border-2 border-blue-500/50 rounded-lg px-4 py-3 w-[220px] h-[60px] flex flex-col justify-center">
                    <div className="text-[12px] text-blue-300 font-semibold uppercase tracking-wide">TARGET</div>
                    <div className="text-xl font-bold text-blue-200 tabular-nums">
                      {productionState.targetWeights.air.toFixed(0)} kg
                    </div>
                  </div>
                  {/* Current weight indicator - STANDARDIZED */}
                  <div className={`backdrop-blur-sm border-2 rounded-lg px-5 py-4 w-[220px] h-[85px] flex flex-col justify-center ${
                    productionState.targetWeights.air > 0 
                      ? 'bg-green-900/40 border-green-500/50' 
                      : 'bg-gray-800/40 border-gray-600'
                  }`}>
                    <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">AIR</div>
                    <div className="text-3xl font-bold text-green-300 tabular-nums">
                      {productionState.currentWeights.air.toFixed(0)} kg
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>


          {/* Moisture Control Button - Above Quarry Aggregate button */}
          <button
            onClick={() => setMoistureControlDialogOpen(true)}
            className={`absolute bottom-[140px] right-2 w-32 h-16 border-4 rounded-lg transition-all shadow-lg flex flex-col items-center justify-center gap-1 z-40 ${
              moistureSettings.pasir !== 0 || moistureSettings.batu !== 0 || moistureSettings.air !== 0
                ? 'bg-teal-600 border-teal-800 hover:bg-teal-700 ring-2 ring-teal-400/50'
                : 'bg-teal-600 border-teal-800 hover:bg-teal-700'
            }`}
          >
            <div className="text-white text-xs font-bold">
              MOISTURE
            </div>
            <div className="text-white text-xs font-bold">
              CONTROL
            </div>
          </button>

          {/* Quarry Aggregate Button - Positioned above Print button - Shows in both Manual and Auto modes */}
          <button
            onClick={() => setAggregateNoteDialogOpen(true)}
            className="absolute bottom-[60px] right-2 w-32 h-16 border-4 rounded-lg transition-all shadow-lg flex flex-col items-center justify-center gap-1 bg-blue-600 border-blue-800 hover:bg-blue-700 z-40"
          >
            <div className="text-white text-xs font-bold">
              QUARRY
            </div>
            <div className="text-white text-xs font-bold">
              AGGREGATE
            </div>
          </button>

          {/* Print Auto Toggle & Help Button - Bottom Right Corner */}
          <div className="absolute bottom-2 right-2 flex items-center gap-3 z-50">
            {/* Print Auto Checkbox */}
            <div 
              onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800/70 border-2 border-blue-600/50 shadow-lg transition-all cursor-pointer backdrop-blur-sm"
              title="Auto print tiket setelah produksi selesai"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                autoPrintEnabled 
                  ? 'bg-blue-600 border-blue-400' 
                  : 'bg-gray-700 border-gray-500'
              }`}>
                {autoPrintEnabled && (
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              <span className="text-white text-sm font-medium">Print</span>
            </div>

            {/* Help Button */}
            <button
              onClick={() => setHelpDialogOpen(true)}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center border-2 border-blue-800 shadow-lg transition-all"
              title="Informasi Developer"
            >
              <HelpCircle className="w-6 h-6 text-white" />
            </button>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default Index;
