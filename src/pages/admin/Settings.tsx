import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [selectedSystem, setSelectedSystem] = useState(() => {
    const saved = localStorage.getItem('batch_plant_system');
    return saved || '2'; // Default: System 2
  });
  
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>(() => {
    const saved = localStorage.getItem('batch_plant_accessories');
    return saved ? JSON.parse(saved) : []; // Default: no accessories
  });
  
  const { toast } = useToast();

  const handleAccessoryToggle = (accessoryId: string) => {
    setSelectedAccessories(prev => {
      if (prev.includes(accessoryId)) {
        return prev.filter(id => id !== accessoryId);
      } else {
        return [...prev, accessoryId];
      }
    });
  };

  const handleSave = () => {
    try {
      // Validate: Accessory 6 only for System 1
      if (selectedAccessories.includes('6') && selectedSystem !== '1') {
        toast({
          title: '⚠️ Peringatan',
          description: 'Aksesori "Discharge Conveyor" hanya tersedia untuk System 1. Aksesori ini telah dihapus.',
          variant: 'destructive',
        });
        setSelectedAccessories(prev => prev.filter(a => a !== '6'));
        return;
      }
      
      localStorage.setItem('batch_plant_system', selectedSystem);
      localStorage.setItem('batch_plant_accessories', JSON.stringify(selectedAccessories));
      
      toast({
        title: '✅ Berhasil',
        description: 'Sistem batch plant telah disimpan. Refresh halaman untuk menerapkan perubahan.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: '❌ Error',
        description: 'Gagal menyimpan pengaturan',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* MAIN SYSTEMS (Radio Group - Single Selection) */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Utama Batching Plant</CardTitle>
          <CardDescription>Pilih salah satu sistem penimbangan (hanya bisa pilih 1)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedSystem} onValueChange={setSelectedSystem}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                <RadioGroupItem value="1" id="system1" className="mt-1" />
                <Label htmlFor="system1" className="cursor-pointer flex-1">
                  <div className="font-semibold text-base">System 1: Wet Mix Kumulatif 1 Hopper + Horizontal Conveyor</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Penimbangan aggregate kumulatif dalam 1 hopper panjang (pasir1 → pasir2 → batu1 → batu2). 
                    Discharge menggunakan horizontal conveyor terintegrasi (tanpa pintu hopper).
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                <RadioGroupItem value="2" id="system2" className="mt-1" />
                <Label htmlFor="system2" className="cursor-pointer flex-1">
                  <div className="font-semibold text-base">System 2: Wet Mix 2 Hopper Aggregate (Default)</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Batu dan pasir memiliki timbangan terpisah. Sistem yang saat ini berjalan.
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                <RadioGroupItem value="3" id="system3" className="mt-1" />
                <Label htmlFor="system3" className="cursor-pointer flex-1">
                  <div className="font-semibold text-base">System 3: Storage Bin Weighing</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Penimbangan langsung di storage bin (default 10,000 kg pasir & batu). 
                    Material berkurang saat digunakan. Tidak ada weigh hopper, langsung ke conveyor.
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* ACCESSORIES (Checkboxes - Multiple Selection) */}
      <Card>
        <CardHeader>
          <CardTitle>Aksesori Batching Plant</CardTitle>
          <CardDescription>Pilih aksesori tambahan (boleh lebih dari satu)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
            <Checkbox 
              id="accessory4" 
              checked={selectedAccessories.includes('4')}
              onCheckedChange={() => handleAccessoryToggle('4')}
              className="mt-1"
            />
            <Label htmlFor="accessory4" className="cursor-pointer flex-1">
              <div className="font-medium text-base">Waiting Hopper (Buffer Hopper)</div>
              <div className="text-sm text-muted-foreground mt-1">
                Aggregate tertimbang ditampung di waiting hopper sebelum masuk mixer. 
                Meningkatkan efisiensi karena mixing berikutnya bisa ditimbang sambil mixing saat ini berjalan.
              </div>
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
            <Checkbox 
              id="accessory5" 
              checked={selectedAccessories.includes('5')}
              onCheckedChange={() => handleAccessoryToggle('5')}
              className="mt-1"
            />
            <Label htmlFor="accessory5" className="cursor-pointer flex-1">
              <div className="font-medium text-base">Print Preview</div>
              <div className="text-sm text-muted-foreground mt-1">
                Tampilkan preview ticket sebelum print final.
              </div>
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
            <Checkbox 
              id="accessory6" 
              checked={selectedAccessories.includes('6')}
              onCheckedChange={() => handleAccessoryToggle('6')}
              disabled={selectedSystem !== '1'}
              className="mt-1"
            />
            <Label htmlFor="accessory6" className={`cursor-pointer flex-1 ${selectedSystem !== '1' ? 'opacity-50' : ''}`}>
              <div className="font-medium text-base">Discharge Conveyor (Hanya untuk System 1)</div>
              <div className="text-sm text-muted-foreground mt-1">
                Discharge mixer menggunakan conveyor belt ke truck. 
                {selectedSystem !== '1' && ' (Tidak tersedia - hanya untuk System 1)'}
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Simpan Setting
        </Button>
      </div>
    </div>
  );
}
