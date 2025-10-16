import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ProductionConfig {
  selectedSilos: number[];
  targetWeights: {
    pasir: number;
    batu: number;
    semen: number;
    air: number;
    additive: number;
  };
  mixingTime: number; // in seconds
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
  };
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
  waterValve: boolean; // Discharge valve for AIR to mixer (OFF during weighing)
  cementValve: boolean; // Discharge valve for SEMEN from weigh hopper
  additiveValve: boolean;
  mixerDoor: boolean;
  vibrator: boolean;
}

interface RelayConfig {
  name: string;
  relayNumber: string;
  gpioPin: string;
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
  hopperFillLevels: { pasir: 0, batu: 0 },
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
  waterValve: false,
  cementValve: false,
  additiveValve: false,
  mixerDoor: false,
  vibrator: false,
};

export const useProductionSequence = (
  onCementDeduction: (siloId: number, amount: number) => void,
  relaySettings: RelayConfig[],
  raspberryPi?: { isConnected: boolean; actualWeights: any; sendRelayCommand: any },
  isAutoMode: boolean = false
) => {
  const [productionState, setProductionState] = useState<ProductionState>(initialProductionState);
  const [componentStates, setComponentStates] = useState<ComponentStates>(initialComponentStates);
  const { toast } = useToast();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

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
      const gpioPin = relay ? parseInt(relay.gpioPin) : undefined;
      console.log(`📍 GPIO Pin: ${gpioPin}`);
      raspberryPi.sendRelayCommand(relayName, state, gpioPin);
    } else {
      console.log('⚠️ Raspberry Pi not connected - running in simulation mode');
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
    
    setProductionState({
      ...initialProductionState,
      isProducing: true,
      currentStep: 'weighing',
      selectedSilos: config.selectedSilos,
      targetWeights: config.targetWeights,
      mixingTimeRemaining: config.mixingTime,
    });

    toast({
      title: 'Produksi Dimulai',
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
      // Water filling valve ON (hidden from HMI; discharge valve remains OFF)
      controlRelay('tuang_air', true);
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
          ...(material === 'pasir' || material === 'batu' 
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
          controlRelay('tuang_air', false);
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
            // Water filling valve toggled (hidden from HMI)
            controlRelay('tuang_air', shouldBeOn);
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
          controlRelay('tuang_air', false);
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
        
        const dischargeTimer = setTimeout(() => {
          console.log(`💧 Discharging ${material} from group ${groupNum}`);
          dischargeMaterial(material, targetWeight);
        }, totalDelay);
        addTimer(dischargeTimer);
      });

      // Group delay: estimate 5 seconds per material in group
      groupDelay += (groupMaterials.length * 5000);
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
        waterValve: false,
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
      }, dischargeDuration);
      addTimer(clearTimer);
    } else if (material === 'semen') {
      setComponentStates(prev => ({ ...prev, cementValve: true }));
      // Cement valve discharge (from weigh hopper)
    } else if (material === 'air') {
      setComponentStates(prev => ({ ...prev, waterValve: true }));
      // Water valve discharge
    }

    // Keep valve open for discharge duration (estimate based on weight)
    const dischargeDuration = Math.max(3000, targetWeight * 3); // ~3ms per kg
    const closeTimer = setTimeout(() => {
      if (material === 'pasir' || material === 'batu') {
        controlRelay('dump_material', false);
        setComponentStates(prev => ({ 
          ...prev,
          hopperValvePasir: material === 'pasir' ? false : prev.hopperValvePasir,
          hopperValveBatu: material === 'batu' ? false : prev.hopperValveBatu,
        }));
      } else if (material === 'semen') {
        setComponentStates(prev => ({ ...prev, cementValve: false }));
      } else if (material === 'air') {
        setComponentStates(prev => ({ ...prev, waterValve: false }));
      }
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

    // Start door cycle after mixing completes
    const doorCycleTimer = setTimeout(() => {
      startDoorCycle();
    }, config.mixingTime * 1000);
    addTimer(doorCycleTimer);
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

  const completeProduction = () => {
    toast({
      title: 'Produksi Selesai',
      description: 'Batch berhasil diproduksi',
    });

    setProductionState(prev => ({ ...prev, currentStep: 'complete' }));
    
    // Turn off mixer
    setComponentStates(prev => ({ ...prev, mixer: false }));
    controlRelay('mixer', false);
    
    // Reset after 2 seconds
    const resetTimer = setTimeout(() => {
      setProductionState(initialProductionState);
      setComponentStates(initialComponentStates);
    }, 2000);
    addTimer(resetTimer);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  return {
    productionState,
    componentStates,
    startProduction,
    stopProduction,
  };
};
