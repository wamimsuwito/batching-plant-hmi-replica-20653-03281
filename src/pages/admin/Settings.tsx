import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [selectedSystem, setSelectedSystem] = useState(() => {
    const saved = localStorage.getItem('batch_plant_system');
    return saved || '2'; // Default: System 2
  });
  const { toast } = useToast();

  const handleSave = () => {
    try {
      localStorage.setItem('batch_plant_system', selectedSystem);
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
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Setting Batch Plant</CardTitle>
          <CardDescription>Konfigurasi sistem penimbangan dan operasional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedSystem} onValueChange={setSelectedSystem}>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="1" id="system1" className="mt-1" />
                <Label htmlFor="system1" className="cursor-pointer flex-1">
                  <div className="font-medium text-base">1. Wet Mix Kumulatif 1 Hopper</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Penimbangan aggregate kumulatif dalam 1 hopper (pasir1 + pasir2 + batu1 + batu2). 
                    Discharge menggunakan horizontal conveyor.
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="2" id="system2" className="mt-1" />
                <Label htmlFor="system2" className="cursor-pointer flex-1">
                  <div className="font-medium text-base">2. Wet Mix 2 Hopper Aggregate (Default)</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Batu dan pasir memiliki timbangan terpisah. Sistem yang saat ini berjalan.
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="3" id="system3" className="mt-1" />
                <Label htmlFor="system3" className="cursor-pointer flex-1">
                  <div className="font-medium text-base">3. Wet Mix Kumulatif Minus</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Penimbangan kumulatif dengan sistem minus (countdown dari total berat).
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="4" id="system4" className="mt-1" />
                <Label htmlFor="system4" className="cursor-pointer flex-1">
                  <div className="font-medium text-base">4. Waiting Hopper</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Menggunakan hopper antara (buffer) sebelum material masuk ke mixer.
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="5" id="system5" className="mt-1" />
                <Label htmlFor="system5" className="cursor-pointer flex-1">
                  <div className="font-medium text-base">5. Print Preview</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Tampilkan preview sebelum print ticket final (coming soon).
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="6" id="system6" className="mt-1" />
                <Label htmlFor="system6" className="cursor-pointer flex-1">
                  <div className="font-medium text-base">6. Discharge Conveyor</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Discharge mixer menggunakan conveyor belt ke truck (coming soon).
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          <div className="pt-4">
            <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
              Simpan Setting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
