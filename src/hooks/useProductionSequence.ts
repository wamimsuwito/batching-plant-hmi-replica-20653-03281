import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ProductionConfig {
  selectedSilos: number[];
  selectedBins: {
    pasir1: number; // bin ID (1 or 2)
    pasir2: number; // bin ID (1 or 2)
    batu1: number;  // bin ID (3 or 4)
    batu2: number;  // bin ID (3 or 4)
  };
  targetWeights: {
    pasir1: number;
    pasir2: number;
    batu1: number;
    batu2: number;
    semen: number;
    air: number;
    additive: number;
  };
  mixingTime: number; // in seconds
  jumlahMixing: number; // Total number of mixings
  currentMixing: number; // Current mixing number (1, 2, 3, etc.)
}

export interface ProductionState {
  isProducing: boolean;
  currentStep: string;
  selectedSilos: number[];
  selectedBins: {
    pasir1: number; // bin ID (1 or 2)
    pasir2: number; // bin ID (1 or 2)
    batu1: number;  // bin ID (3 or 4)
    batu2: number;  // bin ID (3 or 4)
  };
  targetWeights: {
    pasir1: number;
    pasir2: number;
    batu1: number;
    batu2: number;
    semen: number;
    air: number;
    additive: number;
  };
  currentWeights: {
    pasir: number; // Cumulative weight for display (pasir1 + pasir2)
    batu: number;  // Cumulative weight for display (batu1 + batu2)
    semen: number;
    air: number;
    additive: number;
  };
  weighingComplete: {
    pasir1: boolean;
    pasir2: boolean;
    batu1: boolean;
    batu2: boolean;
    semen: boolean;
    air: boolean;
  };
  mixingTimeRemaining: number;
  mixerDoorCycle: number;
  hopperFillLevels: {
    pasir: number; // Cumulative fill level (pasir1 + pasir2)
    batu: number;  // Cumulative fill level (batu1 + batu2)
    air: number;
  };
  cumulativeTargets: {
    pasir: number; // pasir1 + pasir2 for display
    batu: number;  // batu1 + batu2 for display
  };
  jumlahMixing: number;
  currentMixing: number;
  isWaitingForMixer: boolean;
  nextMixingReady: boolean;
  nextMixingWeighingComplete: boolean; // Track if next mixing weighing is done
  dischargedMaterialsCount: number;
  totalMaterialsToDischarge: number;
  activityLog: string[]; // Activity log (max 4 entries)
  isDoorMoving: boolean; // Indicates if door is actively moving (relay ON)
}

export interface ComponentStates {
  mixer: boolean;
  beltAtas: boolean;
  beltBawah: boolean;
  siloValves: boolean[];
  sandBin1Valve: boolean; // Bin Pasir 1 gate
  sandBin2Valve: boolean; // Bin Pasir 2 gate
  stoneBin1Valve: boolean; // Bin Batu 1 gate
  stoneBin2Valve: boolean; // Bin Batu 2 gate
  hopperValvePasir: boolean; // HOPPER discharge valve (A1) - only during discharge
  hopperValveBatu: boolean; // HOPPER discharge valve (A2) - only during discharge
  waterTankValve: boolean; // Tank AIR valve to weigh hopper (RED blinking during weighing)
  waterHopperValve: boolean; // Weigh hopper AIR discharge valve to mixer (GREEN during discharge)
  cementValve: boolean; // Discharge valve for SEMEN from weigh hopper
  additiveValve: boolean;
  mixerDoor: boolean;
  vibrator: boolean;
  klakson: boolean; // Klakson relay (Modbus Coil 15)
}

interface RelayConfig {
  name: string;
  relayNumber: string;
  modbusCoil: string;
  timer1: string;
  timer2: string;
  timer3: string;
  timer4: string;
}

interface JoggingSettings {
  trigger: number;      // % dari target
  jogingOn: number;     // detik
  jogingOff: number;    // detik
  toleransi: number;    // kg
}

interface MixingSequenceSettings {
  pasir: { mixing: number, timer: number };
  batu: { mixing: number, timer: number };
  semen: { mixing: number, timer: number };
  air: { mixing: number, timer: number };
}

const initialProductionState: ProductionState = {
  isProducing: false,
  currentStep: 'idle',
  selectedSilos: [],
  selectedBins: { pasir1: 0, pasir2: 0, batu1: 0, batu2: 0 },
  targetWeights: { pasir1: 0, pasir2: 0, batu1: 0, batu2: 0, semen: 0, air: 0, additive: 0 },
  currentWeights: { pasir: 0, batu: 0, semen: 0, air: 0, additive: 0 },
  weighingComplete: { pasir1: false, pasir2: false, batu1: false, batu2: false, semen: false, air: false },
  mixingTimeRemaining: 0,
  mixerDoorCycle: 0,
  hopperFillLevels: { pasir: 0, batu: 0, air: 0 },
  cumulativeTargets: { pasir: 0, batu: 0 },
  jumlahMixing: 1,
  currentMixing: 1,
  isWaitingForMixer: false,
  nextMixingReady: false,
  nextMixingWeighingComplete: false,
  dischargedMaterialsCount: 0,
  totalMaterialsToDischarge: 4,
  activityLog: [],
  isDoorMoving: false,
};

const initialComponentStates: ComponentStates = {
  mixer: false,
  beltAtas: false,
  beltBawah: false,
  siloValves: [false, false, false, false, false, false],
  sandBin1Valve: false,
  sandBin2Valve: false,
  stoneBin1Valve: false,
  stoneBin2Valve: false,
  hopperValvePasir: false,
  hopperValveBatu: false,
  waterTankValve: false,
  waterHopperValve: false,
  cementValve: false,
  additiveValve: false,
  mixerDoor: false,
  vibrator: false,
  klakson: false,
};

