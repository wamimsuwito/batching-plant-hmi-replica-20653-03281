import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRaspberryPi } from '@/hooks/useRaspberryPi';
import { Separator } from '@/components/ui/separator';
import { Cable, Wifi, WifiOff, Activity, Bell } from 'lucide-react';

export default function ComPortSettings() {
  const { isConnected, actualWeights, sendRelayCommand, disconnect, reconnect, lastWeightUpdate, currentWsUrl } = useRaspberryPi();
  const [wsUrl, setWsUrl] = useState('ws://localhost:8765');
  const [testingKlakson, setTestingKlakson] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('controller_ws_url');
    if (savedUrl) {
      setWsUrl(savedUrl);
    }
  }, []);

  const handleSaveWsUrl = () => {
    localStorage.setItem('controller_ws_url', wsUrl);
    alert('WebSocket URL disimpan! Silakan reconnect untuk menggunakan URL baru.');
  };

  const handleTestKlakson = () => {
    setTestingKlakson(true);
    
    // Get Modbus coil from relay settings (fallback to 15)
    const relaySettings = localStorage.getItem('relay_settings');
    let klaksonCoil = 15; // Default
    
    if (relaySettings) {
      try {
        const settings = JSON.parse(relaySettings);
        const klaksonRelay = settings.find((r: any) => r.name === 'Klakson');
        if (klaksonRelay) {
          klaksonCoil = parseInt(klaksonRelay.modbusCoil) || 15;
        }
      } catch (error) {
        console.error('Error parsing relay settings:', error);
      }
    }
    
    console.log(`🔔 Testing klakson with Modbus Coil ${klaksonCoil}`);
    sendRelayCommand('klakson', true, klaksonCoil);
    
    setTimeout(() => {
      sendRelayCommand('klakson', false, klaksonCoil);
      setTestingKlakson(false);
    }, 1000);
  };

  const isWeightDataStale = () => {
    if (!lastWeightUpdate) return true;
    return (Date.now() - lastWeightUpdate) > 10000; // 10 seconds
  };

  const getLastUpdateText = () => {
    if (!lastWeightUpdate) return 'Tidak ada data';
    const secondsAgo = Math.floor((Date.now() - lastWeightUpdate) / 1000);
    if (secondsAgo < 60) return `${secondsAgo} detik yang lalu`;
    return `${Math.floor(secondsAgo / 60)} menit yang lalu`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Setting Com dan Port</h1>
        <p className="text-muted-foreground">Konfigurasi dan testing koneksi Autonics controller</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
            Status Koneksi Autonics Controller
          </CardTitle>
          <CardDescription>WebSocket connection ke controller untuk load cell dan relay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">WebSocket URL</Label>
              <p className="text-sm font-mono mt-1">{currentWsUrl || 'Not connected'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={reconnect} disabled={isConnected}>
              Reconnect
            </Button>
            <Button onClick={disconnect} variant="outline" disabled={!isConnected}>
              Disconnect
            </Button>
            <Button 
              onClick={handleTestKlakson} 
              variant="secondary"
              disabled={!isConnected || testingKlakson}
              className="ml-auto"
            >
              <Bell className="w-4 h-4 mr-2" />
              {testingKlakson ? 'Testing...' : 'Test Klakson (1 detik)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weight Indicators Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Status Indikator Timbangan
          </CardTitle>
          <CardDescription>Real-time data dari load cell (Autonics ARM/ARX)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Pasir (kg)</Label>
              <p className="text-2xl font-bold">{actualWeights.pasir.toFixed(1)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Batu (kg)</Label>
              <p className="text-2xl font-bold">{actualWeights.batu.toFixed(1)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Semen (kg)</Label>
              <p className="text-2xl font-bold">{actualWeights.semen.toFixed(1)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Air (kg)</Label>
              <p className="text-2xl font-bold">{actualWeights.air.toFixed(1)}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Terakhir Update</Label>
            <div className="flex items-center gap-2">
              <Badge variant={isWeightDataStale() ? "destructive" : "default"}>
                {isConnected ? getLastUpdateText() : 'Tidak terhubung'}
              </Badge>
              {isConnected && isWeightDataStale() && (
                <p className="text-sm text-destructive">
                  ⚠️ Tidak ada data timbangan - cek koneksi PCIe/serial
                </p>
              )}
              {isConnected && !isWeightDataStale() && (
                <p className="text-sm text-green-600">
                  ✅ Indikator timbangan aktif
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WebSocket Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cable className="w-5 h-5" />
            Konfigurasi WebSocket Controller
          </CardTitle>
          <CardDescription>URL untuk koneksi ke Python WebSocket server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wsUrl">WebSocket URL</Label>
            <Input
              id="wsUrl"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://localhost:8765"
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Contoh: ws://localhost:8765 atau ws://192.168.1.100:8765
            </p>
          </div>

          <Button onClick={handleSaveWsUrl}>
            Simpan Konfigurasi
          </Button>
        </CardContent>
      </Card>

      {/* Serial Port Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Referensi Port Serial (config_autonics.json)</CardTitle>
          <CardDescription>Konfigurasi COM port untuk load cell dan Modbus - diatur di file Python</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
            <p><strong>Load Cell (RS232):</strong></p>
            <p>• Pasir: COM1 (Autonics ARM/ARX)</p>
            <p>• Batu: COM2 (Autonics ARM/ARX)</p>
            <p>• Semen: COM3 (Autonics ARM/ARX)</p>
            <p>• Air: COM4 (Autonics ARM/ARX)</p>
            <p className="mt-4"><strong>Modbus RTU (RS485):</strong></p>
            <p>• Relay Control: COM5 (24 Relay via Modbus)</p>
          </div>
          <p className="text-sm text-muted-foreground">
            💡 Konfigurasi COM port dilakukan di file <code className="bg-muted px-1 py-0.5 rounded">raspberry_pi/config_autonics.json</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
