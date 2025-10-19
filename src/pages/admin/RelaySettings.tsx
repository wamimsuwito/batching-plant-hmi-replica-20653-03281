import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RelayConfig {
  name: string;
  relayNumber: string;
  modbusCoil: string;
  timer1: string;
  timer2: string;
  timer3: string;
  timer4: string;
  timer5: string;
  timer6: string;
}

const defaultRelays: RelayConfig[] = [
  { name: 'Mixer', relayNumber: '1', modbusCoil: '0', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Konveyor atas', relayNumber: '2', modbusCoil: '1', timer1: '1000', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Konveyor bawah', relayNumber: '3', modbusCoil: '2', timer1: '1000', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Kompressor', relayNumber: '4', modbusCoil: '3', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Pintu pasir 1', relayNumber: '5', modbusCoil: '4', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Pintu pasir 2', relayNumber: '6', modbusCoil: '5', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Pintu batu 1', relayNumber: '7', modbusCoil: '6', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Pintu batu 2', relayNumber: '8', modbusCoil: '7', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Dump material', relayNumber: '9', modbusCoil: '8', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Dump material 2', relayNumber: '10', modbusCoil: '9', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Vibrator', relayNumber: '11', modbusCoil: '10', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Tuang air', relayNumber: '12', modbusCoil: '11', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Tuang additive', relayNumber: '13', modbusCoil: '12', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Pintu mixer buka', relayNumber: '14', modbusCoil: '13', timer1: '2000', timer2: '5000', timer3: '2000', timer4: '5000', timer5: '2000', timer6: '5000' },
  { name: 'Pintu mixer tutup', relayNumber: '15', modbusCoil: '14', timer1: '4000', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Klakson', relayNumber: '16', modbusCoil: '15', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Silo 1', relayNumber: '17', modbusCoil: '16', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Silo 2', relayNumber: '18', modbusCoil: '17', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Silo 3', relayNumber: '19', modbusCoil: '18', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Silo 4', relayNumber: '20', modbusCoil: '19', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Silo 5', relayNumber: '21', modbusCoil: '20', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Silo 6', relayNumber: '22', modbusCoil: '21', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Spare 1', relayNumber: '23', modbusCoil: '22', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
  { name: 'Spare 2', relayNumber: '24', modbusCoil: '23', timer1: '0', timer2: '', timer3: '', timer4: '', timer5: '', timer6: '' },
];

const STORAGE_KEY = 'relay_settings';

export default function RelaySettings() {
  const [relays, setRelays] = useState<RelayConfig[]>(defaultRelays);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRelays(JSON.parse(saved));
    }
  }, []);

  const handleInputChange = (index: number, field: keyof RelayConfig, value: string) => {
    const updated = [...relays];
    updated[index] = { ...updated[index], [field]: value };
    setRelays(updated);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(relays));
    toast({
      title: 'Pengaturan Tersimpan',
      description: 'Konfigurasi relay dan timer berhasil disimpan',
    });
  };

  const handleExportConfig = () => {
    const config = {
      relay_mapping: relays.reduce((acc, relay) => {
        const key = relay.name.toLowerCase().replace(/ /g, '_');
        acc[key] = parseInt(relay.modbusCoil) || 0;
        return acc;
      }, {} as Record<string, number>),
    };
    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'autonics_config.json';
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Config Exported' });
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Relay & Timer (Autonics System)</CardTitle>
          <CardDescription>
            Konfigurasi Modbus coil address dan timer untuk 24 relay outputs (ARM + 2x ARX).
            <br />
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <strong className="text-yellow-800 dark:text-yellow-200">⚠️ PENTING - Sistem Hidrolik Solenoid Pintu Mixer:</strong>
              <ul className="list-disc ml-4 mt-2 text-sm space-y-1">
                <li>
                  <strong>Pintu Mixer Buka (Relay #14):</strong>
                  <ul className="list-circle ml-4 mt-1">
                    <li><strong>Timer 1, 3, 5:</strong> Durasi solenoid BUKA ON (dalam ms) - pintu terbuka bertahap</li>
                    <li><strong>Timer 2, 4, 6:</strong> Durasi DIAM (solenoid OFF, pintu tetap di posisi terakhir)</li>
                    <li>Sequence: 7cm → diam → 24cm → diam → 30cm → diam</li>
                  </ul>
                </li>
                <li>
                  <strong>Pintu Mixer Tutup (Relay #15):</strong>
                  <ul className="list-circle ml-4 mt-1">
                    <li><strong>Timer 1:</strong> Durasi solenoid TUTUP ON untuk menutup pintu penuh (dalam ms)</li>
                    <li>Hanya aktif SETELAH semua siklus buka selesai</li>
                  </ul>
                </li>
              </ul>
            </div>
            <br />
            <strong>Catatan:</strong> Nilai dalam milliseconds (ms). Contoh: 2000 = 2 detik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Nama</TableHead>
                  <TableHead className="w-[100px]">Relay</TableHead>
                  <TableHead className="w-[120px]">Modbus Coil</TableHead>
                  <TableHead className="w-[120px]">
                    Timer 1
                    <br />
                    <span className="text-xs text-muted-foreground">(Buka 1)</span>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    Timer 2
                    <br />
                    <span className="text-xs text-muted-foreground">(Diam 1)</span>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    Timer 3
                    <br />
                    <span className="text-xs text-muted-foreground">(Buka 2)</span>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    Timer 4
                    <br />
                    <span className="text-xs text-muted-foreground">(Diam 2)</span>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    Timer 5
                    <br />
                    <span className="text-xs text-muted-foreground">(Buka 3)</span>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    Timer 6
                    <br />
                    <span className="text-xs text-muted-foreground">(Diam 3)</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relays.map((relay, index) => (
                  <TableRow key={relay.name}>
                    <TableCell className="font-medium">{relay.name}</TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={relay.relayNumber}
                        onChange={(e) => handleInputChange(index, 'relayNumber', e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={relay.modbusCoil}
                        onChange={(e) => handleInputChange(index, 'modbusCoil', e.target.value)}
                        className="w-full bg-blue-50"
                        placeholder="0-23"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={relay.timer1}
                        onChange={(e) => handleInputChange(index, 'timer1', e.target.value)}
                        placeholder="ms"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={relay.timer2}
                        onChange={(e) => handleInputChange(index, 'timer2', e.target.value)}
                        placeholder="ms"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={relay.timer3}
                        onChange={(e) => handleInputChange(index, 'timer3', e.target.value)}
                        placeholder="ms"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={relay.timer4}
                        onChange={(e) => handleInputChange(index, 'timer4', e.target.value)}
                        placeholder="ms"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={relay.timer5}
                        onChange={(e) => handleInputChange(index, 'timer5', e.target.value)}
                        placeholder="ms"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={relay.timer6}
                        onChange={(e) => handleInputChange(index, 'timer6', e.target.value)}
                        placeholder="ms"
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <Button onClick={handleSave}>Simpan Pengaturan</Button>
            <Button onClick={handleExportConfig} variant="outline">Export Config</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
