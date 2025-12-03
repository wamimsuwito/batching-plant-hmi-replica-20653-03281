import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { forceResetStorage } from '@/utils/storageVersioning';
import { Download, Upload, FileJson } from 'lucide-react';

// Keys to backup/restore
const BACKUP_KEYS = [
  'company-settings',
  'job_mix_formulas',
  'relay_settings',
  'mixing_sequence_timers',
  'bp_naming',
  'batch_plant_system',
  'batch_plant_accessories',
  'klakson_duration',
  'slump_calibration_data',
  'moisture_control',
  'com_port_settings',
  'users_data'
];

export default function Settings() {
  const [selectedSystem, setSelectedSystem] = useState(() => {
    const saved = localStorage.getItem('batch_plant_system');
    return saved || '2'; // Default: System 2
  });
  
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>(() => {
    const saved = localStorage.getItem('batch_plant_accessories');
    return saved ? JSON.parse(saved) : []; // Default: no accessories
  });
  
  const [klaksonDuration, setKlaksonDuration] = useState(() => {
    const saved = localStorage.getItem('klakson_duration');
    return saved || '1500'; // Default: 1500ms
  });
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      localStorage.setItem('klakson_duration', klaksonDuration);
      
      toast({
        title: '✅ Berhasil',
        description: 'Pengaturan sistem dan timing telah disimpan.',
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

  const handleResetAllSettings = () => {
    if (window.confirm('⚠️ PERINGATAN: Ini akan menghapus SEMUA pengaturan aplikasi dan reload aplikasi.\n\nGunakan ini jika aplikasi bermasalah setelah update.\n\nLanjutkan?')) {
      forceResetStorage();
      toast({
        title: '🔄 Reset Selesai',
        description: 'Semua pengaturan telah dihapus. Aplikasi akan reload...',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleExportSettings = () => {
    try {
      const backup: Record<string, unknown> = {};
      
      BACKUP_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            backup[key] = JSON.parse(value);
          } catch {
            backup[key] = value;
          }
        }
      });

      backup._exportDate = new Date().toISOString();
      backup._appVersion = '1.0.0';

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batching-plant-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: '✅ Export Berhasil',
        description: 'File backup telah diunduh.',
      });
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast({
        title: '❌ Error',
        description: 'Gagal mengexport pengaturan',
        variant: 'destructive',
      });
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        
        if (!backup._exportDate) {
          throw new Error('Invalid backup file format');
        }

        if (!window.confirm(`⚠️ Import akan mengganti semua pengaturan saat ini.\n\nFile backup dari: ${new Date(backup._exportDate).toLocaleString('id-ID')}\n\nLanjutkan?`)) {
          return;
        }

        BACKUP_KEYS.forEach(key => {
          if (backup[key] !== undefined) {
            const value = typeof backup[key] === 'string' ? backup[key] : JSON.stringify(backup[key]);
            localStorage.setItem(key, value);
          }
        });

        toast({
          title: '✅ Import Berhasil',
          description: 'Pengaturan telah diimport. Aplikasi akan reload...',
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        console.error('Error importing settings:', error);
        toast({
          title: '❌ Error',
          description: 'File backup tidak valid atau rusak',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* BACKUP & RESTORE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Backup & Restore Konfigurasi
          </CardTitle>
          <CardDescription>Export atau import semua pengaturan aplikasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleExportSettings} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Semua Pengaturan
            </Button>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="hidden"
                id="import-file"
              />
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Import Pengaturan
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Backup mencakup: Company settings, Job Mix Formula, Relay settings, Mixing sequence, BP naming, Slump calibration, dll.
          </p>
        </CardContent>
      </Card>

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

      {/* TIMING SETTINGS */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Timing Produksi</CardTitle>
          <CardDescription>Atur durasi klakson (Horn) saat produksi selesai</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="klakson-duration" className="text-base font-medium">
              Durasi Klakson (ms)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="klakson-duration"
                type="number"
                min="500"
                max="10000"
                step="100"
                value={klaksonDuration}
                onChange={(e) => setKlaksonDuration(e.target.value)}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">
                Lama klakson berbunyi setelah produksi selesai ({(Number(klaksonDuration) / 1000).toFixed(1)} detik)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center gap-4">
        <Button 
          variant="destructive" 
          onClick={handleResetAllSettings}
          size="lg"
        >
          🗑️ Reset Semua Pengaturan
        </Button>
        
        <Button onClick={handleSave} size="lg">
          Simpan Setting
        </Button>
      </div>
    </div>
  );
}
