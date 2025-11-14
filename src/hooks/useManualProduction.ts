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
    pasir: MaterialRecord;
    batu: MaterialRecord;
    semen: MaterialRecord;
    air: MaterialRecord;
  };
  activeSilo?: number; // Track which silo was used during production
}

export const useManualProduction = (actualWeights: { pasir: number; batu: number; semen: number; air: number }) => {
  const [isManualSessionActive, setIsManualSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<ManualProductionSession | null>(null);
  const { toast } = useToast();
  
  // Track peak weights for discharge detection
  const peakWeightsRef = useRef({
    pasir: 0,
    batu: 0,
    semen: 0,
    air: 0,
  });

  // Previous weights for comparison
  const prevWeightsRef = useRef({
    pasir: 0,
    batu: 0,
    semen: 0,
    air: 0,
  });

  // Start manual production session
  const startManualSession = useCallback((formData: ManualProductionSession['formData']) => {
    const session: ManualProductionSession = {
      sessionId: `MANUAL-${Date.now()}`,
      startTime: new Date(),
      formData,
      materials: {
        pasir: { weighings: [], totalDischarged: 0 },
        batu: { weighings: [], totalDischarged: 0 },
        semen: { weighings: [], totalDischarged: 0 },
        air: { weighings: [], totalDischarged: 0 },
      },
    };

    setCurrentSession(session);
    setIsManualSessionActive(true);
    
    // Reset peak weights
    peakWeightsRef.current = { pasir: 0, batu: 0, semen: 0, air: 0 };
    prevWeightsRef.current = { pasir: 0, batu: 0, semen: 0, air: 0 };

    toast({
      title: '✅ Manual Session Started',
      description: 'Material weighing tracking aktif',
    });

    console.log('🟢 Manual production session started:', session.sessionId);
  }, [toast]);

  // Record discharge for a material
  const recordDischarge = useCallback((materialName: keyof ManualProductionSession['materials'], peakWeight: number, remainingWeight: number) => {
    if (!currentSession) return;

    const dischargedWeight = peakWeight - remainingWeight;
    
    // Only record if discharged weight is significant (> 10kg)
    if (dischargedWeight < 10) return;

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

  // Monitor weights and detect discharge
  useEffect(() => {
    if (!isManualSessionActive || !currentSession) return;

    const materials: Array<keyof typeof actualWeights> = ['pasir', 'batu', 'semen', 'air'];

    materials.forEach(material => {
      const currentWeight = actualWeights[material];
      const prevWeight = prevWeightsRef.current[material];
      const peakWeight = peakWeightsRef.current[material];

      // Update peak weight if current weight is higher
      if (currentWeight > peakWeight) {
        peakWeightsRef.current[material] = currentWeight;
      }

      // Detect discharge: weight drops significantly (> 50kg) from peak
      const weightDrop = peakWeight - currentWeight;
      if (weightDrop > 50 && peakWeight > 100) {
        // Discharge detected!
        console.log(`🔻 ${material.toUpperCase()} discharge detected:`, {
          peak: peakWeight,
          current: currentWeight,
          drop: weightDrop,
        });

        recordDischarge(material, peakWeight, currentWeight);

        // Reset peak for next weighing
        peakWeightsRef.current[material] = currentWeight;
      }

      // Update previous weight
      prevWeightsRef.current[material] = currentWeight;
    });
  }, [actualWeights, isManualSessionActive, currentSession, recordDischarge]);

  // Stop manual production session
  const stopManualSession = useCallback((): ManualProductionSession | null => {
    if (!currentSession) return null;

    const finalSession: ManualProductionSession = {
      ...currentSession,
      endTime: new Date(),
    };

    setIsManualSessionActive(false);
    
    // Save to localStorage
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
      pasir: finalSession.materials.pasir.totalDischarged,
      batu: finalSession.materials.batu.totalDischarged,
      semen: finalSession.materials.semen.totalDischarged,
      air: finalSession.materials.air.totalDischarged,
    });

    // Clear session
    setCurrentSession(null);

    return finalSession;
  }, [currentSession, toast]);

  return {
    isManualSessionActive,
    currentSession,
    startManualSession,
    stopManualSession,
  };
};
