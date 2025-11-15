import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MaterialWeighing {
  timestamp: number;
  peakWeight: number;
  remainingWeight: number;
  dischargedWeight: number;
}

interface MaterialRecord {
  weighings: MaterialWeighing[];
  totalDischarged: number;
  target?: number;
}

export interface ManualProductionSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  formData: {
    pelanggan: string;
    lokasiProyek: string;
    mutuBeton: string;
    slump: string;
    targetProduksi: string;
    selectedSilo: string;
    namaSopir: string;
    nomorMobil: string;
  };
  materials: {
    pasir1: MaterialRecord;
    pasir2: MaterialRecord;
    batu1: MaterialRecord;
    batu2: MaterialRecord;
    semen: MaterialRecord;
    air: MaterialRecord;
  };
  aggregateNote?: {
    pasir1?: string;
    pasir2?: string;
    batu1?: string;
    batu2?: string;
  };
  activeSilo?: number;
}

const DISCHARGE_THRESHOLDS = {
  pasir1: 100,
  pasir2: 100,
  batu1: 100,
  batu2: 100,
  semen: 5,
  air: 3,
};

export const useManualProduction = (
  actualWeights: { aggregate: number; semen: number; air: number },
  relayStates: Record<string, boolean>
) => {
  const [isManualSessionActive, setIsManualSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<ManualProductionSession | null>(null);
  const { toast } = useToast();
  
  const peakWeightsRef = useRef({
    aggregate: 0,
    semen: 0,
    air: 0,
  });

  const prevWeightsRef = useRef({
    aggregate: 0,
    semen: 0,
    air: 0,
  });

  const activeRelayRef = useRef<{
    pasir1: boolean;
    pasir2: boolean;
    batu1: boolean;
    batu2: boolean;
  }>({
    pasir1: false,
    pasir2: false,
    batu1: false,
    batu2: false,
  });

  useEffect(() => {
    if (!isManualSessionActive) return;

    activeRelayRef.current = {
      pasir1: relayStates['pintu_pasir_1'] || false,
      pasir2: relayStates['pintu_pasir_2'] || false,
      batu1: relayStates['pintu_batu_1'] || false,
      batu2: relayStates['pintu_batu_2'] || false,
    };

    console.log('🎯 Active relays:', activeRelayRef.current);
  }, [relayStates, isManualSessionActive]);

  const determineActiveMaterial = useCallback((): 'pasir1' | 'pasir2' | 'batu1' | 'batu2' | null => {
    const states = activeRelayRef.current;

    if (states.pasir1 && states.pasir2) {
      console.log('🔀 Multiple pasir relays active - using pasir1');
      return 'pasir1';
    }
    if (states.batu1 && states.batu2) {
      console.log('🔀 Multiple batu relays active - using batu1');
      return 'batu1';
    }

    if (states.pasir1) return 'pasir1';
    if (states.pasir2) return 'pasir2';
    if (states.batu1) return 'batu1';
    if (states.batu2) return 'batu2';

    return null;
  }, []);

  const calculateTargets = useCallback((mutuBeton: string, volume: number) => {
    const jmfData = localStorage.getItem('job_mix_formulas');
    if (!jmfData) {
      console.warn('⚠️ No JMF data found');
      return null;
    }

    const jmfList = JSON.parse(jmfData);
    const jmf = jmfList.find((f: any) => f.mutuBeton === mutuBeton);

    if (!jmf) {
      console.warn(`⚠️ JMF not found for ${mutuBeton}`);
      return null;
    }

    return {
      pasir1: parseFloat(jmf.pasir1 || '0') * volume,
      pasir2: parseFloat(jmf.pasir2 || '0') * volume,
      batu1: parseFloat(jmf.batu1 || '0') * volume,
      batu2: parseFloat(jmf.batu2 || '0') * volume,
      semen: parseFloat(jmf.semen || '0') * volume,
      air: parseFloat(jmf.air || '0') * volume,
    };
  }, []);

  const startManualSession = useCallback((formData: ManualProductionSession['formData']) => {
    const volume = parseFloat(formData.targetProduksi);
    const targets = calculateTargets(formData.mutuBeton, volume);

    const session: ManualProductionSession = {
      sessionId: `MANUAL-${Date.now()}`,
      startTime: new Date(),
      formData,
      materials: {
        pasir1: { weighings: [], totalDischarged: 0, target: targets?.pasir1 || 0 },
        pasir2: { weighings: [], totalDischarged: 0, target: targets?.pasir2 || 0 },
        batu1: { weighings: [], totalDischarged: 0, target: targets?.batu1 || 0 },
        batu2: { weighings: [], totalDischarged: 0, target: targets?.batu2 || 0 },
        semen: { weighings: [], totalDischarged: 0, target: targets?.semen || 0 },
        air: { weighings: [], totalDischarged: 0, target: targets?.air || 0 },
      },
    };

    setCurrentSession(session);
    setIsManualSessionActive(true);
    
    peakWeightsRef.current = { aggregate: 0, semen: 0, air: 0 };
    prevWeightsRef.current = { aggregate: 0, semen: 0, air: 0 };

    toast({
      title: '✅ Manual Session Started',
      description: 'Material weighing tracking aktif',
    });

    console.log('🟢 Manual production session started:', session.sessionId);
  }, [toast, calculateTargets]);

  const recordDischarge = useCallback((
    materialName: keyof ManualProductionSession['materials'], 
    peakWeight: number, 
    remainingWeight: number
  ) => {
    if (!currentSession) return;

    const dischargedWeight = peakWeight - remainingWeight;
    
    const weighing: MaterialWeighing = {
      timestamp: Date.now(),
      peakWeight,
      remainingWeight,
      dischargedWeight,
    };

    setCurrentSession(prev => {
      if (!prev) return prev;

      const updatedMaterials = {
        ...prev.materials,
        [materialName]: {
          ...prev.materials[materialName],
          weighings: [...prev.materials[materialName].weighings, weighing],
          totalDischarged: prev.materials[materialName].totalDischarged + dischargedWeight,
        },
      };

      console.log(`📊 ${materialName.toUpperCase()} discharge recorded:`, {
        peak: peakWeight,
        remaining: remainingWeight,
        discharged: dischargedWeight,
        totalDischarged: updatedMaterials[materialName].totalDischarged,
      });

      return {
        ...prev,
        materials: updatedMaterials,
      };
    });
  }, [currentSession]);

  useEffect(() => {
    if (!isManualSessionActive || !currentSession) return;

    const currentAggWeight = actualWeights.aggregate;
    const peakAggWeight = peakWeightsRef.current.aggregate;

    if (currentAggWeight > peakAggWeight) {
      peakWeightsRef.current.aggregate = currentAggWeight;
    }

    const weightDrop = peakAggWeight - currentAggWeight;
    if (weightDrop > 100 && peakAggWeight > 100) {
      const activeMaterial = determineActiveMaterial();
      
      if (activeMaterial) {
        console.log(`🔻 ${activeMaterial.toUpperCase()} discharge detected:`, {
          peak: peakAggWeight,
          current: currentAggWeight,
          drop: weightDrop,
        });

        recordDischarge(activeMaterial, peakAggWeight, currentAggWeight);
      } else {
        console.warn('⚠️ Aggregate discharge detected but no relay active!');
      }

      peakWeightsRef.current.aggregate = currentAggWeight;
    }

    prevWeightsRef.current.aggregate = currentAggWeight;
  }, [actualWeights.aggregate, isManualSessionActive, currentSession, determineActiveMaterial, recordDischarge]);

  useEffect(() => {
    if (!isManualSessionActive || !currentSession) return;

    const currentSemenWeight = actualWeights.semen;
    const peakSemenWeight = peakWeightsRef.current.semen;

    if (currentSemenWeight > peakSemenWeight) {
      peakWeightsRef.current.semen = currentSemenWeight;
    }

    const semenDrop = peakSemenWeight - currentSemenWeight;
    if (semenDrop > 5 && peakSemenWeight > 10) {
      console.log(`🔻 SEMEN discharge detected:`, {
        peak: peakSemenWeight,
        current: currentSemenWeight,
        drop: semenDrop,
      });
      
      recordDischarge('semen', peakSemenWeight, currentSemenWeight);
      peakWeightsRef.current.semen = currentSemenWeight;
    }

    prevWeightsRef.current.semen = currentSemenWeight;
  }, [actualWeights.semen, isManualSessionActive, currentSession, recordDischarge]);

  useEffect(() => {
    if (!isManualSessionActive || !currentSession) return;

    const currentAirWeight = actualWeights.air;
    const peakAirWeight = peakWeightsRef.current.air;

    if (currentAirWeight > peakAirWeight) {
      peakWeightsRef.current.air = currentAirWeight;
    }

    const airDrop = peakAirWeight - currentAirWeight;
    if (airDrop > 3 && peakAirWeight > 5) {
      console.log(`🔻 AIR discharge detected:`, {
        peak: peakAirWeight,
        current: currentAirWeight,
        drop: airDrop,
      });
      
      recordDischarge('air', peakAirWeight, currentAirWeight);
      peakWeightsRef.current.air = currentAirWeight;
    }

    prevWeightsRef.current.air = currentAirWeight;
  }, [actualWeights.air, isManualSessionActive, currentSession, recordDischarge]);

  const updateAggregateNote = useCallback((notes: ManualProductionSession['aggregateNote']) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        aggregateNote: notes,
      };
    });
  }, []);

  const stopManualSession = useCallback((): ManualProductionSession | null => {
    if (!currentSession) return null;

    const finalSession: ManualProductionSession = {
      ...currentSession,
      endTime: new Date(),
    };

    setIsManualSessionActive(false);
    
    const saved = localStorage.getItem('manual_production_history');
    const history = saved ? JSON.parse(saved) : [];
    history.push(finalSession);
    localStorage.setItem('manual_production_history', JSON.stringify(history));

    toast({
      title: '🛑 Manual Session Stopped',
      description: 'Print preview akan ditampilkan',
    });

    console.log('🔴 Manual production session stopped:', finalSession);
    console.log('📋 Final material totals:', {
      pasir1: finalSession.materials.pasir1.totalDischarged,
      pasir2: finalSession.materials.pasir2.totalDischarged,
      batu1: finalSession.materials.batu1.totalDischarged,
      batu2: finalSession.materials.batu2.totalDischarged,
      semen: finalSession.materials.semen.totalDischarged,
      air: finalSession.materials.air.totalDischarged,
    });

    setCurrentSession(null);

    return finalSession;
  }, [currentSession, toast]);

  return {
    isManualSessionActive,
    currentSession,
    startManualSession,
    stopManualSession,
    updateAggregateNote,
  };
};
