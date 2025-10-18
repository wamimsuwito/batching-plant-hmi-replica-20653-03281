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
  dischargedMaterialsCount: number;
  totalMaterialsToDischarge: number;
}

export interface ComponentStates {
  mixer: boolean;
  beltAtas: boolean;
  beltBawah: boolean;
  siloValves: boolean[];
  sandBinValve: boolean; // BIN gate for PASIR (fills hopper during weighing)
  stoneBinValve: boolean; // BIN gate for BATU (fills hopper during weighing)
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
  dischargedMaterialsCount: 0,
  totalMaterialsToDischarge: 4,
};

const initialComponentStates: ComponentStates = {
  mixer: false,
  beltAtas: false,
  beltBawah: false,
  siloValves: [false, false, false, false, false, false],
  sandBinValve: false,
  stoneBinValve: false,
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

export const useProductionSequence = (
  onCementDeduction: (siloId: number, amount: number) => void,
  onAggregateDeduction: (binId: number, amount: number) => void,
  onWaterDeduction: (amount: number) => void,
  relaySettings: RelayConfig[],
  raspberryPi?: { isConnected: boolean; actualWeights: any; sendRelayCommand: any },
  isAutoMode: boolean = false,
  onComplete?: () => void
) => {
  const [productionState, setProductionState] = useState<ProductionState>(initialProductionState);
  const [componentStates, setComponentStates] = useState<ComponentStates>(initialComponentStates);
  const { toast } = useToast();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const mixerIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfigRef = useRef<ProductionConfig | null>(null);

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
  const getTimerValue = (relayName: string, timerNum: 1 | 2 | 3 | 4): number => {
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

  const stopProduction = () => {
    clearAllTimers();
    
    // Clear mixer idle timer if exists
    if (mixerIdleTimerRef.current) {
      clearTimeout(mixerIdleTimerRef.current);
      mixerIdleTimerRef.current = null;
    }
    
    // Turn off all relays
    controlRelay('mixer', false);
    controlRelay('konveyor_atas', false);
    controlRelay('konveyor_bawah', false);
    controlRelay('vibrator', false);
    
    setProductionState(initialProductionState);
    setComponentStates(initialComponentStates);
    toast({
      title: 'Produksi Dihentikan',
      description: 'Sistem kembali ke mode idle',
      variant: 'destructive',
    });
  };

  const startProduction = (config: ProductionConfig) => {
    // Check auto mode
    if (!isAutoMode) {
      toast({
        title: 'Mode Manual',
        description: 'Aktifkan AUTO MODE untuk memulai produksi',
        variant: 'destructive',
      });
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

    toast({
      title: `Produksi Dimulai - Mixing ${config.currentMixing} of ${config.jumlahMixing}`,
      description: 'Memulai proses penimbangan material',
    });

    // t=0s: Mixer ON, Belt Atas ON (cement conveyor)
    // Belt Bawah (BELT-1) will start only when aggregate discharge begins
    setComponentStates(prev => ({ ...prev, mixer: true, beltAtas: true }));
    controlRelay('mixer', true);
    controlRelay('konveyor_atas', true);

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

    console.log('✅ All parallel weighing complete, starting discharge');
    
    // Turn off weighing relays
    setComponentStates(prev => ({
      ...prev,
      sandBinValve: false,
      stoneBinValve: false,
      waterTankValve: false,
    }));
    
    // Deduct cement from silos
    const cementPerSilo = config.targetWeights.semen / config.selectedSilos.length;
    config.selectedSilos.forEach(siloId => {
      onCementDeduction(siloId, cementPerSilo);
    });
    
    // Start discharge sequence
    setTimeout(() => startDischargeSequence(config), 1000);
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
      if (material === 'pasir1' || material === 'pasir2') {
        const binId = material === 'pasir1' ? config.selectedBins.pasir1 : config.selectedBins.pasir2;
        const relayName = getAggregateRelayName(material, binId);
        if (relayName) {
          console.log(`🟢 AGG relay: ${relayName} -> ON (${material}, binId=${binId})`);
          setComponentStates(prev => ({ ...prev, sandBinValve: true }));
          controlRelay(relayName, true);
        }
      } else if (material === 'batu1' || material === 'batu2') {
        const binId = material === 'batu1' ? config.selectedBins.batu1 : config.selectedBins.batu2;
        const relayName = getAggregateRelayName(material, binId);
        if (relayName) {
          console.log(`🟢 AGG relay: ${relayName} -> ON (${material}, binId=${binId})`);
          setComponentStates(prev => ({ ...prev, stoneBinValve: true }));
          controlRelay(relayName, true);
        }
      } else if (material === 'semen') {
        // Semen uses selected silo valve (already opened)
      } else if (material === 'air') {
        // Water tank valve ON (RED blinking) - filling weigh hopper
        setComponentStates(prev => ({ ...prev, waterTankValve: true }));
        controlRelay('water_tank_valve', true);
      }

      const weighingInterval = setInterval(() => {
        // Get current weight
        let currentWeight;
        if (raspberryPi?.isConnected) {
          currentWeight = raspberryPi.actualWeights[material] || startingWeight;
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
          if (material === 'pasir1' || material === 'pasir2') {
            const binId = material === 'pasir1' ? config.selectedBins.pasir1 : config.selectedBins.pasir2;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF (jogging start, binId=${binId})`);
              controlRelay(relayName, false);
            }
            setComponentStates(prev => ({ ...prev, sandBinValve: false }));
          } else if (material === 'batu1' || material === 'batu2') {
            const binId = material === 'batu1' ? config.selectedBins.batu1 : config.selectedBins.batu2;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF (jogging start, binId=${binId})`);
              controlRelay(relayName, false);
            }
            setComponentStates(prev => ({ ...prev, stoneBinValve: false }));
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
            
            if (material === 'pasir1' || material === 'pasir2') {
              const binId = material === 'pasir1' ? config.selectedBins.pasir1 : config.selectedBins.pasir2;
              const relayName = getAggregateRelayName(material, binId);
              if (relayName) {
                console.log(`🟡 AGG relay: ${relayName} -> ${shouldBeOn ? 'ON' : 'OFF'} (jogging, binId=${binId})`);
                setComponentStates(prev => ({ ...prev, sandBinValve: shouldBeOn }));
                controlRelay(relayName, shouldBeOn);
              }
            } else if (material === 'batu1' || material === 'batu2') {
              const binId = material === 'batu1' ? config.selectedBins.batu1 : config.selectedBins.batu2;
              const relayName = getAggregateRelayName(material, binId);
              if (relayName) {
                console.log(`🟡 AGG relay: ${relayName} -> ${shouldBeOn ? 'ON' : 'OFF'} (jogging, binId=${binId})`);
                setComponentStates(prev => ({ ...prev, stoneBinValve: shouldBeOn }));
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
          if (material === 'pasir1' || material === 'pasir2') {
            const binId = material === 'pasir1' ? config.selectedBins.pasir1 : config.selectedBins.pasir2;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF`);
              controlRelay(relayName, false);
              // ONLY turn off sandBinValve if BOTH pasir1 and pasir2 are done
              if (material === 'pasir2' || config.targetWeights.pasir2 === 0) {
                setComponentStates(prev => ({ ...prev, sandBinValve: false }));
              }
            }
          } else if (material === 'batu1' || material === 'batu2') {
            const binId = material === 'batu1' ? config.selectedBins.batu1 : config.selectedBins.batu2;
            const relayName = getAggregateRelayName(material, binId);
            if (relayName) {
              console.log(`🔴 AGG relay: ${relayName} -> OFF`);
              controlRelay(relayName, false);
              // ONLY turn off stoneBinValve if BOTH batu1 and batu2 are done
              if (material === 'batu2' || config.targetWeights.batu2 === 0) {
                setComponentStates(prev => ({ ...prev, stoneBinValve: false }));
              }
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
          } else if (material === 'air') {
            setComponentStates(prev => ({ ...prev, waterTankValve: false }));
            controlRelay('water_tank_valve', false);
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
    // Reset discharge counter
    setProductionState(prev => ({
      ...prev,
      currentStep: 'discharging',
      dischargedMaterialsCount: 0,
      totalMaterialsToDischarge: 4, // pasir, batu, semen, air
    }));
    
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
        
        // Wait 5 seconds, then turn off BELT-1
        const beltDelayTimer = setTimeout(() => {
          console.log('🛑 Turning off BELT-1');
          setComponentStates(prev => ({ ...prev, beltBawah: false }));
          controlRelay('konveyor_bawah', false);
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
      
      // ✅ FIX: Different relay for each hopper
      if (material === 'pasir') {
        controlRelay('dump_material', true);   // Coil 8 - Pasir hopper
        console.log('🟢 DUMP PASIR: dump_material (Coil 8) -> ON');
      } else if (material === 'batu') {
        controlRelay('dump_material_2', true); // Coil 9 - Batu hopper
        console.log('🟢 DUMP BATU: dump_material_2 (Coil 9) -> ON');
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
        } else if (material === 'batu') {
          controlRelay('dump_material_2', false);
          console.log('🔴 DUMP BATU: dump_material_2 (Coil 9) -> OFF');
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
        
        // 🆕 TRIGGER dengan delay 500ms untuk memastikan state ter-update
        setTimeout(() => {
          checkAndStartNextMixingWeighing();
        }, 500);
      }, dischargeDuration);
      addTimer(clearTimer);
    } else if (material === 'semen') {
      console.log('🔴 CEMENT DISCHARGE START - cementValve = TRUE');
      setComponentStates(prev => ({ ...prev, cementValve: true }));
      
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
        
        // 🆕 INCREMENT COUNTER
        setProductionState(prev => {
          const newCount = prev.dischargedMaterialsCount + 1;
          console.log(`✅ Material semen discharged (${newCount}/${prev.totalMaterialsToDischarge})`);
          return {
            ...prev,
            dischargedMaterialsCount: newCount,
          };
        });
        
        // 🆕 TRIGGER dengan delay 500ms untuk memastikan state ter-update
        setTimeout(() => {
          checkAndStartNextMixingWeighing();
        }, 500);
      }, dischargeDuration);
      addTimer(clearTimer);
      
    } else if (material === 'air') {
      // Open weigh hopper discharge valve (GREEN blinking)
      setComponentStates(prev => ({ ...prev, waterHopperValve: true }));
      controlRelay('water_hopper_discharge', true);
      
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
        
        // 🆕 TRIGGER dengan delay 500ms untuk memastikan state ter-update
        setTimeout(() => {
          checkAndStartNextMixingWeighing();
        }, 500);
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

    toast({
      title: 'Mixing Dimulai',
      description: `Waktu mixing: ${config.mixingTime} detik`,
    });

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
    setProductionState(prev => ({ ...prev, currentStep: 'door_cycle', mixerDoorCycle: 1 }));
    
    toast({
      title: 'Mixing Selesai',
      description: 'Memulai siklus pembukaan pintu mixer',
    });

    const doorOpen1 = getTimerValue('Pintu mixer buka', 1) || 2000;
    const doorWait1 = getTimerValue('Pintu mixer buka', 2) || 10000;
    const doorOpen2 = getTimerValue('Pintu mixer buka', 3) || 2000;
    const doorWait2 = getTimerValue('Pintu mixer buka', 4) || 10000;

    // First door cycle: Open
    setComponentStates(prev => ({ ...prev, mixerDoor: true }));
    controlRelay('pintu_mixer_buka', true);
    
    const closeTimer1 = setTimeout(() => {
      // Close
      setComponentStates(prev => ({ ...prev, mixerDoor: false }));
      controlRelay('pintu_mixer_buka', false);
      controlRelay('pintu_mixer_tutup', true);
      
      const waitTimer1 = setTimeout(() => {
        controlRelay('pintu_mixer_tutup', false);
        
        // Second door cycle: Open
        setProductionState(prev => ({ ...prev, mixerDoorCycle: 2 }));
        setComponentStates(prev => ({ ...prev, mixerDoor: true }));
        controlRelay('pintu_mixer_buka', true);
        
        const closeTimer2 = setTimeout(() => {
          // Close
          setComponentStates(prev => ({ ...prev, mixerDoor: false }));
          controlRelay('pintu_mixer_buka', false);
          controlRelay('pintu_mixer_tutup', true);
          
          const completeTimer = setTimeout(() => {
            controlRelay('pintu_mixer_tutup', false);
            completeProduction();
          }, doorWait2);
          addTimer(completeTimer);
        }, doorOpen2);
        addTimer(closeTimer2);
      }, doorWait1);
      addTimer(waitTimer1);
    }, doorOpen1);
    addTimer(closeTimer1);
  };

  const checkAndStartNextMixingWeighing = () => {
    setProductionState(prev => {
      const { currentMixing, jumlahMixing, dischargedMaterialsCount, totalMaterialsToDischarge, nextMixingReady, currentStep } = prev;
      
      console.log(`🔍 Checking next mixing: discharged ${dischargedMaterialsCount}/${totalMaterialsToDischarge}, current=${currentMixing}, total=${jumlahMixing}`);
      
      // Cek apakah masih ada mixing berikutnya
      if (currentMixing >= jumlahMixing) {
        console.log('ℹ️ No more mixing cycles');
        return prev;
      }
      
      // Cek apakah semua material sudah discharge DAN penimbangan berikutnya belum jalan
      if (dischargedMaterialsCount >= totalMaterialsToDischarge && !nextMixingReady && currentStep !== 'complete') {
        console.log(`🔄 All materials discharged! Starting weighing for Mixing ${currentMixing + 1}`);
        
        toast({
          title: `Penimbangan Mixing ${currentMixing + 1} of ${jumlahMixing}`,
          description: 'Material mixing berikutnya sedang ditimbang',
        });
        
        // Refill aggregate bins SEBELUM penimbangan berikutnya
        console.log('🔄 Refilling aggregate bins for next mixing...');
        onAggregateDeduction(1, -10000);
        onAggregateDeduction(2, -10000);
        onAggregateDeduction(3, -10000);
        onAggregateDeduction(4, -10000);
        
        // Mulai penimbangan mixing berikutnya
        setTimeout(() => {
          if (lastConfigRef.current) {
            setComponentStates(prev => ({ ...prev, beltAtas: true }));
            controlRelay('konveyor_atas', true);

            setComponentStates(prev => ({
              ...prev,
              siloValves: prev.siloValves.map((_, idx) => 
                lastConfigRef.current!.selectedSilos.includes(idx + 1)
              ),
            }));
            lastConfigRef.current.selectedSilos.forEach(id => controlRelay(`silo_${id}`, true));

            startWeighingWithJogging(lastConfigRef.current);
          }
        }, 1000);
        
        // Update state dengan nextMixingReady = true
        return {
          ...prev,
          nextMixingReady: true,
        };
      }
      
      return prev;
    });
  };

  const completeProduction = () => {
    // ✅ FIX: Use setState callback to get latest state
    setProductionState(prev => {
      const { currentMixing, jumlahMixing, nextMixingReady } = prev;
      
      console.log(`🏁 completeProduction called: currentMixing=${currentMixing}, jumlahMixing=${jumlahMixing}, nextMixingReady=${nextMixingReady}`);
      
      // Check if there are more mixings to do
      if (currentMixing < jumlahMixing) {
        // Cek apakah penimbangan mixing berikutnya sudah selesai
        if (nextMixingReady) {
          console.log(`✅ Mixing ${currentMixing} selesai, material Mixing ${currentMixing + 1} sudah siap di hopper`);
          
          toast({
            title: `Mixing ${currentMixing + 1} of ${jumlahMixing}`,
            description: 'Memulai proses discharge material ke mixer',
          });
          
          // Langsung discharge material yang sudah ditimbang
          setTimeout(() => {
            if (lastConfigRef.current) {
              startDischargeSequence(lastConfigRef.current);
            }
          }, 2000);
          
          // Return updated state
          return {
            ...prev,
            currentMixing: prev.currentMixing + 1,
            currentStep: 'discharging',
            nextMixingReady: false,
            dischargedMaterialsCount: 0, // Reset counter for next cycle
          };
        
        } else {
          // Material mixing berikutnya belum siap (edge case: mixing terlalu cepat)
          console.log(`⚠️ Mixing ${currentMixing} selesai, tapi material Mixing ${currentMixing + 1} belum siap. Menunggu...`);
          
          toast({
            title: 'Menunggu Material',
            description: `Penimbangan Mixing ${currentMixing + 1} masih berlangsung`,
          });
          
          // Poll setiap 2 detik sampai material siap
          const waitInterval = setInterval(() => {
            setProductionState(checkPrev => {
              if (checkPrev.nextMixingReady) {
                clearInterval(waitInterval);
                console.log('✅ Material ready! Starting discharge for next mixing');
                
                setTimeout(() => {
                  if (lastConfigRef.current) {
                    startDischargeSequence(lastConfigRef.current);
                  }
                }, 1000);
                
                return {
                  ...checkPrev,
                  currentMixing: checkPrev.currentMixing + 1,
                  currentStep: 'discharging',
                  isWaitingForMixer: false,
                  nextMixingReady: false,
                  dischargedMaterialsCount: 0,
                };
              }
              return checkPrev;
            });
          }, 2000);
          addInterval(waitInterval);
          
          // Return waiting state
          return { 
            ...prev, 
            isWaitingForMixer: true,
            currentStep: 'waiting_for_material',
          };
        }
        
      } else {
        // All mixing cycles complete
        console.log(`✅ Semua mixing selesai (${jumlahMixing} mixing)`);
        
        // AKTIVASI KLAKSON - 1 detik
        console.log('🔔 Activating klakson for 1 second');
        controlRelay('klakson', true);
        setComponentStates(prevComp => ({ ...prevComp, klakson: true }));
        
        // Toast notification untuk klakson
        toast({
          title: '🔔 Klakson Aktif',
          description: 'Semua produksi selesai - klakson berbunyi 1 detik',
          duration: 2000,
        });
        
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
          
          toast({
            title: 'Bin Refilled',
            description: 'Aggregate bins telah diisi ulang ke 10000 kg',
          });
        }, 2000);

        toast({
          title: 'Produksi Selesai',
          description: `${jumlahMixing} mixing berhasil diselesaikan`,
        });
        
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
            
            toast({
              title: 'Mixer Dimatikan',
              description: 'Mixer dimatikan setelah 5 menit idle',
            });
          }, 5 * 60 * 1000); // 5 minutes
          
          toast({
            title: 'Sistem Siap',
            description: 'Mixer akan tetap hidup selama 5 menit. Mulai batch baru atau mixer akan mati otomatis.',
          });
          
          // Call completion callback to reset UI state (stop button, enable start button)
          if (onComplete) {
            onComplete();
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
  };
};
