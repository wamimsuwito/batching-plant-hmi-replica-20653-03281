import { useState, useEffect } from 'react';

export interface CalibrationPoint {
  ampere: number;
  slump: number;
}

// Default calibration curve (user dapat edit di admin panel)
const DEFAULT_CALIBRATION: CalibrationPoint[] = [
  { ampere: 80, slump: 18 },   // Encer
  { ampere: 90, slump: 15 },   
  { ampere: 100, slump: 12 },  // Normal
  { ampere: 110, slump: 10 },  
  { ampere: 120, slump: 8 },   // Kental
  { ampere: 130, slump: 6 },   // Sangat kental
];

export interface SlumpStatus {
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  icon: string;
}

export const useSlumpEstimation = (currentAmpere: number) => {
  const [calibrationTable, setCalibrationTable] = useState<CalibrationPoint[]>(() => {
    const saved = localStorage.getItem('slump_calibration');
    return saved ? JSON.parse(saved) : DEFAULT_CALIBRATION;
  });

  // Linear interpolation untuk estimasi slump
  const estimateSlump = (ampere: number): number => {
    if (calibrationTable.length < 2) return 0;

    // Sort by ampere ascending
    const sorted = [...calibrationTable].sort((a, b) => a.ampere - b.ampere);

    // Handle out of range
    if (ampere <= sorted[0].ampere) return sorted[0].slump;
    if (ampere >= sorted[sorted.length - 1].ampere) return sorted[sorted.length - 1].slump;

    // Find two closest points and interpolate
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];

      if (ampere >= p1.ampere && ampere <= p2.ampere) {
        // Linear interpolation: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
        const ratio = (ampere - p1.ampere) / (p2.ampere - p1.ampere);
        return p1.slump + ratio * (p2.slump - p1.slump);
      }
    }

    return 0;
  };

  const estimatedSlump = estimateSlump(currentAmpere);
  
  // Classify slump status
  const getSlumpStatus = (slump: number): SlumpStatus => {
    if (slump >= 15) return { label: 'Encer', color: 'yellow', icon: '💧' };
    if (slump >= 10) return { label: 'Normal', color: 'green', icon: '✅' };
    if (slump >= 8) return { label: 'Kental', color: 'orange', icon: '⚠️' };
    return { label: 'Sangat Kental', color: 'red', icon: '🔴' };
  };

  const saveCalibration = (newTable: CalibrationPoint[]) => {
    setCalibrationTable(newTable);
    localStorage.setItem('slump_calibration', JSON.stringify(newTable));
  };

  const resetToDefault = () => {
    setCalibrationTable(DEFAULT_CALIBRATION);
    localStorage.setItem('slump_calibration', JSON.stringify(DEFAULT_CALIBRATION));
  };

  return {
    estimatedSlump: Math.round(estimatedSlump * 10) / 10, // 1 decimal place
    slumpStatus: getSlumpStatus(estimatedSlump),
    calibrationTable,
    saveCalibration,
    resetToDefault,
  };
};
