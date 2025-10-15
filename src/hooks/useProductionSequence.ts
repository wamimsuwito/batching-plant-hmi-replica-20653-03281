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
}

export interface ComponentStates {
  mixer: boolean;
  beltAtas: boolean;
  beltBawah: boolean;
  siloValves: boolean[];
  sandBinValve: boolean;
  stoneBinValve: boolean;
  waterValve: boolean;
  cementValve: boolean;
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
};

const initialComponentStates: ComponentStates = {
  mixer: false,
  beltAtas: false,
  beltBawah: false,
  siloValves: [false, false, false, false, false, false],
  sandBinValve: false,
  stoneBinValve: false,
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
    setComponentStates(prev => ({ ...prev, mixer: true, beltAtas: true, beltBawah: true }));
    controlRelay('mixer', true);
    controlRelay('konveyor_atas', true);
    controlRelay('konveyor_bawah', true); // Belt-1 (horizontal conveyor)

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
    
    console.log(`⚖️ Weighing ${material}: trigger=${triggerWeight.toFixed(1)}kg, final=${finalWeight.toFixed(1)}kg`);

    // Phase 1: Normal weighing until trigger %
    let phase = 1;
    let joggingState = false;

    // Open material relay
    if (material === 'pasir') {
      setComponentStates(prev => ({ ...prev, sandBinValve: true }));
      controlRelay('pintu_pasir_1', true);
    } else if (material === 'batu') {
      setComponentStates(prev => ({ ...prev, stoneBinValve: true }));
      controlRelay('pintu_batu_1', true);
    } else if (material === 'air') {
      setComponentStates(prev => ({ ...prev, waterValve: true }));
      controlRelay('tuang_air', true);
    }

    const weighingInterval = setInterval(() => {
      // Get current weight
      let currentWeight;
      if (raspberryPi?.isConnected) {
        currentWeight = raspberryPi.actualWeights[material] || 0;
      } else {
        // Simulation mode
        currentWeight = productionState.currentWeights[material];
        const increment = phase === 1 ? 5 : (joggingState ? 0.5 : 0);
        currentWeight = Math.min(currentWeight + increment, finalWeight);
      }

      // Update weight display
      setProductionState(prev => ({
        ...prev,
        currentWeights: { ...prev.currentWeights, [material]: currentWeight }
      }));

      // Phase 1: Normal weighing
      if (phase === 1 && currentWeight >= triggerWeight) {
        console.log(`📍 ${material} reached trigger point (${currentWeight.toFixed(1)}kg), starting jogging`);
        phase = 2;
        
        // Turn off relay
        if (material === 'pasir') {
          controlRelay('pintu_pasir_1', false);
          setComponentStates(prev => ({ ...prev, sandBinValve: false }));
        } else if (material === 'batu') {
          controlRelay('pintu_batu_1', false);
          setComponentStates(prev => ({ ...prev, stoneBinValve: false }));
        } else if (material === 'air') {
          controlRelay('tuang_air', false);
          setProductionState(prev => ({
            ...prev,
            currentStep: `jogging-${material}`
          }));
        }
      }

      // Phase 2: Jogging
      if (phase === 2 && currentWeight < finalWeight) {
        // Toggle relay based on jogging timer
        const now = Date.now();
        const cycleTime = (jogging.jogingOn + jogging.jogingOff) * 1000;
        const position = now % cycleTime;
        const shouldBeOn = position < (jogging.jogingOn * 1000);

        if (shouldBeOn !== joggingState) {
          joggingState = shouldBeOn;
          if (material === 'pasir') {
            setComponentStates(prev => ({ ...prev, sandBinValve: shouldBeOn }));
            controlRelay('pintu_pasir_1', shouldBeOn);
          } else if (material === 'batu') {
            setComponentStates(prev => ({ ...prev, stoneBinValve: shouldBeOn }));
            controlRelay('pintu_batu_1', shouldBeOn);
          } else if (material === 'air') {
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
          weighingComplete: { ...prev.weighingComplete, [material]: true }
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

    // Discharge groups sequentially
    let groupDelay = 0;
    sortedGroups.forEach((groupNum, groupIndex) => {
      const groupMaterials = groups[groupNum];
      
      // Within each group, apply individual timer delays
      groupMaterials.forEach(({ material, timer, targetWeight }) => {
        const totalDelay = groupDelay + (timer * 1000);
        
        const dischargeTimer = setTimeout(() => {
          console.log(`💧 Discharging ${material} from group ${groupNum}`);
          dischargeMaterial(material, targetWeight);
        }, totalDelay);
        addTimer(dischargeTimer);
      });

      // Group delay: estimate 5 seconds per material in group
      groupDelay += (groupMaterials.length * 5000);
    });

    // After all discharge complete, start mixing
    const mixingStartDelay = groupDelay + 2000;
    const mixingTimer = setTimeout(() => {
      // Turn off all discharge valves
      setComponentStates(prev => ({
        ...prev,
        cementValve: false,
        waterValve: false,
        vibrator: false,
      }));
      controlRelay('vibrator', false);
      
      startMixing(config);
    }, mixingStartDelay);
    addTimer(mixingTimer);
  };

  const dischargeMaterial = (material: string, targetWeight: number) => {
    // Turn on vibrator for aggregate discharge
    if (material === 'pasir' || material === 'batu') {
      setComponentStates(prev => ({ ...prev, vibrator: true }));
      controlRelay('vibrator', true);
      controlRelay('dump_material', true); // Valve hopper
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
