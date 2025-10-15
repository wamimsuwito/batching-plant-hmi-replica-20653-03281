import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ActualWeights {
  pasir: number;
  batu: number;
  semen: number;
  air: number;
}

interface RelayCommand {
  type: 'relay_control';
  relay: string;
  state: boolean;
  gpio_pin?: number;
}

interface WeightUpdateMessage {
  type: 'weight_update';
  timestamp: number;
  weights: ActualWeights;
}

export const useRaspberryPi = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [actualWeights, setActualWeights] = useState<ActualWeights>({
    pasir: 0,
    batu: 0,
    semen: 0,
    air: 0,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const connect = useCallback(() => {
    try {
      // WebSocket ke Raspberry Pi via USB Serial bridge
      // Raspberry Pi akan muncul sebagai network interface
      // Try multiple possible addresses
      const possibleAddresses = [
        'ws://raspberrypi.local:8765',
        'ws://192.168.137.1:8765',
        'ws://localhost:8765',
      ];

      // Try first address (can be made configurable)
      const wsUrl = possibleAddresses[0];
      
      console.log('Connecting to Raspberry Pi at:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Connected to Raspberry Pi');
        setIsConnected(true);
        toast({
          title: "Raspberry Pi Connected",
          description: "Real-time weight data aktif",
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'weight_update') {
            const msg = data as WeightUpdateMessage;
            setActualWeights(msg.weights);
          } else if (data.type === 'error') {
            console.error('Raspberry Pi error:', data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('❌ Disconnected from Raspberry Pi');
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnected(false);
    }
  }, [toast]);

  const sendRelayCommand = useCallback((relay: string, state: boolean, gpioPin?: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command: RelayCommand = {
        type: 'relay_control',
        relay,
        state,
        gpio_pin: gpioPin,
      };
      
      wsRef.current.send(JSON.stringify(command));
      console.log(`📤 Relay command sent: ${relay} = ${state ? 'ON' : 'OFF'} (GPIO ${gpioPin})`);
    } else {
      console.warn('⚠️ Raspberry Pi not connected, command ignored:', relay, state);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    actualWeights,
    sendRelayCommand,
    disconnect,
    reconnect: connect,
  };
};
