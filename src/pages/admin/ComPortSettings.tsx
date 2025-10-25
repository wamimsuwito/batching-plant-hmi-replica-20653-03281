import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRaspberryPi } from '@/hooks/useRaspberryPi';
import { Separator } from '@/components/ui/separator';
import { Cable, Wifi, WifiOff, Activity, Bell, Settings, BookOpen, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ComPortSettings() {
  const { isConnected, actualWeights, sendRelayCommand, disconnect, reconnect, lastWeightUpdate, currentWsUrl, productionMode, setProductionMode } = useRaspberryPi();
  const [wsUrl, setWsUrl] = useState('ws://localhost:8765');
  const [testingKlakson, setTestingKlakson] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

  const handleModeChange = (mode: 'production' | 'simulation') => {
    setProductionMode(mode);
    console.log(`✅ Mode operasi diubah ke: ${mode.toUpperCase()}`);
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

      {/* Mode Operasi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Mode Operasi
          </CardTitle>
          <CardDescription>Pilih mode operasi: Produksi (hardware real) atau Simulasi (tanpa hardware)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={productionMode} onValueChange={handleModeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="simulation" id="simulation" />
              <Label htmlFor="simulation" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Simulasi</Badge>
                  <span>Aplikasi berjalan sebagai simulator (auto-increment berat)</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="production" id="production" />
              <Label htmlFor="production" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Produksi</Badge>
                  <span>Aplikasi menggunakan load cell real dari lapangan</span>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {productionMode === 'production' && !isConnected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Mode Produksi memerlukan koneksi Autonics dan load cell aktif! Silakan hubungkan controller atau switch ke mode Simulasi.
              </AlertDescription>
            </Alert>
          )}

          {productionMode === 'production' && isConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Mode Produksi aktif - menggunakan input load cell real dari lapangan
              </AlertDescription>
            </Alert>
          )}

          {productionMode === 'simulation' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ℹ️ Mode Simulasi aktif - berat material akan disimulasikan (auto-increment)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Hardware Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Panduan Setup Hardware
          </CardTitle>
          <CardDescription>Panduan lengkap koneksi PCI Express Serial Card, Load Cell, dan Modbus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Untuk menghubungkan aplikasi ini dengan hardware produksi (load cell dan relay), ikuti panduan lengkap di bawah ini:
          </p>
          
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <p className="font-medium">📚 Isi Panduan:</p>
            <ul className="space-y-2 text-sm">
              <li>• Instalasi PCI Express Serial Card (4 port untuk load cell)</li>
              <li>• Koneksi Weight Indicator Autonics ke COM port</li>
              <li>• Setup USB-to-RS485 untuk Modbus relay control</li>
              <li>• Konfigurasi software (config_autonics.json)</li>
              <li>• Testing step-by-step setiap komponen</li>
              <li>• Troubleshooting common issues</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowGuide(!showGuide)}>
              {showGuide ? 'Sembunyikan Panduan' : 'Lihat Panduan Lengkap'}
            </Button>
            <Button variant="outline" asChild>
              <a href="/HARDWARE_SETUP_GUIDE.md" target="_blank">
                Download Panduan (MD)
              </a>
            </Button>
          </div>

          {showGuide && (
            <div className="border rounded-lg p-4 bg-background max-h-[600px] overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <h2>Panduan Setup Hardware - Ringkasan</h2>
                
                <h3>A. Persiapan Hardware</h3>
                <ul>
                  <li>PC Industrial dengan slot PCI Express</li>
                  <li>PCI Express Serial Card (4 port RS232)</li>
                  <li>USB-to-RS485 converter untuk Modbus</li>
                  <li>Weight Indicators Autonics (4 unit)</li>
                  <li>Autonics SCM-US48I + ARM-DO08P-4S modules</li>
                </ul>

                <h3>B. Instalasi Serial Card</h3>
                <ol>
                  <li>Matikan PC dan pasang card ke slot PCI Express</li>
                  <li>Install driver dari manufacturer</li>
                  <li>Verify di Device Manager - harus muncul 4 COM port</li>
                  <li>Catat nomor COM port (misal: COM3, COM4, COM5, COM6)</li>
                </ol>

                <h3>C. Koneksi Load Cell</h3>
                <pre className="bg-muted p-2 rounded text-xs">
{`Indicator DB9 → PC Serial Card
Pin 2 (TXD)   → Pin 2 (RXD)
Pin 3 (RXD)   → Pin 3 (TXD)
Pin 5 (GND)   → Pin 5 (GND)

Pasir → COM1
Batu  → COM2
Semen → COM3
Air   → COM4`}
                </pre>

                <h3>D. Koneksi Modbus (USB-RS485)</h3>
                <ol>
                  <li>Colok USB-to-RS485 ke PC (dapat COM5 atau lainnya)</li>
                  <li>Hubungkan A+/B- ke SCM-US48I gateway</li>
                  <li>Set DIP switch di ARM modules (Slave ID: 2, 3, 4)</li>
                  <li>Pasang termination resistor 120Ω di ujung bus</li>
                </ol>

                <h3>E. Konfigurasi Software</h3>
                <ol>
                  <li>Edit file: <code>raspberry_pi/config_autonics.json</code></li>
                  <li>Set nomor COM port sesuai Device Manager</li>
                  <li>Jalankan: <code>python main.py</code></li>
                  <li>Di HMI: Set WebSocket URL = ws://localhost:8765</li>
                  <li>Switch mode operasi ke "Produksi"</li>
                </ol>

                <h3>F. Testing</h3>
                <ol>
                  <li>Test serial port manual dengan PuTTY (baudrate 9600, 8N1)</li>
                  <li>Verify weight data updating real-time di HMI</li>
                  <li>Test klakson relay (klik "Test Klakson" di halaman ini)</li>
                  <li>Jalankan produksi mode Simulasi untuk test alur</li>
                  <li>Switch ke mode Produksi untuk produksi sesungguhnya</li>
                </ol>

                <p className="text-destructive font-medium">
                  ⚠️ PENTING: Pastikan semua hardware terhubung dengan benar sebelum switch ke mode Produksi!
                </p>

                <p className="text-sm text-muted-foreground">
                  📖 Untuk panduan lengkap dengan diagram wiring dan troubleshooting, 
                  lihat file <code>HARDWARE_SETUP_GUIDE.md</code> di root project.
                </p>
              </div>
            </div>
          )}
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
