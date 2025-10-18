import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ProductionConfig {
  selectedSilos: number[];
  selectedBins: {
    pasir: number; // bin ID (1-4)
    batu: number;  // bin ID (1-4)
  };
  targetWeights: {
    pasir: number;
    batu: number;
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
  targetWeights: {
    pasir: number;
    batu: number;
    semen: number;
    air: number;
    additive: number;
  };
  currentWeights: {
    pasir: number;
    batu: number;
    semen: number;
    air: number;
    additive: number;
  };
  weighingComplete: {
    pasir: boolean;
    batu: boolean;
    semen: boolean;
    air: boolean;
  };
  mixingTimeRemaining: number;
  mixerDoorCycle: number;
  hopperFillLevels: {
    pasir: number;
    batu: number;
    air: number;
  };
  jumlahMixing: number;
  currentMixing: number;
  isWaitingForMixer: boolean; // TRUE jika material mixing berikutnya sudah ditimbang, nunggu mixer
  nextMixingReady: boolean;   // TRUE jika penimbangan mixing berikutnya selesai
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
  targetWeights: { pasir: 0, batu: 0, semen: 0, air: 0, additive: 0 },
  currentWeights: { pasir: 0, batu: 0, semen: 0, air: 0, additive: 0 },
  weighingComplete: { pasir: false, batu: false, semen: false, air: false },
  mixingTimeRemaining: 0,
  mixerDoorCycle: 0,
  hopperFillLevels: { pasir: 0, batu: 0, air: 0 },
  jumlahMixing: 1,
  currentMixing: 1,
  isWaitingForMixer: false,
  nextMixingReady: false,
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
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        const material = settings.find((m: any) => 
          m.nama.toLowerCase().includes(materialName.toLowerCase())
        );
        if (material) {
          return {
            trigger: parseFloat(material.trigger) || 70,
            jogingOn: parseFloat(material.jogingOn) || 1,
            jogingOff: parseFloat(material.jogingOff) || 2,
            toleransi: parseFloat(material.toleransi) || 5,
          };
        }
      } catch (error) {
        console.error('Error loading jogging settings:', error);
      }
    }
    // Default values
    return { trigger: 70, jogingOn: 1, jogingOff: 2, toleransi: 5 };
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
      targetWeights: config.targetWeights,
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

  const startWeighingWithJogging = (config: ProductionConfig) => {
    const materials = ['pasir', 'batu', 'semen', 'air'] as const;
    const weighingStatus: { [key: string]: boolean } = {};

    materials.forEach(material => {
      if (config.targetWeights[material] > 0) {
        weighingStatus[material] = false;
        weighMaterialWithJogging(material, config.targetWeights[material], config, weighingStatus);
      } else {
        setProductionState(prev => ({
          ...prev,
          weighingComplete: { ...prev.weighingComplete, [material]: true }
        }));
      }
    });

    // Check completion every 500ms
    const checkInterval = setInterval(() => {
      const allComplete = materials.every(m => 
        config.targetWeights[m] === 0 || weighingStatus[m]
      );
      
      if (allComplete) {
        clearInterval(checkInterval);
        console.log('✅ All weighing complete, starting discharge');
        
        // Turn off weighing relays
        controlRelay('konveyor_atas', false);
        setComponentStates(prev => ({
          ...prev,
          beltAtas: false,
          siloValves: [false, false, false, false, false, false],
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
      }
    }, 500);
    addInterval(checkInterval);
  };

  const weighMaterialWithJogging = (
    material: 'pasir' | 'batu' | 'semen' | 'air',
    targetWeight: number,
    config: ProductionConfig,
    weighingStatus: { [key: string]: boolean }
  ) => {
    const jogging = getJoggingSettings(material);
    const triggerWeight = targetWeight * (jogging.trigger / 100);
    const finalWeight = targetWeight - jogging.toleransi;
    
    console.log(`⚖️ Weighing ${material}: trigger=${triggerWeight.toFixed(1)}kg, final=${finalWeight.toFixed(1)}kg, jogging=${jogging.jogingOn}s/${jogging.jogingOff}s`);

    // Phase 1: Normal weighing until trigger %
    let phase = 1;
    let joggingState = false;
    let joggingCycleStart = 0;
    let simulatedWeight = 0;

    // Open material relay
    if (material === 'pasir') {
      setComponentStates(prev => ({ ...prev, sandBinValve: true }));
      controlRelay('pintu_pasir_1', true);
    } else if (material === 'batu') {
      setComponentStates(prev => ({ ...prev, stoneBinValve: true }));
      controlRelay('pintu_batu_1', true);
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
        currentWeight = raspberryPi.actualWeights[material] || 0;
      } else {
        // SIMULATION MODE - Realistic weighing simulation
        if (phase === 1) {
          // Phase 1: Fast weighing until trigger point
          // Simulate realistic flow rate: ~50kg/second for aggregate, ~30kg/s for cement, ~20kg/s for water
          let flowRate = 50; // kg/s
          if (material === 'semen') flowRate = 30;
          if (material === 'air') flowRate = 20;
          
          const increment = (flowRate / 5); // Divided by 5 because we check every 200ms
          simulatedWeight = Math.min(simulatedWeight + increment + (Math.random() * 2 - 1), triggerWeight);
          currentWeight = simulatedWeight;
          
          // Animate bin deduction in real-time for aggregates
          if (material === 'pasir' || material === 'batu') {
            const binId = material === 'pasir' ? config.selectedBins.pasir : config.selectedBins.batu;
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
            if (material === 'pasir' || material === 'batu') {
              const binId = material === 'pasir' ? config.selectedBins.pasir : config.selectedBins.batu;
              onAggregateDeduction(binId, joggingIncrement);
            }
          }
          currentWeight = simulatedWeight;
        }
      }

      // Update weight display and hopper fill level
      setProductionState(prev => ({
        ...prev,
        currentWeights: { ...prev.currentWeights, [material]: currentWeight },
        hopperFillLevels: {
          ...prev.hopperFillLevels,
          ...(material === 'pasir' || material === 'batu' || material === 'air'
            ? { [material]: Math.min(100, (currentWeight / targetWeight) * 100) }
            : {})
        }
      }));

      // Phase 1: Normal weighing
      if (phase === 1 && currentWeight >= triggerWeight) {
        console.log(`📍 ${material} reached trigger point (${currentWeight.toFixed(1)}kg), starting jogging`);
        phase = 2;
        joggingCycleStart = Date.now();
        
        // Turn off relay
        if (material === 'pasir') {
          controlRelay('pintu_pasir_1', false);
          setComponentStates(prev => ({ ...prev, sandBinValve: false }));
        } else if (material === 'batu') {
          controlRelay('pintu_batu_1', false);
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
          
          if (material === 'pasir') {
            setComponentStates(prev => ({ ...prev, sandBinValve: shouldBeOn }));
            controlRelay('pintu_pasir_1', shouldBeOn);
          } else if (material === 'batu') {
            setComponentStates(prev => ({ ...prev, stoneBinValve: shouldBeOn }));
            controlRelay('pintu_batu_1', shouldBeOn);
          } else if (material === 'air') {
            // Water tank valve toggled (RED blinking during jogging)
            setComponentStates(prev => ({ ...prev, waterTankValve: shouldBeOn }));
            controlRelay('water_tank_valve', shouldBeOn);
          }
        }
      }

      // Check completion
      if (currentWeight >= finalWeight) {
        console.log(`✅ ${material} weighing complete (${currentWeight.toFixed(1)}kg)`);
        clearInterval(weighingInterval);
        
        // Turn off relay
        if (material === 'pasir') {
          controlRelay('pintu_pasir_1', false);
          setComponentStates(prev => ({ ...prev, sandBinValve: false }));
        } else if (material === 'batu') {
          controlRelay('pintu_batu_1', false);
          setComponentStates(prev => ({ ...prev, stoneBinValve: false }));
        } else if (material === 'air') {
          controlRelay('water_tank_valve', false);
          setComponentStates(prev => ({ ...prev, waterTankValve: false }));
        }
        
        weighingStatus[material] = true;
        setProductionState(prev => ({
          ...prev,
          weighingComplete: { ...prev.weighingComplete, [material]: true },
          currentStep: 'weighing' // Reset to general weighing status
        }));
      }
    }, 200); // Check every 200ms
    
    addInterval(weighingInterval);
  };

  const startDischargeSequence = (config: ProductionConfig) => {
    setProductionState(prev => ({ ...prev, currentStep: 'discharging' }));
    
    toast({
      title: 'Penimbangan Selesai',
      description: 'Memulai proses discharge material',
    });

    const mixingSequence = getMixingSequence();
    
    // Group materials by mixing number
    const groups: { [key: number]: { material: string, timer: number, targetWeight: number }[] } = {};
    
    (['pasir', 'batu', 'semen', 'air'] as const).forEach(material => {
      if (config.targetWeights[material] > 0) {
        const mixingNum = mixingSequence[material].mixing;
        const timer = mixingSequence[material].timer;
        
        if (!groups[mixingNum]) {
          groups[mixingNum] = [];
        }
        groups[mixingNum].push({ material, timer, targetWeight: config.targetWeights[material] });
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
      controlRelay('dump_material', true); // Valve hopper
      
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
        
        // Close hopper valve after material is fully discharged
        controlRelay('dump_material', false);
        setComponentStates(prev => ({ 
          ...prev,
          hopperValvePasir: material === 'pasir' ? false : prev.hopperValvePasir,
          hopperValveBatu: material === 'batu' ? false : prev.hopperValveBatu,
        }));
        
        // 🆕 TRIGGER PENIMBANGAN MIXING BERIKUTNYA jika hopper aggregate kosong
        checkAndStartNextMixingWeighing();
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
        
        // 🆕 TRIGGER PENIMBANGAN MIXING BERIKUTNYA jika cement hopper kosong
        checkAndStartNextMixingWeighing();
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
        
        // 🆕 TRIGGER PENIMBANGAN MIXING BERIKUTNYA jika hopper air kosong
        checkAndStartNextMixingWeighing();
      }, dischargeDuration);
      addTimer(clearTimer);
    }

    // Keep valve open for discharge duration (estimate based on weight)
    const dischargeDuration = Math.max(3000, targetWeight * 3); // ~3ms per kg
    const closeTimer = setTimeout(() => {
      if (material === 'semen') {
        console.log('🔴 CEMENT DISCHARGE END - cementValve = FALSE');
        setComponentStates(prev => ({ ...prev, cementValve: false }));
      } else if (material === 'air') {
        // Water hopper valve already closed in clearTimer above
      }
      // Note: hopperValvePasir and hopperValveBatu are now closed in clearTimer above
    }, dischargeDuration);
    addTimer(closeTimer);
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
    const { currentMixing, jumlahMixing, currentStep, hopperFillLevels } = productionState;
    
    // Cek apakah masih ada mixing berikutnya
    if (currentMixing >= jumlahMixing) {
      console.log('ℹ️ No more mixing cycles, waiting for current mixing to complete');
      return;
    }
    
    // Cek apakah semua weigh hopper sudah kosong (material sudah masuk mixer)
    const allHoppersEmpty = (
      hopperFillLevels.pasir === 0 &&
      hopperFillLevels.batu === 0 &&
      hopperFillLevels.air === 0 &&
      productionState.currentWeights.semen === 0
    );
    
    // Cek apakah penimbangan mixing berikutnya sudah jalan
    const nextMixingAlreadyStarted = productionState.nextMixingReady;
    
    if (allHoppersEmpty && !nextMixingAlreadyStarted && currentStep !== 'complete') {
      console.log(`🔄 All hoppers empty! Starting weighing for Mixing ${currentMixing + 1}`);
      
      // Tandai bahwa penimbangan mixing berikutnya sudah dimulai
      setProductionState(prev => ({ ...prev, nextMixingReady: true }));
      
      toast({
        title: `Penimbangan Mixing ${currentMixing + 1} of ${jumlahMixing}`,
        description: 'Material mixing berikutnya sedang ditimbang',
      });
      
      // Refill aggregate bins SEBELUM penimbangan berikutnya
      console.log('🔄 Refilling aggregate bins for next mixing...');
      onAggregateDeduction(1, -10000); // Bin 1 (PASIR)
      onAggregateDeduction(2, -10000); // Bin 2 (BATU 1)
      onAggregateDeduction(3, -10000); // Bin 3 (BATU 2)
      onAggregateDeduction(4, -10000); // Bin 4
      
      // Mulai penimbangan mixing berikutnya SEKARANG (mixer masih mixing, material nunggu di hopper)
      setTimeout(() => {
        if (lastConfigRef.current) {
          // Mixer tetap ON, Belt Atas ON (cement conveyor)
          setComponentStates(prev => ({ ...prev, beltAtas: true }));
          controlRelay('konveyor_atas', true);

          // Open selected silo valves for cement
          setComponentStates(prev => ({
            ...prev,
            siloValves: prev.siloValves.map((_, idx) => 
              lastConfigRef.current!.selectedSilos.includes(idx + 1)
            ),
          }));
          lastConfigRef.current.selectedSilos.forEach(id => controlRelay(`silo_${id}`, true));

          // Start weighing untuk mixing berikutnya
          startWeighingWithJogging(lastConfigRef.current);
        }
      }, 1000);
    }
  };

  const completeProduction = () => {
    const { currentMixing, jumlahMixing, nextMixingReady } = productionState;
    
    // Check if there are more mixings to do
    if (currentMixing < jumlahMixing) {
      // Cek apakah penimbangan mixing berikutnya sudah selesai
      if (nextMixingReady) {
        console.log(`✅ Mixing ${currentMixing} selesai, material Mixing ${currentMixing + 1} sudah siap di hopper`);
        
        // Update state untuk mixing berikutnya
        setProductionState(prev => ({
          ...prev,
          currentMixing: prev.currentMixing + 1,
          currentStep: 'discharging',
          nextMixingReady: false,
        }));
        
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
        
      } else {
        // Material mixing berikutnya belum siap (edge case: mixing terlalu cepat)
        console.log(`⚠️ Mixing ${currentMixing} selesai, tapi material Mixing ${currentMixing + 1} belum siap. Menunggu...`);
        
        // Set flag menunggu mixer
        setProductionState(prev => ({ 
          ...prev, 
          isWaitingForMixer: true,
          currentStep: 'waiting_for_material',
        }));
        
        toast({
          title: 'Menunggu Material',
          description: `Penimbangan Mixing ${currentMixing + 1} masih berlangsung`,
        });
        
        // Poll setiap 2 detik sampai material siap
        const waitInterval = setInterval(() => {
          if (productionState.nextMixingReady) {
            clearInterval(waitInterval);
            console.log('✅ Material ready! Starting discharge for next mixing');
            
            setProductionState(prev => ({
              ...prev,
              currentMixing: prev.currentMixing + 1,
              currentStep: 'discharging',
              isWaitingForMixer: false,
              nextMixingReady: false,
            }));
            
            setTimeout(() => {
              if (lastConfigRef.current) {
                startDischargeSequence(lastConfigRef.current);
              }
            }, 1000);
          }
        }, 2000);
        addInterval(waitInterval);
      }
      
    } else {
      // All mixing cycles complete
      console.log(`✅ Semua mixing selesai (${jumlahMixing} mixing)`);
      
      // AKTIVASI KLAKSON - 1 detik
      console.log('🔔 Activating klakson for 1 second');
      controlRelay('klakson', true);
      setComponentStates(prev => ({ ...prev, klakson: true }));
      
      const klaksonTimer = setTimeout(() => {
        controlRelay('klakson', false);
        setComponentStates(prev => ({ ...prev, klakson: false }));
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

      setProductionState(prev => ({ ...prev, currentStep: 'complete' }));
      
      // Reset after 2 seconds and call onComplete callback
      const resetTimer = setTimeout(() => {
        setProductionState(initialProductionState);
        // DON'T reset componentStates - keep mixer running
        
        // Start 5-minute idle timer for mixer
        console.log('⏰ Starting 5-minute idle timer for mixer...');
        mixerIdleTimerRef.current = setTimeout(() => {
          console.log('⏰ 5 minutes idle - turning off mixer');
          setComponentStates(prev => ({ ...prev, mixer: false }));
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
    }
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
