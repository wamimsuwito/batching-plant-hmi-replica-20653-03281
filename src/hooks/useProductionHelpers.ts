import { ProductionConfig } from './useProductionSequence';

// Timer Dumping System 3: ON/OFF cycle logic
export const createTimerDumpingCycle = (
  material: 'pasir' | 'batu',
  config: ProductionConfig,
  joggingSettings: any[],
  callbacks: {
    setComponentStates: any;
    controlRelay: any;
    getAggregateRelayName: any;
    setProductionState: any;
    onAggregateDeduction: any;
    addTimer: any;
    addActivityLog: any;
  }
) => {
  const { setComponentStates, controlRelay, getAggregateRelayName, setProductionState, onAggregateDeduction, addTimer, addActivityLog } = callbacks;
  
  // Get timer settings
  const timerDumpingIndex = material === 'pasir' ? 7 : 8;
  const timerSettings = joggingSettings[timerDumpingIndex] || { jogingOn: '3', jogingOff: '2' };
  const onTime = parseFloat(timerSettings.jogingOn) * 1000;
  const offTime = parseFloat(timerSettings.jogingOff) * 1000;
  
  const targetWeight = material === 'pasir' 
    ? (config.targetWeights.pasir1 + config.targetWeights.pasir2)
    : (config.targetWeights.batu1 + config.targetWeights.batu2);
  
  // Calculate total cycles needed
  const dischargeDuration = Math.max(10000, targetWeight * 30);
  const cycleTime = onTime + offTime;
  const totalCycles = Math.ceil(dischargeDuration / cycleTime);
  
  let currentCycle = 0;
  let totalDeducted = 0;
  
  const runCycle = () => {
    if (currentCycle >= totalCycles || totalDeducted >= targetWeight) {
      // FINISH: Close all gates
      console.log('✅ Timer dumping complete for', material);
      
      setComponentStates((prev: any) => ({ 
        ...prev, 
        sandBin1Valve: false,
        sandBin2Valve: false,
        stoneBin1Valve: false,
        stoneBin2Valve: false,
      }));
      
      if (material === 'pasir') {
        const usePasir1 = config.targetWeights.pasir1 > 0;
        const usePasir2 = config.targetWeights.pasir2 > 0;
        if (usePasir1) controlRelay(getAggregateRelayName('pasir1', config.selectedBins.pasir1), false);
        if (usePasir2) controlRelay(getAggregateRelayName('pasir2', config.selectedBins.pasir2), false);
      } else {
        const useBatu1 = config.targetWeights.batu1 > 0;
        const useBatu2 = config.targetWeights.batu2 > 0;
        if (useBatu1) controlRelay(getAggregateRelayName('batu1', config.selectedBins.batu1), false);
        if (useBatu2) controlRelay(getAggregateRelayName('batu2', config.selectedBins.batu2), false);
      }
      
      setProductionState((prev: any) => ({
        ...prev,
        currentWeights: {
          ...prev.currentWeights,
          [material]: 0
        },
        dischargedMaterialsCount: prev.dischargedMaterialsCount + 1,
      }));
      
      return;
    }
    
    currentCycle++;
    
    // PHASE 1: GATE OPEN (ON)
    if (material === 'pasir') {
      const usePasir1 = config.targetWeights.pasir1 > 0;
      const usePasir2 = config.targetWeights.pasir2 > 0;
      setComponentStates((prev: any) => ({ 
        ...prev, 
        sandBin1Valve: usePasir1,
        sandBin2Valve: usePasir2,
      }));
      if (usePasir1) controlRelay(getAggregateRelayName('pasir1', config.selectedBins.pasir1), true);
      if (usePasir2) controlRelay(getAggregateRelayName('pasir2', config.selectedBins.pasir2), true);
    } else {
      const useBatu1 = config.targetWeights.batu1 > 0;
      const useBatu2 = config.targetWeights.batu2 > 0;
      setComponentStates((prev: any) => ({ 
        ...prev, 
        stoneBin1Valve: useBatu1,
        stoneBin2Valve: useBatu2,
      }));
      if (useBatu1) controlRelay(getAggregateRelayName('batu1', config.selectedBins.batu1), true);
      if (useBatu2) controlRelay(getAggregateRelayName('batu2', config.selectedBins.batu2), true);
    }
    
    console.log(`🟢 Cycle ${currentCycle}: Gate OPEN for ${onTime/1000}s`);
    
    // Animate deduction during ON time
    const onSteps = 30;
    const onInterval = onTime / onSteps;
    const deductionPerStep = (targetWeight / totalCycles / onSteps);
    
    let onStep = 0;
    const animateOn = () => {
      onStep++;
      totalDeducted += deductionPerStep;
      
      setProductionState((prev: any) => ({
        ...prev,
        currentWeights: {
          ...prev.currentWeights,
          [material]: Math.max(0, prev.currentWeights[material] - deductionPerStep)
        }
      }));
      
      // Deduct from aggregate bins
      if (material === 'pasir') {
        const usePasir1 = config.targetWeights.pasir1 > 0;
        const usePasir2 = config.targetWeights.pasir2 > 0;
        if (usePasir1 && usePasir2) {
          onAggregateDeduction(config.selectedBins.pasir1, deductionPerStep / 2);
          onAggregateDeduction(config.selectedBins.pasir2, deductionPerStep / 2);
        } else if (usePasir1) {
          onAggregateDeduction(config.selectedBins.pasir1, deductionPerStep);
        } else if (usePasir2) {
          onAggregateDeduction(config.selectedBins.pasir2, deductionPerStep);
        }
      } else {
        const useBatu1 = config.targetWeights.batu1 > 0;
        const useBatu2 = config.targetWeights.batu2 > 0;
        if (useBatu1 && useBatu2) {
          onAggregateDeduction(config.selectedBins.batu1, deductionPerStep / 2);
          onAggregateDeduction(config.selectedBins.batu2, deductionPerStep / 2);
        } else if (useBatu1) {
          onAggregateDeduction(config.selectedBins.batu1, deductionPerStep);
        } else if (useBatu2) {
          onAggregateDeduction(config.selectedBins.batu2, deductionPerStep);
        }
      }
      
      if (onStep < onSteps) {
        const timer = setTimeout(animateOn, onInterval);
        addTimer(timer);
      } else {
        setTimeout(startOffPhase, 0);
      }
    };
    
    const startOffPhase = () => {
      // PHASE 2: GATE CLOSE (OFF)
      setComponentStates((prev: any) => ({ 
        ...prev, 
        sandBin1Valve: false,
        sandBin2Valve: false,
        stoneBin1Valve: false,
        stoneBin2Valve: false,
      }));
      
      if (material === 'pasir') {
        const usePasir1 = config.targetWeights.pasir1 > 0;
        const usePasir2 = config.targetWeights.pasir2 > 0;
        if (usePasir1) controlRelay(getAggregateRelayName('pasir1', config.selectedBins.pasir1), false);
        if (usePasir2) controlRelay(getAggregateRelayName('pasir2', config.selectedBins.pasir2), false);
      } else {
        const useBatu1 = config.targetWeights.batu1 > 0;
        const useBatu2 = config.targetWeights.batu2 > 0;
        if (useBatu1) controlRelay(getAggregateRelayName('batu1', config.selectedBins.batu1), false);
        if (useBatu2) controlRelay(getAggregateRelayName('batu2', config.selectedBins.batu2), false);
      }
      
      console.log(`🔴 Cycle ${currentCycle}: Gate CLOSED for ${offTime/1000}s`);
      
      const timer = setTimeout(runCycle, offTime);
      addTimer(timer);
    };
    
    animateOn();
  };
  
  return runCycle;
};