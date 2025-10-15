import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MixingData {
  mixing: number;
  timer: number;
}

interface MixingSequence {
  pasir: MixingData;
  batu: MixingData;
  air: MixingData;
}

export default function MixingSequence() {
  const { toast } = useToast();
  const [sequence, setSequence] = useState<MixingSequence>({
    pasir: { mixing: 0, timer: 0 },
    batu: { mixing: 0, timer: 0 },
    air: { mixing: 0, timer: 0 },
  });

  const handleChange = (material: keyof MixingSequence, field: keyof MixingData, value: string) => {
    const numValue = parseInt(value) || 0;
    setSequence(prev => ({
      ...prev,
      [material]: {
        ...prev[material],
        [field]: numValue
      }
    }));
  };

  const handleSave = () => {
    toast({
      title: "Tersimpan",
      description: "Urutan mixing berhasil disimpan",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Urutan Mixing</h1>
        <p className="text-muted-foreground mt-1">Atur urutan dan timer untuk proses mixing material</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>URUTAN MIXING</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 pb-2 border-b">
              <div className="font-semibold text-foreground">Material</div>
              <div className="font-semibold text-foreground text-center">MIXING</div>
              <div className="font-semibold text-foreground text-center">TIMER</div>
            </div>

            {/* PASIR */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-base font-medium">PASIR</Label>
              <Input
                type="number"
                value={sequence.pasir.mixing}
                onChange={(e) => handleChange('pasir', 'mixing', e.target.value)}
                className="text-center"
                min="0"
              />
              <Input
                type="number"
                value={sequence.pasir.timer}
                onChange={(e) => handleChange('pasir', 'timer', e.target.value)}
                className="text-center"
                min="0"
              />
            </div>

            {/* BATU */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-base font-medium">BATU</Label>
              <Input
                type="number"
                value={sequence.batu.mixing}
                onChange={(e) => handleChange('batu', 'mixing', e.target.value)}
                className="text-center"
                min="0"
              />
              <Input
                type="number"
                value={sequence.batu.timer}
                onChange={(e) => handleChange('batu', 'timer', e.target.value)}
                className="text-center"
                min="0"
              />
            </div>

            {/* AIR */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-base font-medium">AIR</Label>
              <Input
                type="number"
                value={sequence.air.mixing}
                onChange={(e) => handleChange('air', 'mixing', e.target.value)}
                className="text-center"
                min="0"
              />
              <Input
                type="number"
                value={sequence.air.timer}
                onChange={(e) => handleChange('air', 'timer', e.target.value)}
                className="text-center"
                min="0"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave}>Simpan</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
