import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RelayConfig {
  name: string;
  relayNumber: string;
  timer1: string;
  timer2: string;
  timer3: string;
  timer4: string;
}

const defaultRelays: RelayConfig[] = [
  { name: 'Waktu Mixing (detik)', relayNumber: 'N/A', timer1: '120', timer2: '', timer3: '', timer4: '' },
  { name: 'Konveyor atas', relayNumber: '', timer1: '1000', timer2: '', timer3: '', timer4: '' },
  { name: 'Konveyor bawah', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Kompressor', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Pasir 1', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Pasir 2', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Batu 1', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Batu 2', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Dump material', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Vibrator material', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 1', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 2', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 3', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 4', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 5', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Silo 6', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Timbang air', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Tuang Air', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Tuang semen 1', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Tuang Semen 2', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Klakson', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Pintu Mixer buka', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Pintu Mixer tutup', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Obat beton isi', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
  { name: 'Obat beton Tuang', relayNumber: '', timer1: '', timer2: '', timer3: '', timer4: '' },
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
                  <TableHead className="w-[150px]">Nomor Relay / Pin</TableHead>
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
                        type="number"
                        value={relay.relayNumber}
                        onChange={(e) => handleInputChange(index, 'relayNumber', e.target.value)}
                        placeholder="No. relay"
                        className="w-full"
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
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave}>Simpan Pengaturan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
