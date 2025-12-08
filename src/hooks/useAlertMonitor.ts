import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  category: 'silo' | 'equipment' | 'production' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface AlertSettings {
  siloLowThreshold: number;      // Default: 15% of capacity
  siloCriticalThreshold: number; // Default: 5% of capacity
  checkInterval: number;         // Default: 5000ms (5 seconds)
  enableSound: boolean;          // Audio alert
  enableToastNotification: boolean; // Show toast for new alerts
  enableDesktopNotification: boolean; // Browser notification when app not focused
  maxAlertsHistory: number;      // Max alerts to keep
}

const DEFAULT_SETTINGS: AlertSettings = {
  siloLowThreshold: 15,
  siloCriticalThreshold: 5,
  checkInterval: 5000,
  enableSound: true,
  enableToastNotification: true,
  enableDesktopNotification: false,
  maxAlertsHistory: 50,
};

export function useAlertMonitor(
  silos: Array<{ id: number; currentVolume: number; capacity: number }>,
  isConnected: boolean,
  productionMode: 'production' | 'simulation'
) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>(() => {
    const saved = localStorage.getItem('alert_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const previousSiloStates = useRef<Map<number, 'normal' | 'low' | 'critical'>>(new Map());
  const previousConnectionState = useRef<boolean | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for alerts
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoAAABkiLSqh2ExHVaOsLWISjsaSn6er5lbOCVBaZSom2hHMjhdhqSljXlYRkt1m6OchWtZT2R6mJyWfnBgY3KKlJKGd2tpdn+KjYV9dHl8e4eDhH5+gIOCf4CEg3+Ag4OBfn6CgoKBgYCBgYGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA');
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('alert_settings', JSON.stringify(settings));
  }, [settings]);

  // Load alerts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('alert_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlerts(parsed.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save alerts to localStorage when changed
  useEffect(() => {
    localStorage.setItem('alert_history', JSON.stringify(alerts.slice(0, settings.maxAlertsHistory)));
  }, [alerts, settings.maxAlertsHistory]);

  const playAlertSound = useCallback(() => {
    if (settings.enableSound && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [settings.enableSound]);

  // Send desktop notification when app is not focused
  const sendDesktopNotification = useCallback((alert: Alert) => {
    if (!settings.enableDesktopNotification) return;
    if (!document.hidden) return; // Window is focused, skip desktop notification
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(alert.title.replace(/[🚨⚠️✅🔌]/g, '').trim(), {
      body: alert.message,
      icon: '/favicon.ico',
      tag: alert.id, // Prevent duplicate notifications
      requireInteraction: alert.type === 'error', // Stay visible for critical alerts
    });

    // Click notification to focus app
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds for non-critical
    if (alert.type !== 'error') {
      setTimeout(() => notification.close(), 10000);
    }
  }, [settings.enableDesktopNotification]);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
    };

    setAlerts(prev => {
      // Check if similar alert already exists and is not acknowledged
      const existingIndex = prev.findIndex(
        a => a.category === alert.category && 
             a.title === alert.title && 
             !a.acknowledged &&
             Date.now() - a.timestamp.getTime() < 60000 // Within last minute
      );

      if (existingIndex !== -1) {
        // Update existing alert timestamp
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], timestamp: new Date() };
        return updated;
      }

      // Add new alert at the beginning
      return [newAlert, ...prev].slice(0, settings.maxAlertsHistory);
    });

    // Show toast notification
    if (settings.enableToastNotification) {
      if (alert.type === 'error') {
        toast.error(alert.title, { description: alert.message, duration: 10000 });
        playAlertSound();
      } else if (alert.type === 'warning') {
        toast.warning(alert.title, { description: alert.message, duration: 8000 });
      } else if (alert.type === 'success') {
        toast.success(alert.title, { description: alert.message, duration: 5000 });
      } else {
        toast.info(alert.title, { description: alert.message, duration: 5000 });
      }
    }

    // Send desktop notification for warning/error when app not focused
    if (alert.type === 'error' || alert.type === 'warning') {
      sendDesktopNotification(newAlert);
    }
  }, [settings.enableToastNotification, settings.maxAlertsHistory, playAlertSound, sendDesktopNotification]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  }, []);

  const acknowledgeAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    localStorage.removeItem('alert_history');
  }, []);

  // Monitor silo levels
  useEffect(() => {
    const checkSiloLevels = () => {
      silos.forEach(silo => {
        const percentage = (silo.currentVolume / silo.capacity) * 100;
        const previousState = previousSiloStates.current.get(silo.id) || 'normal';
        
        let currentState: 'normal' | 'low' | 'critical' = 'normal';
        
        if (percentage <= settings.siloCriticalThreshold) {
          currentState = 'critical';
        } else if (percentage <= settings.siloLowThreshold) {
          currentState = 'low';
        }

        // Only alert on state transitions
        if (currentState !== previousState) {
          if (currentState === 'critical') {
            addAlert({
              type: 'error',
              category: 'silo',
              title: `🚨 Silo ${silo.id}: KRITIS`,
              message: `Stok semen hanya ${percentage.toFixed(1)}% (${(silo.currentVolume / 1000).toFixed(1)} ton). Segera isi ulang!`,
            });
          } else if (currentState === 'low' && previousState !== 'critical') {
            addAlert({
              type: 'warning',
              category: 'silo',
              title: `⚠️ Silo ${silo.id}: Rendah`,
              message: `Stok semen ${percentage.toFixed(1)}% (${(silo.currentVolume / 1000).toFixed(1)} ton). Perlu pengisian.`,
            });
          } else if (currentState === 'normal' && (previousState === 'low' || previousState === 'critical')) {
            addAlert({
              type: 'success',
              category: 'silo',
              title: `✅ Silo ${silo.id}: Normal`,
              message: `Stok semen telah diisi ulang (${percentage.toFixed(1)}%).`,
            });
          }
        }

        previousSiloStates.current.set(silo.id, currentState);
      });
    };

    checkSiloLevels();
    const interval = setInterval(checkSiloLevels, settings.checkInterval);
    
    return () => clearInterval(interval);
  }, [silos, settings.siloLowThreshold, settings.siloCriticalThreshold, settings.checkInterval, addAlert]);

  // Monitor equipment connection
  useEffect(() => {
    if (previousConnectionState.current === null) {
      previousConnectionState.current = isConnected;
      return;
    }

    if (previousConnectionState.current !== isConnected) {
      if (!isConnected) {
        addAlert({
          type: 'error',
          category: 'equipment',
          title: '🔌 Controller Terputus',
          message: `Koneksi ke controller terputus. Mode: ${productionMode === 'simulation' ? 'Simulasi' : 'Produksi'}`,
        });
      } else {
        addAlert({
          type: 'success',
          category: 'equipment',
          title: '✅ Controller Terhubung',
          message: 'Koneksi ke controller berhasil dipulihkan.',
        });
      }
      previousConnectionState.current = isConnected;
    }
  }, [isConnected, productionMode, addAlert]);

  const updateSettings = useCallback((newSettings: Partial<AlertSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') {
      console.warn('Browser tidak mendukung desktop notification');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);

  const notificationPermission = typeof Notification !== 'undefined' 
    ? Notification.permission 
    : 'denied';

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return {
    alerts,
    settings,
    unacknowledgedCount,
    addAlert,
    acknowledgeAlert,
    acknowledgeAll,
    clearAlerts,
    updateSettings,
    requestNotificationPermission,
    notificationPermission,
  };
}
