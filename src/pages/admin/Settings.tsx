import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SettingsConfig {
  wetMixKumulatif1Hopper: boolean;
  wetMix2Hopper: boolean;
  wetMixKumulatifMinus: boolean;
  waitingHopper: boolean;
  printPreview: boolean;
  dischargeConveyor: boolean;
}

const defaultSettings: SettingsConfig = {
  wetMixKumulatif1Hopper: false,
  wetMix2Hopper: true,
  wetMixKumulatifMinus: false,
  waitingHopper: false,
  printPreview: false,
  dischargeConveyor: false,
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('batch_plant_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleCheckboxChange = (key: keyof SettingsConfig) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('batch_plant_settings', JSON.stringify(settings));
      toast({
        title: '✅ Berhasil',
        description: 'Pengaturan telah disimpan',
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
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="wetMixKumulatif1Hopper"
                checked={settings.wetMixKumulatif1Hopper}
                onCheckedChange={() => handleCheckboxChange('wetMixKumulatif1Hopper')}
              />
              <Label htmlFor="wetMixKumulatif1Hopper" className="text-sm font-normal cursor-pointer">
                Wet mix type kumulatif, penimbangan aggregate jadi 1 hopper
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="wetMix2Hopper"
                checked={settings.wetMix2Hopper}
                onCheckedChange={() => handleCheckboxChange('wetMix2Hopper')}
              />
              <Label htmlFor="wetMix2Hopper" className="text-sm font-normal cursor-pointer">
                Wet mix dengan 2 hopper aggregate, batu dan pasir memiliki timbangan terpisah
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="wetMixKumulatifMinus"
                checked={settings.wetMixKumulatifMinus}
                onCheckedChange={() => handleCheckboxChange('wetMixKumulatifMinus')}
              />
              <Label htmlFor="wetMixKumulatifMinus" className="text-sm font-normal cursor-pointer">
                Wet mix type kumulatif dengan system penimbangan minus
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="waitingHopper"
                checked={settings.waitingHopper}
                onCheckedChange={() => handleCheckboxChange('waitingHopper')}
              />
              <Label htmlFor="waitingHopper" className="text-sm font-normal cursor-pointer">
                Waiting Hopper
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="printPreview"
                checked={settings.printPreview}
                onCheckedChange={() => handleCheckboxChange('printPreview')}
              />
              <Label htmlFor="printPreview" className="text-sm font-normal cursor-pointer">
                Print preview
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="dischargeConveyor"
                checked={settings.dischargeConveyor}
                onCheckedChange={() => handleCheckboxChange('dischargeConveyor')}
              />
              <Label htmlFor="dischargeConveyor" className="text-sm font-normal cursor-pointer">
                Discharge conveyor
              </Label>
            </div>
          </div>

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