// Helper function for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useProductionSequence = (
  onCementDeduction: (siloId: number, amount: number) => void,
  onAggregateDeduction: (binId: number, amount: number) => void,
  onWaterDeduction: (amount: number) => void,
  relaySettings: RelayConfig[],
  raspberryPi?: { isConnected: boolean; actualWeights: any; sendRelayCommand: any },
  isAutoMode: boolean = false,
  onComplete?: (finalWeights?: { pasir: number; batu: number; semen: number; air: number }) => void
) => {
  const [productionState, setProductionState] = useState<ProductionState>(initialProductionState);
  const [componentStates, setComponentStates] = useState<ComponentStates>(initialComponentStates);
  const { toast } = useToast();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const mixerIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfigRef = useRef<ProductionConfig | null>(null);
  const finalSnapshotRef = useRef({ pasir: 0, batu: 0, semen: 0, air: 0 });
  const isPausedRef = useRef(false);
  const pausedStateSnapshot = useRef<{
    step: string;
    weights: any;
    weighingComplete?: any;
    timers: any;
  } | null>(null);

  // Helper function to add activity log
  const addActivityLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    const logMessage = `[${timestamp}] ${message}`;
    
    setProductionState(prev => {
      const newLog = [logMessage, ...prev.activityLog].slice(0, 4); // Keep only last 4
      return { ...prev, activityLog: newLog };
    });
  };

  // Load jogging settings
  const getJoggingSettings = (materialName: string): JoggingSettings => {
    const saved = localStorage.getItem('material_jogging_settings');
    console.log(`🔍 Loading jogging settings for: ${materialName}`);
    
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        
        // ✅ FIX: Map material parameter names to jogging menu names
        const materialMapping: { [key: string]: string } = {
          'pasir1': 'Pasir 1',
          'pasir2': 'Pasir 2',
          'batu1': 'Batu 1',
          'batu2': 'Batu 2',
          'semen': 'Semen',
          'air': 'Air',
          'additive': 'Additive',
        };
        
        const joggingMenuName = materialMapping[materialName.toLowerCase()] || materialName;
        console.log(`🔍 Mapped to jogging menu name: ${joggingMenuName}`);
        
        const material = settings.find((m: any) => 
          m.nama === joggingMenuName
        );
        
        if (material) {
          const joggingConfig = {
            trigger: parseFloat(material.trigger) || 70,
            jogingOn: parseFloat(material.jogingOn) || 1,
            jogingOff: parseFloat(material.jogingOff) || 2,
            toleransi: parseFloat(material.toleransi) || 5,
          };
          console.log(`✅ Found jogging settings for ${materialName}:`, joggingConfig);
          return joggingConfig;
        } else {
          console.log(`⚠️ No jogging settings found for ${materialName} (${joggingMenuName})`);
        }
      } catch (error) {
        console.error('Error loading jogging settings:', error);
      }
    } else {
      console.log('⚠️ No saved jogging settings found in localStorage');
    }
    
    // Default values
    const defaultConfig = { trigger: 70, jogingOn: 1, jogingOff: 2, toleransi: 5 };
    console.log(`⚠️ Using default jogging settings for ${materialName}:`, defaultConfig);
    return defaultConfig;
  };

  // Load mixing sequence settings
  const getMixingSequence = (): MixingSequenceSettings => {
    const saved = localStorage.getItem('mixing_sequence_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading mixing sequence:', error);
      }
    }
    // Default: all materials in group 1, no timer delays
    return {
      pasir: { mixing: 1, timer: 0 },
      batu: { mixing: 1, timer: 0 },
      semen: { mixing: 1, timer: 0 },
      air: { mixing: 1, timer: 0 },
    };
  };

  // Helper to get relay name for aggregate bins
  const getAggregateRelayName = (
    material: 'pasir1' | 'pasir2' | 'batu1' | 'batu2',
    binId: number
  ): string | null => {
    if (material === 'pasir1' || material === 'pasir2') {
      // Pasir 1 (binId=1) → pintu_pasir_1
      // Pasir 2 (binId=2) → pintu_pasir_2
      if (binId === 1) return 'pintu_pasir_1';
      if (binId === 2) return 'pintu_pasir_2';
    } else if (material === 'batu1' || material === 'batu2') {
      // Batu 1 (binId=3) → pintu_batu_1
      // Batu 2 (binId=4) → pintu_batu_2
      if (binId === 3) return 'pintu_batu_1';
      if (binId === 4) return 'pintu_batu_2';
    }
    return null;
  };

  const controlRelay = (relayName: string, state: boolean) => {
    console.log(`🔌 Relay Control: ${relayName} = ${state ? 'ON' : 'OFF'}`);
    
    if (raspberryPi?.isConnected) {
      const relay = relaySettings.find(r => r.name.toLowerCase().replace(/ /g, '_') === relayName.toLowerCase());
      const modbusCoil = relay ? parseInt(relay.modbusCoil) : undefined;
      console.log(`📍 Modbus Coil: ${modbusCoil}`);
      raspberryPi.sendRelayCommand(relayName, state, modbusCoil);
    } else {
      console.log('⚠️ Controller not connected - running in simulation mode');
    }
  };

  // Get relay timing settings
  const getTimerValue = (relayName: string, timerNum: 1 | 2 | 3 | 4 | 5 | 6): number => {
    const relay = relaySettings.find(r => r.name === relayName);
    if (!relay) return 0;
    const value = relay[`timer${timerNum}`];
    return parseInt(value) || 0;
  };

  // Clear all timers and intervals
  const clearAllTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    intervalsRef.current.forEach(interval => clearInterval(interval));
    timersRef.current = [];
    intervalsRef.current = [];
  };

  // Add timer to tracking
  const addTimer = (timer: NodeJS.Timeout) => {
    timersRef.current.push(timer);
  };

  // Add interval to tracking
  const addInterval = (interval: NodeJS.Timeout) => {
    intervalsRef.current.push(interval);
  };

  const pauseProduction = () => {
    console.log('⏸️ PAUSE - Saving current state...');
    
    // Simpan snapshot state saat ini termasuk weighing progress
    pausedStateSnapshot.current = {
      step: productionState.currentStep,
      weights: { ...productionState.currentWeights },
      weighingComplete: { ...productionState.weighingComplete },
      timers: {
        mixingTimeRemaining: productionState.mixingTimeRemaining,
        currentMixing: productionState.currentMixing,
      }
    };
    
    console.log('📸 Saved state on pause:', pausedStateSnapshot.current);
    
    // Matikan semua relay
    setComponentStates(initialComponentStates);
    
    // Turn off all relays
    controlRelay('mixer', false);
    controlRelay('konveyor_atas', false);
    controlRelay('konveyor_bawah', false);
    controlRelay('vibrator', false);
    
    // Stop semua timer
    clearAllTimers();
    
    isPausedRef.current = true;
    
    addActivityLog('⏸️ Produksi di-PAUSE');
  };

  const resumeProduction = () => {
    console.log('▶️ RESUME - Continuing from:', pausedStateSnapshot.current);
    
    if (!pausedStateSnapshot.current || !lastConfigRef.current) {
      toast({
        title: "❌ Error",
        description: "Tidak ada state untuk di-resume",
        variant: "destructive"
      });
      return;
    }
    
    isPausedRef.current = false;
    
    const snapshot = pausedStateSnapshot.current;
    const config = lastConfigRef.current;
    
    // Restore state with saved weighing progress
    setProductionState(prev => ({
      ...prev,
      currentStep: snapshot.step,
      currentWeights: snapshot.weights,
      weighingComplete: snapshot.weighingComplete || prev.weighingComplete,
      mixingTimeRemaining: snapshot.timers.mixingTimeRemaining,
      currentMixing: snapshot.timers.currentMixing,
    }));
    
    addActivityLog('▶️ Produksi di-RESUME');
    
    // Restart mixer dan belt atas
    setComponentStates(prev => ({ ...prev, mixer: true, beltAtas: true }));
    controlRelay('mixer', true);
    controlRelay('konveyor_atas', true);
    
    // Continue dari step terakhir
    switch (snapshot.step) {
      case 'weighing':
        console.log('▶️ Resuming weighing - weights preserved, continuing');
        // Just restart weighing - the currentWeights are already restored
        // Note: This will continue accumulating from current weights
        startWeighingWithJogging(config);
        break;
      case 'discharging':
        console.log('▶️ Resuming from discharge step');
        startDischargeSequence(config);
        break;
      case 'mixing':
        console.log('▶️ Resuming from mixing step');
        // Set mixing time remaining first, then start mixing
        setProductionState(prev => ({ 
          ...prev, 
          mixingTimeRemaining: snapshot.timers.mixingTimeRemaining 
        }));
        startMixing(config);
        break;
      case 'door_cycle':
        console.log('▶️ Resuming from door cycle step');
        startDoorCycle();
        break;
      default:
        console.log('▶️ Unknown step, restarting from weighing');
        startWeighingWithJogging(config);
    }
  };

  const stopProduction = () => {
    clearAllTimers();
    
    // Clear mixer idle timer if exists
    if (mixerIdleTimerRef.current) {
      clearTimeout(mixerIdleTimerRef.current);
      mixerIdleTimerRef.current = null;
    }
    
    // Reset pause state
    isPausedRef.current = false;
    pausedStateSnapshot.current = null;
    
    // Turn off all relays
    controlRelay('mixer', false);
    controlRelay('konveyor_atas', false);
    controlRelay('konveyor_bawah', false);
    controlRelay('vibrator', false);
    
    setProductionState(initialProductionState);
    setComponentStates(initialComponentStates);
    // Toast removed - silent operation
  };

  const startProduction = (config: ProductionConfig) => {
    // Check auto mode
    if (!isAutoMode) {
      // Toast removed - silent operation
      return;
    }

    clearAllTimers();
    
    // Clear mixer idle timer - production started again
    if (mixerIdleTimerRef.current) {
      console.log('🔄 New batch started - cancelling mixer idle timer');
      clearTimeout(mixerIdleTimerRef.current);
      mixerIdleTimerRef.current = null;
    }
    
    // Save config for sequential mixing
    lastConfigRef.current = config;
    
    setProductionState({
      ...initialProductionState,
      isProducing: true,
      currentStep: 'weighing',
      selectedSilos: config.selectedSilos,
      selectedBins: config.selectedBins,
      targetWeights: config.targetWeights,
      cumulativeTargets: {
        pasir: config.targetWeights.pasir1 + config.targetWeights.pasir2,
        batu: config.targetWeights.batu1 + config.targetWeights.batu2,
      },
      mixingTimeRemaining: config.mixingTime,
      jumlahMixing: config.jumlahMixing,
      currentMixing: config.currentMixing,
    });

    // Toast removed - silent operation

    // t=0s: Mixer ON, Belt Atas ON (cement conveyor)
    // Belt Bawah (BELT-1) will start only when aggregate discharge begins
    setComponentStates(prev => ({ ...prev, mixer: true, beltAtas: true }));
    controlRelay('mixer', true);
    controlRelay('konveyor_atas', true);
    addActivityLog('🔄 Mixer ON');
    addActivityLog('🔄 Belt Atas ON');

    // t=1s: Start weighing all materials
    const weighingTimer = setTimeout(() => {
      // Open selected silo valves for cement
      setComponentStates(prev => ({
        ...prev,
        siloValves: prev.siloValves.map((_, idx) => 
          config.selectedSilos.includes(idx + 1)
        ),
      }));
      config.selectedSilos.forEach(id => controlRelay(`silo_${id}`, true));

      // Start weighing for all materials with jogging
      startWeighingWithJogging(config);
    }, 1000);
    addTimer(weighingTimer);
  };

  const startWeighingWithJogging = async (config: ProductionConfig) => {
    console.log('🚀 Starting PARALLEL weighing for all materials');
    console.log('Target weights:', config.targetWeights);
    console.log('Selected bins:', config.selectedBins);

    const weighingStatus: { [key: string]: boolean } = {};

    // PARALLEL WEIGHING WITH 4 GROUPS:
    // Group 1: Pasir (1 → 2 cumulative)
    // Group 2: Batu (1 → 2 cumulative)
    // Group 3: Semen (independent)
    // Group 4: Air (independent)

    // Create parallel weighing groups
    const weighPasirSequence = async () => {
      // Pasir 1
      if (config.targetWeights.pasir1 > 0 && config.selectedBins.pasir1 > 0) {
        console.log('📦 GROUP PASIR: Weighing PASIR 1...');
        await weighMaterialWithJogging('pasir1', config.targetWeights.pasir1, config, weighingStatus, 0);
        weighingStatus.pasir1 = true;
        
        // ⏱️ JEDA 2 DETIK untuk stabilisasi hopper pasir
        if (config.targetWeights.pasir2 > 0 && config.selectedBins.pasir2 > 0) {
          console.log('⏳ Waiting 2 seconds for hopper stabilization...');
          await delay(2000);
        }
      } else {
        weighingStatus.pasir1 = true;
        setProductionState(prev => ({ ...prev, weighingComplete: { ...prev.weighingComplete, pasir1: true } }));
      }
      
      // Pasir 2 (cumulative)
      if (config.targetWeights.pasir2 > 0 && config.selectedBins.pasir2 > 0) {
        console.log('📦 GROUP PASIR: Weighing PASIR 2 (cumulative)...');
        const pasir1Weight = config.targetWeights.pasir1 || 0;
        await weighMaterialWithJogging(
          'pasir2',
          config.targetWeights.pasir1 + config.targetWeights.pasir2,
          config,
          weighingStatus,
          pasir1Weight
        );
        weighingStatus.pasir2 = true;
      } else {
        weighingStatus.pasir2 = true;
        setProductionState(prev => ({ ...prev, weighingComplete: { ...prev.weighingComplete, pasir2: true } }));
      }
      console.log('✅ Pasir sequence complete');
    };

    const weighBatuSequence = async () => {
      // Batu 1
      if (config.targetWeights.batu1 > 0 && config.selectedBins.batu1 > 0) {
        console.log('📦 GROUP BATU: Weighing BATU 1...');
        await weighMaterialWithJogging('batu1', config.targetWeights.batu1, config, weighingStatus, 0);
        weighingStatus.batu1 = true;
        
        // ⏱️ JEDA 2 DETIK untuk stabilisasi hopper batu
        if (config.targetWeights.batu2 > 0 && config.selectedBins.batu2 > 0) {
          console.log('⏳ Waiting 2 seconds for hopper stabilization...');
          await delay(2000);
        }
      } else {
        weighingStatus.batu1 = true;
        setProductionState(prev => ({ ...prev, weighingComplete: { ...prev.weighingComplete, batu1: true } }));
      }
      
      // Batu 2 (cumulative)
      if (config.targetWeights.batu2 > 0 && config.selectedBins.batu2 > 0) {
        console.log('📦 GROUP BATU: Weighing BATU 2 (cumulative)...');
        const batu1Weight = config.targetWeights.batu1 || 0;
        await weighMaterialWithJogging(
          'batu2',
          config.targetWeights.batu1 + config.targetWeights.batu2,
          config,
          weighingStatus,
          batu1Weight
        );
        weighingStatus.batu2 = true;
      } else {
        weighingStatus.batu2 = true;
        setProductionState(prev => ({ ...prev, weighingComplete: { ...prev.weighingComplete, batu2: true } }));
      }
      console.log('✅ Batu sequence complete');
    };

    const weighSemen = async () => {
      if (config.targetWeights.semen > 0) {
        console.log('📦 GROUP SEMEN: Weighing SEMEN...');
        await weighMaterialWithJogging('semen', config.targetWeights.semen, config, weighingStatus, 0);
        weighingStatus.semen = true;
        console.log('✅ Semen weighing complete');
      } else {
        weighingStatus.semen = true;
        setProductionState(prev => ({ ...prev, weighingComplete: { ...prev.weighingComplete, semen: true } }));
      }
    };

    const weighAir = async () => {
      if (config.targetWeights.air > 0) {
        console.log('📦 GROUP AIR: Weighing AIR...');
        await weighMaterialWithJogging('air', config.targetWeights.air, config, weighingStatus, 0);
        weighingStatus.air = true;
        console.log('✅ Air weighing complete');
      } else {
        weighingStatus.air = true;
        setProductionState(prev => ({ ...prev, weighingComplete: { ...prev.weighingComplete, air: true } }));
      }
    };

    // Execute all 4 groups in parallel
    await Promise.all([
      weighPasirSequence(),
      weighBatuSequence(),
      weighSemen(),
      weighAir()
    ]);

    console.log('✅ All parallel weighing complete');
    
    // Turn off weighing relays
    setComponentStates(prev => ({
      ...prev,
      sandBin1Valve: false,
      sandBin2Valve: false,
      stoneBin1Valve: false,
      stoneBin2Valve: false,
      waterTankValve: false,
    }));
    
    // Deduct cement from silos
    const cementPerSilo = config.targetWeights.semen / config.selectedSilos.length;
    config.selectedSilos.forEach(siloId => {
      onCementDeduction(siloId, cementPerSilo);
    });
    
    // Toast removed - silent operation
    
    // ✅ Check if we're waiting for mixer to finish before discharging
    let shouldStartDischarge = true;
    setProductionState(prev => {
      if (prev.isWaitingForMixer) {
        console.log('⏸️  Weighing complete, but WAITING for mixer door to close before discharge');
        shouldStartDischarge = false;
        return {
          ...prev,
          nextMixingWeighingComplete: true,
        };
      }
      return prev;
    });
    
    // ✅ Only start discharge if NOT waiting for mixer
    if (shouldStartDischarge) {
      console.log('✅ Starting discharge sequence');
      setTimeout(() => startDischargeSequence(config), 1000);
    } else {
      console.log('⏸️  Discharge blocked - waiting for mixer to complete');
    }
  };

  const weighMaterialWithJogging = (
    material: 'pasir1' | 'pasir2' | 'batu1' | 'batu2' | 'semen' | 'air',
    targetWeight: number,
    config: ProductionConfig,
    weighingStatus: { [key: string]: boolean },
    startingWeight: number = 0 // NEW: for cumulative weighing
  ) => {
    return new Promise<void>((resolve) => {
      console.log(`⚖️ Weighing ${material}: target=${targetWeight.toFixed(1)}kg, starting=${startingWeight.toFixed(1)}kg`);
      
      const jogging = getJoggingSettings(material);
      const triggerWeight = targetWeight * (jogging.trigger / 100);
      const finalWeight = targetWeight - jogging.toleransi;

      // Phase 1: Normal weighing until trigger %
      let phase = 1;
      let joggingState = false;
      let joggingCycleStart = 0;
      let simulatedWeight = startingWeight; // Start from startingWeight (not 0)

      // Open material relay
      if (material === 'pasir1') {
        const binId = config.selectedBins.pasir1;
        const relayName = getAggregateRelayName(material, binId);
        if (relayName) {
          console.log(`🟢 AGG relay: ${relayName} -> ON (${material}, binId=${binId})`);
          setComponentStates(prev => ({ ...prev, sandBin1Valve: true }));
          controlRelay(relayName, true);
          addActivityLog('🟢 Pasir 1 ON');
        }
      } else if (material === 'pasir2') {
        const binId = config.selectedBins.pasir2;
        const relayName = getAggregateRelayName(material, binId);
        if (relayName) {
          console.log(`🟢 AGG relay: ${relayName} -> ON (${material}, binId=${binId})`);
          setComponentStates(prev => ({ ...prev, sandBin2Valve: true }));
          controlRelay(relayName, true);
          addActivityLog('🟢 Pasir 2 ON');
        }
      } else if (material === 'batu1') {
        const binId = config.selectedBins.batu1;
        const relayName = getAggregateRelayName(material, binId);
        if (relayName) {
          console.log(`🟢 AGG relay: ${relayName} -> ON (${material}, binId=${binId})`);
          setComponentStates(prev => ({ ...prev, stoneBin1Valve: true }));
          controlRelay(relayName, true);
          addActivityLog('🟢 Batu 1 ON');
        }
      } else if (material === 'batu2') {
        const binId = config.selectedBins.batu2;
        const relayName = getAggregateRelayName(material, binId);
        if (relayName) {
          console.log(`🟢 AGG relay: ${relayName} -> ON (${material}, binId=${binId})`);
          setComponentStates(prev => ({ ...prev, stoneBin2Valve: true }));
          controlRelay(relayName, true);
          addActivityLog('🟢 Batu 2 ON');
        }
      } else if (material === 'semen') {
        // Semen uses selected silo valve (already opened)
      } else if (material === 'air') {
        // Water tank valve ON (RED blinking) - filling weigh hopper
        setComponentStates(prev => ({ ...prev, waterTankValve: true }));
        controlRelay('water_tank_valve', true);
        addActivityLog('🟢 Air ON');
      }

      const weighingInterval = setInterval(() => {
        // Get current weight
        let currentWeight;
        if (raspberryPi?.isConnected) {
          // Map material names to actualWeights channels
          const channel = material.startsWith('pasir') ? 'pasir' : 
                         material.startsWith('batu') ? 'batu' : 
                         material === 'semen' ? 'semen' : 
                         material === 'air' ? 'air' : material;
          currentWeight = raspberryPi.actualWeights[channel] || startingWeight;
        } else {
          // SIMULATION MODE - Realistic weighing simulation
          if (phase === 1) {
            // Phase 1: Fast weighing until trigger point
            let flowRate = 50; // kg/s
            if (material === 'semen') flowRate = 30;
            if (material === 'air') flowRate = 20;
            
            const increment = (flowRate / 5); // Divided by 5 because we check every 200ms
            simulatedWeight = Math.min(simulatedWeight + increment + (Math.random() * 2 - 1), triggerWeight);
            currentWeight = simulatedWeight;
            
            // Animate bin deduction in real-time for aggregates
            if (material === 'pasir1' || material === 'pasir2') {
              const binId = material === 'pasir1' ? config.selectedBins.pasir1 : config.selectedBins.pasir2;
              onAggregateDeduction(binId, increment);
            } else if (material === 'batu1' || material === 'batu2') {
              const binId = material === 'batu1' ? config.selectedBins.batu1 : config.selectedBins.batu2;
              onAggregateDeduction(binId, increment);
            }
          } else if (phase === 2) {
            // Phase 2: Jogging - slower, controlled increments
            const now = Date.now();
            const cycleTime = (jogging.jogingOn + jogging.jogingOff) * 1000;
            const timeSinceCycleStart = now - joggingCycleStart;
            const position = timeSinceCycleStart % cycleTime;
            const shouldBeOn = position < (jogging.jogingOn * 1000);
            
            // Only increment when valve is ON
            if (shouldBeOn && joggingState) {
              // Slower flow during jogging: ~5-10kg per ON cycle
              const joggingIncrement = (10 / (jogging.jogingOn * 5)); // Spread over jogging ON duration
              simulatedWeight = Math.min(simulatedWeight + joggingIncrement + (Math.random() * 0.5), finalWeight);
              
              // Animate bin deduction during jogging for aggregates
              if (material === 'pasir1' || material === 'pasir2') {
                const binId = material === 'pasir1' ? config.selectedBins.pasir1 : config.selectedBins.pasir2;
                onAggregateDeduction(binId, joggingIncrement);
              } else if (material === 'batu1' || material === 'batu2') {
                const binId = material === 'batu1' ? config.selectedBins.batu1 : config.selectedBins.batu2;
                onAggregateDeduction(binId, joggingIncrement);
              }
            }
            currentWeight = simulatedWeight;
          }
        }

        // Update weight display and hopper fill level (cumulative for aggregates)
        if (material === 'pasir1' || material === 'pasir2') {
          const percentage = Math.min(100, (currentWeight / (config.targetWeights.pasir1 + config.targetWeights.pasir2)) * 100);
          setProductionState(prev => ({
            ...prev,
            currentWeights: { ...prev.currentWeights, pasir: currentWeight },
            hopperFillLevels: { ...prev.hopperFillLevels, pasir: percentage },
          }));
        } else if (material === 'batu1' || material === 'batu2') {
          const percentage = Math.min(100, (currentWeight / (config.targetWeights.batu1 + config.targetWeights.batu2)) * 100);
          setProductionState(prev => ({
            ...prev,
            currentWeights: { ...prev.currentWeights, batu: currentWeight },
            hopperFillLevels: { ...prev.hopperFillLevels, batu: percentage },
          }));
        } else {
          setProductionState(prev => ({
            ...prev,
            currentWeights: { ...prev.currentWeights, [material]: currentWeight },
            hopperFillLevels: {
              ...prev.hopperFillLevels,
              ...(material === 'air' ? { air: Math.min(100, (currentWeight / targetWeight) * 100) } : {})
            }
          }));
        }

        // Phase 1: Normal weighing
        if (phase === 1 && currentWeight >= triggerWeight) {
          console.log(`🎯 TRIGGER reached for ${material}: ${currentWeight.toFixed(1)}kg / ${triggerWeight.toFixed(1)}kg, starting jogging`);
          phase = 2;
          joggingCycleStart = Date.now();
          
          // Turn off relay
          if (material === 'pasir1') {
            const binId = config.selectedBins.pasir1;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF (jogging start, binId=${binId})`);
              controlRelay(relayName, false);
            }
            setComponentStates(prev => ({ ...prev, sandBin1Valve: false }));
          } else if (material === 'pasir2') {
            const binId = config.selectedBins.pasir2;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF (jogging start, binId=${binId})`);
              controlRelay(relayName, false);
            }
            setComponentStates(prev => ({ ...prev, sandBin2Valve: false }));
          } else if (material === 'batu1') {
            const binId = config.selectedBins.batu1;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF (jogging start, binId=${binId})`);
              controlRelay(relayName, false);
            }
            setComponentStates(prev => ({ ...prev, stoneBin1Valve: false }));
          } else if (material === 'batu2') {
            const binId = config.selectedBins.batu2;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF (jogging start, binId=${binId})`);
              controlRelay(relayName, false);
            }
            setComponentStates(prev => ({ ...prev, stoneBin2Valve: false }));
          } else if (material === 'air') {
            controlRelay('water_tank_valve', false);
            setComponentStates(prev => ({ ...prev, waterTankValve: false }));
          }
          
          // Update status to show jogging
          setProductionState(prev => ({
            ...prev,
            currentStep: `jogging-${material}`
          }));
        }

        // Phase 2: Jogging
        if (phase === 2 && currentWeight < finalWeight) {
          // Toggle relay based on jogging timer
          const now = Date.now();
          const timeSinceCycleStart = now - joggingCycleStart;
          const cycleTime = (jogging.jogingOn + jogging.jogingOff) * 1000;
          const position = timeSinceCycleStart % cycleTime;
          const shouldBeOn = position < (jogging.jogingOn * 1000);

          if (shouldBeOn !== joggingState) {
            joggingState = shouldBeOn;
            console.log(`🔄 ${material} jogging: ${shouldBeOn ? 'ON' : 'OFF'} (${currentWeight.toFixed(1)}kg / ${finalWeight.toFixed(1)}kg)`);
            
            if (material === 'pasir1') {
              const binId = config.selectedBins.pasir1;
              const relayName = getAggregateRelayName(material, binId);
              if (relayName) {
                console.log(`🟡 AGG relay: ${relayName} -> ${shouldBeOn ? 'ON' : 'OFF'} (jogging, binId=${binId})`);
                setComponentStates(prev => ({ ...prev, sandBin1Valve: shouldBeOn }));
                controlRelay(relayName, shouldBeOn);
              }
            } else if (material === 'pasir2') {
              const binId = config.selectedBins.pasir2;
              const relayName = getAggregateRelayName(material, binId);
              if (relayName) {
                console.log(`🟡 AGG relay: ${relayName} -> ${shouldBeOn ? 'ON' : 'OFF'} (jogging, binId=${binId})`);
                setComponentStates(prev => ({ ...prev, sandBin2Valve: shouldBeOn }));
                controlRelay(relayName, shouldBeOn);
              }
            } else if (material === 'batu1') {
              const binId = config.selectedBins.batu1;
              const relayName = getAggregateRelayName(material, binId);
              if (relayName) {
                console.log(`🟡 AGG relay: ${relayName} -> ${shouldBeOn ? 'ON' : 'OFF'} (jogging, binId=${binId})`);
                setComponentStates(prev => ({ ...prev, stoneBin1Valve: shouldBeOn }));
                controlRelay(relayName, shouldBeOn);
              }
            } else if (material === 'batu2') {
              const binId = config.selectedBins.batu2;
              const relayName = getAggregateRelayName(material, binId);
              if (relayName) {
                console.log(`🟡 AGG relay: ${relayName} -> ${shouldBeOn ? 'ON' : 'OFF'} (jogging, binId=${binId})`);
                setComponentStates(prev => ({ ...prev, stoneBin2Valve: shouldBeOn }));
                controlRelay(relayName, shouldBeOn);
              }
            } else if (material === 'air') {
              // Water tank valve toggled (RED blinking during jogging)
              setComponentStates(prev => ({ ...prev, waterTankValve: shouldBeOn }));
              controlRelay('water_tank_valve', shouldBeOn);
            }
          }
        }

        // Check if target weight reached
        if (currentWeight >= targetWeight - jogging.toleransi) {
          clearInterval(weighingInterval);
          
          // Close relay
          if (material === 'pasir1') {
            const binId = config.selectedBins.pasir1;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF`);
              controlRelay(relayName, false);
              setComponentStates(prev => ({ ...prev, sandBin1Valve: false }));
              addActivityLog('🔴 Pasir 1 OFF');
            }
          } else if (material === 'pasir2') {
            const binId = config.selectedBins.pasir2;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF`);
              controlRelay(relayName, false);
              setComponentStates(prev => ({ ...prev, sandBin2Valve: false }));
              addActivityLog('🔴 Pasir 2 OFF');
            }
          } else if (material === 'batu1') {
            const binId = config.selectedBins.batu1;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF`);
              controlRelay(relayName, false);
              setComponentStates(prev => ({ ...prev, stoneBin1Valve: false }));
              addActivityLog('🔴 Batu 1 OFF');
            }
          } else if (material === 'batu2') {
            const binId = config.selectedBins.batu2;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF`);
              controlRelay(relayName, false);
              setComponentStates(prev => ({ ...prev, stoneBin2Valve: false }));
              addActivityLog('🔴 Batu 2 OFF');
            }
          } else if (material === 'semen') {
            // ✅ FIX: Turn off silo valves after cement weighing complete
            console.log('🔴 SEMEN: Closing all silo valves');
            config.selectedSilos.forEach(siloId => {
              controlRelay(`silo_${siloId}`, false);
            });
            setComponentStates(prev => ({
              ...prev,
              siloValves: prev.siloValves.map(() => false)
            }));
            addActivityLog('🔴 Semen OFF');
          } else if (material === 'air') {
            setComponentStates(prev => ({ ...prev, waterTankValve: false }));
            controlRelay('water_tank_valve', false);
            addActivityLog('🔴 Air OFF');
          }
          
          weighingStatus[material] = true;
          setProductionState(prev => ({
            ...prev,
            weighingComplete: { ...prev.weighingComplete, [material]: true }
          }));
          console.log(`✅ ${material} weighing complete: ${currentWeight.toFixed(1)}kg`);
          resolve();
        }
      }, 200);
      
      addInterval(weighingInterval);
    });
  };

  const startDischargeSequence = (config: ProductionConfig) => {
    // Capture final weights BEFORE discharge starts
    setProductionState(prev => {
      finalSnapshotRef.current = {
        pasir: Math.round(prev.currentWeights.pasir),
        batu: Math.round(prev.currentWeights.batu),
        semen: Math.round(prev.currentWeights.semen),
        air: Math.round(prev.currentWeights.air),
      };
      console.log('📸 Final weights snapshot:', finalSnapshotRef.current);
      
      return {
        ...prev,
        currentStep: 'discharging',
        dischargedMaterialsCount: 0,
        totalMaterialsToDischarge: 4, // pasir, batu, semen, air
      };
    });
    
    toast({
      title: 'Penimbangan Selesai',
      description: 'Memulai proses discharge material',
    });

    const mixingSequence = getMixingSequence();
    
    // Group materials by mixing number
    const groups: { [key: number]: { material: string, timer: number, targetWeight: number }[] } = {};
    
    // ✅ FIX: Calculate cumulative weights for pasir and batu
    const materialTargets = {
      pasir: (config.targetWeights.pasir1 || 0) + (config.targetWeights.pasir2 || 0),
      batu: (config.targetWeights.batu1 || 0) + (config.targetWeights.batu2 || 0),
      semen: config.targetWeights.semen || 0,
      air: config.targetWeights.air || 0,
    };
    
    (['pasir', 'batu', 'semen', 'air'] as const).forEach(material => {
      const targetWeight = materialTargets[material];
      console.log(`🎯 Discharge check: ${material} = ${targetWeight}kg`);
      
      if (targetWeight > 0) {
        const mixingNum = mixingSequence[material].mixing;
        const timer = mixingSequence[material].timer;
        
        if (!groups[mixingNum]) {
          groups[mixingNum] = [];
        }
        groups[mixingNum].push({ material, timer, targetWeight });
        console.log(`✅ Added ${material} to discharge group ${mixingNum}`);
      }
    });

    // Sort groups by mixing number
    const sortedGroups = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b);

    console.log('🔄 Discharge groups:', sortedGroups, groups);

    // Track when aggregate discharge completes
    let aggregateDischargeEnd = 0;
    let groupDelay = 0;
    
    sortedGroups.forEach((groupNum) => {
      const groupMaterials = groups[groupNum];
      
      // Calculate max discharge time for THIS group
      let maxGroupDuration = 0;
      
      // Within each group, apply individual timer delays
      groupMaterials.forEach(({ material, timer, targetWeight }) => {
        const totalDelay = groupDelay + (timer * 1000);
        const dischargeDuration = Math.max(10000, targetWeight * 30);
        
        // Track when aggregate finishes
        if (material === 'pasir' || material === 'batu') {
          const endTime = totalDelay + dischargeDuration;
          if (endTime > aggregateDischargeEnd) {
            aggregateDischargeEnd = endTime;
          }
        }
        
        // Track max duration in this group
        const materialEndTime = (timer * 1000) + dischargeDuration;
        if (materialEndTime > maxGroupDuration) {
          maxGroupDuration = materialEndTime;
        }
        
        const dischargeTimer = setTimeout(() => {
          console.log(`💧 Discharging ${material} from group ${groupNum}`);
          dischargeMaterial(material, targetWeight);
        }, totalDelay);
        addTimer(dischargeTimer);
      });

      // NEXT group starts AFTER this group finishes
      groupDelay += maxGroupDuration;
    });

    // Turn off BELT-1 after aggregate discharge + 5 second delay
    if (aggregateDischargeEnd > 0) {
      const beltOffTimer = setTimeout(() => {
        console.log('⏸️ Aggregate discharge complete, waiting 5 seconds...');
        
        // Turn off vibrator and hopper valves
        setComponentStates(prev => ({
          ...prev,
          vibrator: false,
          hopperValvePasir: false,
          hopperValveBatu: false,
        }));
        controlRelay('vibrator', false);
        addActivityLog('🔴 Vibrator OFF');
        
        // Wait 5 seconds, then turn off BELT-1
        const beltDelayTimer = setTimeout(() => {
          console.log('🛑 Turning off BELT-1');
          setComponentStates(prev => ({ ...prev, beltBawah: false }));
          controlRelay('konveyor_bawah', false);
          addActivityLog('🔴 Belt Bawah OFF');
        }, 5000);
        addTimer(beltDelayTimer);
        
      }, aggregateDischargeEnd);
      addTimer(beltOffTimer);
    }

    // Start mixing AFTER aggregate discharge + 5 second delay
    const mixingStartDelay = aggregateDischargeEnd > 0 
      ? aggregateDischargeEnd + 5000  // Wait for aggregate + 5s delay
      : groupDelay + 2000;              // Or just normal delay if no aggregate

    const mixingTimer = setTimeout(() => {
      // Turn off cement/water valves
      setComponentStates(prev => ({
        ...prev,
        cementValve: false,
        waterHopperValve: false,
      }));
      
      startMixing(config);
    }, mixingStartDelay);
    addTimer(mixingTimer);
  };

  const dischargeMaterial = (material: string, targetWeight: number) => {
    // Turn on vibrator and BELT-1 for aggregate discharge
    if (material === 'pasir' || material === 'batu') {
      setComponentStates(prev => ({ 
        ...prev, 
        vibrator: true,
        beltBawah: true, // ← BELT-1 turns ON when aggregate starts dumping
        hopperValvePasir: material === 'pasir' ? true : prev.hopperValvePasir,
        hopperValveBatu: material === 'batu' ? true : prev.hopperValveBatu,
      }));
      controlRelay('vibrator', true);
      controlRelay('konveyor_bawah', true); // ← Turn on BELT-1
      addActivityLog('🔄 Vibrator ON');
      addActivityLog('🔄 Belt Bawah ON');
      
      // ✅ FIX: Different relay for each hopper
      if (material === 'pasir') {
        controlRelay('dump_material', true);   // Coil 8 - Pasir hopper
        console.log('🟢 DUMP PASIR: dump_material (Coil 8) -> ON');
        addActivityLog('🟢 Dump Pasir ON');
      } else if (material === 'batu') {
        controlRelay('dump_material_2', true); // Coil 9 - Batu hopper
        console.log('🟢 DUMP BATU: dump_material_2 (Coil 9) -> ON');
        addActivityLog('🟢 Dump Batu ON');
      }
      
      // Animate hopper depletion from 100% to 0%
      const dischargeDuration = Math.max(10000, targetWeight * 30); // 10-15 seconds
      const animationSteps = 20;
      const stepDuration = dischargeDuration / animationSteps;
      
      const animationInterval = setInterval(() => {
        setProductionState(prev => {
          const currentFill = prev.hopperFillLevels[material as 'pasir' | 'batu'];
          const currentWeight = prev.currentWeights[material as 'pasir' | 'batu'];
          const newFill = Math.max(0, currentFill - (100 / animationSteps));
          const newWeight = Math.max(0, currentWeight - (targetWeight / animationSteps));
          
          return {
            ...prev,
            hopperFillLevels: {
              ...prev.hopperFillLevels,
              [material]: newFill
            },
            currentWeights: {
              ...prev.currentWeights,
              [material]: newWeight
            }
          };
        });
      }, stepDuration);
      
      addInterval(animationInterval);
      
      // Clear hopper and weight to 0 at end of discharge
      const clearTimer = setTimeout(() => {
        clearInterval(animationInterval);
        setProductionState(prev => ({
          ...prev,
          hopperFillLevels: {
            ...prev.hopperFillLevels,
            [material]: 0
          },
          currentWeights: {
            ...prev.currentWeights,
            [material]: 0
          }
        }));
        
        // ✅ FIX: Turn off the correct relay for each hopper
        if (material === 'pasir') {
          controlRelay('dump_material', false);
          console.log('🔴 DUMP PASIR: dump_material (Coil 8) -> OFF');
          addActivityLog('🔴 Dump Pasir OFF');
        } else if (material === 'batu') {
          controlRelay('dump_material_2', false);
          console.log('🔴 DUMP BATU: dump_material_2 (Coil 9) -> OFF');
          addActivityLog('🔴 Dump Batu OFF');
        }
        
        setComponentStates(prev => ({ 
          ...prev,
          hopperValvePasir: material === 'pasir' ? false : prev.hopperValvePasir,
          hopperValveBatu: material === 'batu' ? false : prev.hopperValveBatu,
        }));
        
        // 🆕 INCREMENT COUNTER
        setProductionState(prev => {
          const newCount = prev.dischargedMaterialsCount + 1;
          console.log(`✅ Material ${material} discharged (${newCount}/${prev.totalMaterialsToDischarge})`);
          return {
            ...prev,
            dischargedMaterialsCount: newCount,
          };
        });
        
        // ✅ Check if all materials discharged, then start weighing for next mixing
        checkAndStartNextMixingWeighing();
      }, dischargeDuration);
      addTimer(clearTimer);
    } else if (material === 'semen') {
      console.log('🔴 CEMENT DISCHARGE START - cementValve = TRUE');
      setComponentStates(prev => ({ ...prev, cementValve: true }));
      addActivityLog('🟢 Dump Semen ON');
      
      // Animate semen weight reduction (150kg → 0kg)
      const dischargeDuration = Math.max(8000, targetWeight * 40);
      const animationSteps = 20;
      const stepDuration = dischargeDuration / animationSteps;
      
      console.log(`⏱️  Cement discharge duration: ${dischargeDuration}ms (${(dischargeDuration/1000).toFixed(1)}s)`);
      
      const animationInterval = setInterval(() => {
        setProductionState(prev => {
          const currentWeight = prev.currentWeights.semen;
          const newWeight = Math.max(0, currentWeight - (targetWeight / animationSteps));
          
          if (Math.round(newWeight) % 20 === 0) {
            console.log(`📉 Cement weight: ${newWeight.toFixed(1)}kg`);
          }
          
          return {
            ...prev,
            currentWeights: {
              ...prev.currentWeights,
              semen: newWeight
            }
          };
        });
      }, stepDuration);
      
      addInterval(animationInterval);
      
      // Reset weight to 0 at end
      const clearTimer = setTimeout(() => {
        clearInterval(animationInterval);
        setProductionState(prev => ({
          ...prev,
          currentWeights: {
            ...prev.currentWeights,
            semen: 0
          }
        }));
        console.log('✅ Cement discharge animation complete');
        
        // Matikan LED valve semen saat hopper kosong
        console.log('🔴 CEMENT DISCHARGE END (hopper empty) - cementValve = FALSE');
        setComponentStates(prev => ({ ...prev, cementValve: false }));
        addActivityLog('🔴 Dump Semen OFF');
        
        // 🆕 INCREMENT COUNTER
        setProductionState(prev => {
          const newCount = prev.dischargedMaterialsCount + 1;
          console.log(`✅ Material semen discharged (${newCount}/${prev.totalMaterialsToDischarge})`);
          return {
            ...prev,
            dischargedMaterialsCount: newCount,
          };
        });
        
        // ✅ Check if all materials discharged, then start weighing for next mixing
        checkAndStartNextMixingWeighing();
      }, dischargeDuration);
      addTimer(clearTimer);
      
    } else if (material === 'air') {
      // Open weigh hopper discharge valve (GREEN blinking)
      setComponentStates(prev => ({ ...prev, waterHopperValve: true }));
      controlRelay('water_hopper_discharge', true);
      addActivityLog('🟢 Dump Air ON');
      
      // Animate weigh hopper depletion (fill level 100% → 0%)
      const dischargeDuration = Math.max(3000, targetWeight * 30);
      const animationSteps = 20;
      const stepDuration = dischargeDuration / animationSteps;
      
      const animationInterval = setInterval(() => {
        setProductionState(prev => {
          const currentFill = prev.hopperFillLevels.air;
          const currentWeight = prev.currentWeights.air;
          const newFill = Math.max(0, currentFill - (100 / animationSteps));
          const newWeight = Math.max(0, currentWeight - (targetWeight / animationSteps));
          
          return {
            ...prev,
            hopperFillLevels: {
              ...prev.hopperFillLevels,
              air: newFill
            },
            currentWeights: {
              ...prev.currentWeights,
              air: newWeight
            }
          };
        });
      }, stepDuration);
      
      addInterval(animationInterval);
      
      // Clear hopper and close valve at end
      const clearTimer = setTimeout(() => {
        clearInterval(animationInterval);
        
        // Hopper empty
        setProductionState(prev => ({
          ...prev,
          hopperFillLevels: { ...prev.hopperFillLevels, air: 0 },
          currentWeights: { ...prev.currentWeights, air: 0 }
        }));
        
        // Close discharge valve
        controlRelay('water_hopper_discharge', false);
        setComponentStates(prev => ({ ...prev, waterHopperValve: false }));
        addActivityLog('🔴 Dump Air OFF');
        
        // Deduct water from tank AFTER discharge complete
        onWaterDeduction(targetWeight);
        
        // 🆕 INCREMENT COUNTER
        setProductionState(prev => {
          const newCount = prev.dischargedMaterialsCount + 1;
          console.log(`✅ Material air discharged (${newCount}/${prev.totalMaterialsToDischarge})`);
          return {
            ...prev,
            dischargedMaterialsCount: newCount,
          };
        });
        
        // ✅ Check if all materials discharged, then start weighing for next mixing
        checkAndStartNextMixingWeighing();
      }, dischargeDuration);
      addTimer(clearTimer);
    }

    // Keep valve open for discharge duration (estimate based on weight)
    // NOTE: Cement valve is now closed in its own clearTimer (line 798) after animation completes
    // Water valve is already closed in its clearTimer (line 880)
    // Aggregate hopper valves are closed in their clearTimer (line 744)
  };

  const startMixing = (config: ProductionConfig) => {
    setProductionState(prev => ({
      ...prev,
      currentStep: 'mixing',
      mixingTimeRemaining: config.mixingTime,
    }));

    // Toast removed - silent operation

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setProductionState(prev => {
        const newTime = prev.mixingTimeRemaining - 1;
        
        if (newTime <= 0) {
          clearInterval(countdownInterval);
          return prev;
        }
        
        return { ...prev, mixingTimeRemaining: newTime };
      });
    }, 1000);
    addInterval(countdownInterval);

    // After mixing completes, start door cycle (KEEP MIXER RUNNING)
    const mixingCompleteTimer = setTimeout(() => {
      console.log('✅ Mixing complete! Starting door cycle (mixer stays ON)');
      
      // DON'T turn off mixer yet - will turn off after 5 min idle
      
      // Start door cycle
      setTimeout(() => {
        startDoorCycle();
      }, 1000);
    }, config.mixingTime * 1000);
    addTimer(mixingCompleteTimer);
  };

  const startDoorCycle = () => {
    setProductionState(prev => ({ ...prev, currentStep: 'door_cycle', mixerDoorCycle: 1, isDoorMoving: true }));
    
    // Ambil semua timer values dari localStorage
    const bukaOn1 = getTimerValue('Pintu mixer buka', 1) || 2000;    // Buka 7cm
    const bukaDiam1 = getTimerValue('Pintu mixer buka', 2) || 5000;  // Diam di 7cm
    const bukaOn2 = getTimerValue('Pintu mixer buka', 3) || 2000;    // Buka +17cm = 24cm
    const bukaDiam2 = getTimerValue('Pintu mixer buka', 4) || 5000;  // Diam di 24cm
    const bukaOn3 = getTimerValue('Pintu mixer buka', 5) || 2000;    // Buka +6cm = 30cm
    const bukaDiam3 = getTimerValue('Pintu mixer buka', 6) || 5000;  // Diam di 30cm
    const tutupDuration = getTimerValue('Pintu mixer tutup', 1) || 4000; // Tutup penuh

    // ==================== CYCLE 1: Buka 7cm ====================
    setComponentStates(prev => ({ ...prev, mixerDoor: true }));
    controlRelay('pintu_mixer_buka', true);
    addActivityLog('🚪 Mixer Door: Opening 7cm (Cycle 1)');
    
    const timer1 = setTimeout(() => {
      // OFF relay BUKA, pintu TETAP TERBUKA di 7cm
      controlRelay('pintu_mixer_buka', false);
      setProductionState(prev => ({ ...prev, isDoorMoving: false }));
      addActivityLog('🚪 Mixer Door: Holding at 7cm (DIAM)');
      
      // DIAM 1 - tidak ada relay yang ON, pintu tetap 7cm
      const timer2 = setTimeout(() => {
        
        // ==================== CYCLE 2: Buka +17cm = 24cm ====================
        setProductionState(prev => ({ ...prev, mixerDoorCycle: 2, isDoorMoving: true }));
        controlRelay('pintu_mixer_buka', true);
        addActivityLog('🚪 Mixer Door: Opening to 24cm (Cycle 2)');
        
        const timer3 = setTimeout(() => {
          // OFF relay BUKA, pintu TETAP TERBUKA di 24cm
          controlRelay('pintu_mixer_buka', false);
          setProductionState(prev => ({ ...prev, isDoorMoving: false }));
          addActivityLog('🚪 Mixer Door: Holding at 24cm (DIAM)');
          
          // DIAM 2 - tidak ada relay yang ON, pintu tetap 24cm
          const timer4 = setTimeout(() => {
            
            // ==================== CYCLE 3: Buka +6cm = 30cm FULL ====================
            setProductionState(prev => ({ ...prev, mixerDoorCycle: 3, isDoorMoving: true }));
            controlRelay('pintu_mixer_buka', true);
            addActivityLog('🚪 Mixer Door: Opening FULL 30cm (Cycle 3)');
            
            const timer5 = setTimeout(() => {
              // OFF relay BUKA, pintu TETAP TERBUKA FULL di 30cm
              controlRelay('pintu_mixer_buka', false);
              setProductionState(prev => ({ ...prev, isDoorMoving: false }));
              addActivityLog('🚪 Mixer Door: FULL OPEN at 30cm (DIAM)');
              
              // DIAM 3 - tidak ada relay yang ON, pintu tetap 30cm
              const timer6 = setTimeout(() => {
                
                // ==================== TUTUP: Tutup dari 30cm ke 0cm ====================
                setComponentStates(prev => ({ ...prev, mixerDoor: false }));
                setProductionState(prev => ({ ...prev, isDoorMoving: true }));
                controlRelay('pintu_mixer_tutup', true);
                addActivityLog('🚪 Mixer Door: CLOSING from 30cm to 0cm');
                
                const timer7 = setTimeout(() => {
                  controlRelay('pintu_mixer_tutup', false);
                  setProductionState(prev => ({ ...prev, isDoorMoving: false }));
                  addActivityLog('🚪 Mixer Door: CLOSED completely');
                  completeProduction();
                }, tutupDuration);
                addTimer(timer7);
                
              }, bukaDiam3); // Tunggu Timer 6 (DIAM 3)
              addTimer(timer6);
            }, bukaOn3); // Tunggu Timer 5 (Buka 3)
            addTimer(timer5);
          }, bukaDiam2); // Tunggu Timer 4 (DIAM 2)
          addTimer(timer4);
        }, bukaOn2); // Tunggu Timer 3 (Buka 2)
        addTimer(timer3);
      }, bukaDiam1); // Tunggu Timer 2 (DIAM 1)
      addTimer(timer2);
    }, bukaOn1); // Tunggu Timer 1 (Buka 1)
    addTimer(timer1);
  };

  // ⚠️ DEPRECATED: Function no longer used - weighing for next cycle now starts in completeProduction()
  // after mixer door is fully closed, ensuring proper sequential operation
  // ✅ NEW: Check if all materials discharged, then start weighing for next mixing
  // But do NOT discharge yet - wait for mixer door to close
  const checkAndStartNextMixingWeighing = () => {
    setProductionState(prev => {
      const { dischargedMaterialsCount, totalMaterialsToDischarge, currentMixing, jumlahMixing, nextMixingReady, currentStep } = prev;
      
      // Cek apakah semua material sudah discharge DAN penimbangan berikutnya belum jalan
      if (dischargedMaterialsCount >= totalMaterialsToDischarge && !nextMixingReady && currentStep !== 'complete') {
        if (currentMixing < jumlahMixing) {
          console.log(`🔄 All materials discharged! Starting WEIGHING (NOT discharge) for Mixing ${currentMixing + 1}`);
          console.log(`⏸️  Material will wait to discharge until mixer door closes`);
          
          // Refill aggregate bins SEBELUM penimbangan berikutnya
          console.log('🔄 Refilling aggregate bins for next mixing...');
          onAggregateDeduction(1, -10000);
          onAggregateDeduction(2, -10000);
          onAggregateDeduction(3, -10000);
          onAggregateDeduction(4, -10000);
          
          // Mulai penimbangan mixing berikutnya
          setTimeout(() => {
            if (lastConfigRef.current) {
              console.log(`✅ Starting Weighing Cycle ${currentMixing + 1} (discharge will wait)`);
              
              // Turn on belt atas (cement conveyor)
              setComponentStates(prevStates => ({ ...prevStates, beltAtas: true }));
              controlRelay('konveyor_atas', true);

              // Turn on selected silos
              setComponentStates(prevStates => ({
                ...prevStates,
                siloValves: prevStates.siloValves.map((_, idx) => 
                  lastConfigRef.current!.selectedSilos.includes(idx + 1)
                ),
              }));
              lastConfigRef.current.selectedSilos.forEach(id => controlRelay(`silo_${id}`, true));

              // Start weighing with jogging
              startWeighingWithJogging(lastConfigRef.current);
            }
          }, 1000);
          
          // Update state dengan nextMixingReady = true dan isWaitingForMixer = true
          return {
            ...prev,
            nextMixingReady: true,
            isWaitingForMixer: true, // Block discharge until mixer ready
          };
        }
      }
      
      return prev;
    });
  };

  const completeProduction = () => {
    // ✅ NEW FIX: Use setState callback to get latest state
    setProductionState(prev => {
      const { currentMixing, jumlahMixing, nextMixingWeighingComplete } = prev;
      
      console.log(`🏁 completeProduction called: currentMixing=${currentMixing}, jumlahMixing=${jumlahMixing}`);
      console.log(`🚪 Pintu mixer sudah tertutup penuh!`);
      
      // Check if there are more mixings to do
      if (currentMixing < jumlahMixing) {
        console.log(`🔄 Mixer door closed, checking if next mixing weighing is complete`);
        
        // Check if weighing for next mixing is already complete
        if (nextMixingWeighingComplete) {
          console.log(`✅ Next mixing weighing ALREADY COMPLETE! Starting discharge now`);
          
          // Trigger discharge sequence
          setTimeout(() => {
            if (lastConfigRef.current) {
              startDischargeSequence(lastConfigRef.current);
            }
          }, 1000);
          
          // Return updated state for next mixing
          return {
            ...prev,
            currentMixing: prev.currentMixing + 1,
            currentStep: 'discharging',
            dischargedMaterialsCount: 0, // Reset counter for next cycle
            isWaitingForMixer: false, // No longer waiting
            nextMixingWeighingComplete: false, // Reset flag
            nextMixingReady: false, // Reset flag
            weighingComplete: {
              pasir1: false,
              pasir2: false,
              batu1: false,
              batu2: false,
              semen: false,
              air: false,
            },
          };
        } else {
          // Weighing not done yet, start it now (old behavior for safety)
          console.log(`⚠️  Next mixing weighing NOT complete yet, starting now`);
          
          // Refill aggregate bins SEBELUM penimbangan berikutnya
          console.log('🔄 Refilling aggregate bins for next mixing...');
          onAggregateDeduction(1, -10000);
          onAggregateDeduction(2, -10000);
          onAggregateDeduction(3, -10000);
          onAggregateDeduction(4, -10000);
          
          // Mulai penimbangan mixing berikutnya SETELAH delay
          setTimeout(() => {
            if (lastConfigRef.current) {
              console.log(`✅ Starting Weighing Cycle ${currentMixing + 1}`);
              
              // Turn on belt atas (cement conveyor)
              setComponentStates(prev => ({ ...prev, beltAtas: true }));
              controlRelay('konveyor_atas', true);

              // Turn on selected silos
              setComponentStates(prev => ({
                ...prev,
                siloValves: prev.siloValves.map((_, idx) => 
                  lastConfigRef.current!.selectedSilos.includes(idx + 1)
                ),
              }));
              lastConfigRef.current.selectedSilos.forEach(id => controlRelay(`silo_${id}`, true));

              // Start weighing with jogging
              startWeighingWithJogging(lastConfigRef.current);
            }
          }, 1000);
          
          // Return updated state for next mixing
          return {
            ...prev,
            currentMixing: prev.currentMixing + 1,
            currentStep: 'weighing',
            dischargedMaterialsCount: 0, // Reset counter for next cycle
            weighingComplete: {
              pasir1: false,
              pasir2: false,
              batu1: false,
              batu2: false,
              semen: false,
              air: false,
            },
          };
        }
        
      } else {
        // All mixing cycles complete
        console.log(`✅ Semua mixing selesai (${jumlahMixing} mixing)`);
        
        // AKTIVASI KLAKSON - 1 detik
        console.log('🔔 Activating klakson for 1 second');
        controlRelay('klakson', true);
        setComponentStates(prevComp => ({ ...prevComp, klakson: true }));
        
        // Toast removed - silent operation
        
        const klaksonTimer = setTimeout(() => {
          controlRelay('klakson', false);
          setComponentStates(prevComp => ({ ...prevComp, klakson: false }));
        }, 1000);
        addTimer(klaksonTimer);
        
        // Refill aggregate bins to 10000 kg after 2 seconds
        setTimeout(() => {
          console.log('🔄 Refilling aggregate bins to 10000 kg...');
          onAggregateDeduction(1, -10000); // Bin 1 (PASIR)
          onAggregateDeduction(2, -10000); // Bin 2 (BATU 1)
          onAggregateDeduction(3, -10000); // Bin 3 (BATU 2)
          onAggregateDeduction(4, -10000); // Bin 4
          
          // Toast removed - silent operation
        }, 2000);

        // Toast removed - silent operation
        
        // Reset after 2 seconds and call onComplete callback
        const resetTimer = setTimeout(() => {
          setProductionState(initialProductionState);
          // DON'T reset componentStates - keep mixer running
          
          // Start 5-minute idle timer for mixer
          console.log('⏰ Starting 5-minute idle timer for mixer...');
          mixerIdleTimerRef.current = setTimeout(() => {
            console.log('⏰ 5 minutes idle - turning off mixer');
            setComponentStates(prevComp => ({ ...prevComp, mixer: false }));
            controlRelay('mixer', false);
            mixerIdleTimerRef.current = null;
            
            // Toast removed - silent operation
          }, 5 * 60 * 1000); // 5 minutes
          
          // Toast removed - silent operation
          
          // Call completion callback with final weights snapshot
          if (onComplete) {
            console.log('✅ Calling onComplete with snapshot:', finalSnapshotRef.current);
            onComplete(finalSnapshotRef.current);
          }
        }, 2000);
        addTimer(resetTimer);
        
        // Return complete state
        return { ...prev, currentStep: 'complete' };
      }
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (mixerIdleTimerRef.current) {
        clearTimeout(mixerIdleTimerRef.current);
      }
    };
  }, []);

  return {
    productionState,
    componentStates,
    startProduction,
    stopProduction,
    pauseProduction,
    resumeProduction,
  };
};
