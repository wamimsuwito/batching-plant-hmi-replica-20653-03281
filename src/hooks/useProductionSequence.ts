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
};

export const useProductionSequence = (
  onCementDeduction: (siloId: number, amount: number) => void,
  relaySettings: RelayConfig[],
  raspberryPi?: { isConnected: boolean; actualWeights: any; sendRelayCommand: any }
) => {
  const [productionState, setProductionState] = useState<ProductionState>(initialProductionState);
  const [componentStates, setComponentStates] = useState<ComponentStates>(initialComponentStates);
  const { toast } = useToast();
  const timersRef = useRef<NodeJS.Timeout[]>([]);

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

  // Clear all timers
  const clearAllTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  };

  // Add timer to tracking
  const addTimer = (timer: NodeJS.Timeout) => {
    timersRef.current.push(timer);
  };

  const stopProduction = () => {
    clearAllTimers();
    setProductionState(initialProductionState);
    setComponentStates(initialComponentStates);
    toast({
      title: 'Produksi Dihentikan',
      description: 'Sistem kembali ke mode idle',
      variant: 'destructive',
    });
  };

  const startProduction = (config: ProductionConfig) => {
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

    // t=0s: Mixer ON
    setComponentStates(prev => ({ ...prev, mixer: true }));
    controlRelay('mixer', true);

    // t=1s: Belt Atas ON, Selected Silos ON
    const beltAtasTimer = setTimeout(() => {
      setComponentStates(prev => ({
        ...prev,
        beltAtas: true,
        siloValves: prev.siloValves.map((_, idx) => 
          config.selectedSilos.includes(idx + 1)
        ),
      }));
      controlRelay('konveyor_atas', true);
      config.selectedSilos.forEach(id => controlRelay(`silo_${id}`, true));

      // Start weighing simulation (parallel weighing)
      startWeighing(config);
    }, 1000);
    addTimer(beltAtasTimer);
  };

  const startWeighing = (config: ProductionConfig) => {
    const weighingDuration = 5000; // 5 seconds for weighing
    const steps = 50;
    const interval = weighingDuration / steps;

    // Simulate gradual weighing for all materials
    let currentStep = 0;
    const weighingInterval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setProductionState(prev => ({
        ...prev,
        currentWeights: raspberryPi?.isConnected ? {
          pasir: raspberryPi.actualWeights.pasir,
          batu: raspberryPi.actualWeights.batu,
          semen: raspberryPi.actualWeights.semen,
          air: raspberryPi.actualWeights.air,
          additive: 0,
        } : {
          pasir: Math.min(progress * config.targetWeights.pasir, config.targetWeights.pasir),
          batu: Math.min(progress * config.targetWeights.batu, config.targetWeights.batu),
          semen: Math.min(progress * config.targetWeights.semen, config.targetWeights.semen),
          air: Math.min(progress * config.targetWeights.air, config.targetWeights.air),
          additive: Math.min(progress * config.targetWeights.additive, config.targetWeights.additive),
        },
        weighingComplete: {
          pasir: progress >= 1,
          batu: progress >= 1,
          semen: progress >= 1,
          air: progress >= 1,
        }
      }));

      if (currentStep >= steps) {
        clearInterval(weighingInterval);
        
        // Deduct cement from selected silos
        const cementPerSilo = config.targetWeights.semen / config.selectedSilos.length;
        config.selectedSilos.forEach(siloId => {
          onCementDeduction(siloId, cementPerSilo);
        });

        // Start discharge sequence
        startDischargeSequence(config);
      }
    }, interval);
  };

  const startDischargeSequence = (config: ProductionConfig) => {
    setProductionState(prev => ({ ...prev, currentStep: 'discharging' }));
    
    toast({
      title: 'Penimbangan Selesai',
      description: 'Memulai proses discharge material',
    });

    // Turn off silos and belt atas
    setComponentStates(prev => ({
      ...prev,
      siloValves: [false, false, false, false, false, false],
      beltAtas: false,
    }));

    // Belt bawah ON, Sand valve opens
    setComponentStates(prev => ({
      ...prev,
      beltBawah: true,
      sandBinValve: true,
      stoneBinValve: true,
    }));

    // Water valve opens after 4 seconds
    const waterDelay = getTimerValue('Tuang Air', 1) || 4000;
    const waterTimer = setTimeout(() => {
      setComponentStates(prev => ({ ...prev, waterValve: true, additiveValve: true }));
    }, waterDelay);
    addTimer(waterTimer);

    // After sand depletes (simulate 3 seconds), open cement and continue stone
    const sandTimer = setTimeout(() => {
      setComponentStates(prev => ({
        ...prev,
        sandBinValve: false,
        cementValve: true,
      }));
    }, 3000);
    addTimer(sandTimer);

    // After all materials discharged (8 seconds total), start mixing
    const mixingTimer = setTimeout(() => {
      setComponentStates(prev => ({
        ...prev,
        beltBawah: false,
        waterValve: false,
        cementValve: false,
        stoneBinValve: false,
        additiveValve: false,
      }));
      startMixing(config);
    }, 8000);
    addTimer(mixingTimer);
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

    const doorOpen1 = getTimerValue('Pintu Mixer buka', 1) || 2000;
    const doorWait1 = getTimerValue('Pintu Mixer buka', 2) || 10000;
    const doorOpen2 = getTimerValue('Pintu Mixer buka', 3) || 2000;
    const doorWait2 = getTimerValue('Pintu Mixer buka', 4) || 10000;

    // First door cycle: Open 2s
    setComponentStates(prev => ({ ...prev, mixerDoor: true }));
    
    const closeTimer1 = setTimeout(() => {
      // Close and wait 10s
      setComponentStates(prev => ({ ...prev, mixerDoor: false }));
      
      const openTimer2 = setTimeout(() => {
        // Second door cycle: Open 2s
        setProductionState(prev => ({ ...prev, mixerDoorCycle: 2 }));
        setComponentStates(prev => ({ ...prev, mixerDoor: true }));
        
        const closeTimer2 = setTimeout(() => {
          // Close and wait 10s, then complete
          setComponentStates(prev => ({ ...prev, mixerDoor: false }));
          
          const completeTimer = setTimeout(() => {
            completeProduction();
          }, doorWait2);
          addTimer(completeTimer);
        }, doorOpen2);
        addTimer(closeTimer2);
      }, doorWait1);
      addTimer(openTimer2);
    }, doorOpen1);
    addTimer(closeTimer1);
  };

  const completeProduction = () => {
    toast({
      title: 'Produksi Selesai',
      description: 'Batch berhasil diproduksi',
    });

    setProductionState(prev => ({ ...prev, currentStep: 'complete' }));
    
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
