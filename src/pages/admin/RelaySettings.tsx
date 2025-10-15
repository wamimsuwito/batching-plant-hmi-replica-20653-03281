import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RelayConfig {
  name: string;
  relayNumber: string;
  gpioPin: string;
  timer1: string;
  timer2: string;
  timer3: string;
  timer4: string;
}

const defaultRelays: RelayConfig[] = [
  { name: 'Mixer', relayNumber: '1', gpioPin: '17', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Konveyor atas', relayNumber: '2', gpioPin: '18', timer1: '1000', timer2: '', timer3: '', timer4: '' },
  { name: 'Konveyor bawah', relayNumber: '3', gpioPin: '27', timer1: '1000', timer2: '', timer3: '', timer4: '' },
  { name: 'Kompressor', relayNumber: '4', gpioPin: '22', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Pintu pasir 1', relayNumber: '5', gpioPin: '23', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Pintu pasir 2', relayNumber: '6', gpioPin: '24', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Pintu batu 1', relayNumber: '7', gpioPin: '25', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Pintu batu 2', relayNumber: '8', gpioPin: '8', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Dump material', relayNumber: '9', gpioPin: '7', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Vibrator', relayNumber: '10', gpioPin: '12', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Tuang air', relayNumber: '11', gpioPin: '16', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Tuang additive', relayNumber: '12', gpioPin: '20', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Pintu mixer buka', relayNumber: '13', gpioPin: '21', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Pintu mixer tutup', relayNumber: '14', gpioPin: '19', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Spare 1', relayNumber: '15', gpioPin: '26', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Spare 2', relayNumber: '16', gpioPin: '13', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 1', relayNumber: '17', gpioPin: '6', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 2', relayNumber: '18', gpioPin: '5', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 3', relayNumber: '19', gpioPin: '11', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 4', relayNumber: '20', gpioPin: '9', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 5', relayNumber: '21', gpioPin: '10', timer1: '0', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 6', relayNumber: '22', gpioPin: '14', timer1: '0', timer2: '', timer3: '', timer4: '' },
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
      gpio_pins: relays.reduce((acc, relay) => {
        const key = relay.name.toLowerCase().replace(/ /g, '_');
        acc[key] = parseInt(relay.gpioPin) || 0;
        return acc;
      }, {} as Record<string, number>),
    };
    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'raspberry_config.json';
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Config Exported' });
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Relay & Pintu Mixer</CardTitle>
          <CardDescription>Konfigurasi nomor relay dan timer untuk kontrol pintu mixer (dalam milidetik)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Nama</TableHead>
                  <TableHead className="w-[100px]">Relay</TableHead>
                  <TableHead className="w-[100px]">GPIO BCM</TableHead>
                  <TableHead className="w-[120px]">Timer 1 (ms)</TableHead>
                  <TableHead className="w-[120px]">Timer 2 (ms)</TableHead>
                  <TableHead className="w-[120px]">Timer 3 (ms)</TableHead>
                  <TableHead className="w-[120px]">Timer 4 (ms)</TableHead>
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
                        value={relay.gpioPin}
                        onChange={(e) => handleInputChange(index, 'gpioPin', e.target.value)}
                        className="w-full bg-blue-50"
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
