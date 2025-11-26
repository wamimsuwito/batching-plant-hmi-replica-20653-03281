import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface MoistureControlSettings {
  pasir: number;
  batu: number;
  air: number;
}

interface MoistureControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: MoistureControlSettings) => void;
}

export function MoistureControlDialog({ open, onOpenChange, onSettingsChange }: MoistureControlDialogProps) {
  const { toast } = useToast();
  const [pasir, setPasir] = useState("0");
  const [batu, setBatu] = useState("0");
  const [air, setAir] = useState("0");

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('moisture_control_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setPasir(settings.pasir.toString());
        setBatu(settings.batu.toString());
        setAir(settings.air.toString());
      } catch (error) {
        console.error('Error loading moisture settings:', error);
      }
    }
  }, [open]);

  // Calculate total adjustment and preview
  const totalAdjustment = (parseFloat(pasir) || 0) + (parseFloat(batu) || 0) + (parseFloat(air) || 0);
  
  // Get preview using K300 as example (160 kg/m³)
  const exampleWater = 160;
  const adjustedWater = Math.round(exampleWater * (1 + totalAdjustment / 100));

  const handleSave = () => {
    // Validate inputs
    const pasirVal = parseFloat(pasir) || 0;
    const batuVal = parseFloat(batu) || 0;
    const airVal = parseFloat(air) || 0;

    if (pasirVal < -50 || pasirVal > 50 || batuVal < -50 || batuVal > 50 || airVal < -50 || airVal > 50) {
      toast({
        title: "Input Tidak Valid",
        description: "Nilai adjustment harus antara -50% sampai +50%",
        variant: "destructive",
      });
      return;
    }

    const settings = {
      pasir: pasirVal,
      batu: batuVal,
      air: airVal,
    };

    // Save to localStorage
    localStorage.setItem('moisture_control_settings', JSON.stringify(settings));
    
    // Notify parent
    onSettingsChange(settings);

    toast({
      title: "Moisture Control Tersimpan",
      description: `Total adjustment: ${totalAdjustment > 0 ? '+' : ''}${totalAdjustment}%`,
    });

    onOpenChange(false);
  };

  const handleReset = () => {
    setPasir("0");
    setBatu("0");
    setAir("0");
  };

  const isActive = totalAdjustment !== 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">MOISTURE CONTROL</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pasir Input */}
          <div className="space-y-2">
            <Label htmlFor="pasir" className="text-base font-semibold">
              Pasir (Moisture %)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="pasir"
                type="number"
                value={pasir}
                onChange={(e) => setPasir(e.target.value)}
                placeholder="0"
                className="text-lg font-mono"
                step="0.5"
              />
              <span className="text-muted-foreground font-semibold">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Kelembaban pasir (negatif = basah, positif = kering)
            </p>
          </div>

          {/* Batu Input */}
          <div className="space-y-2">
            <Label htmlFor="batu" className="text-base font-semibold">
              Batu (Moisture %)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="batu"
                type="number"
                value={batu}
                onChange={(e) => setBatu(e.target.value)}
                placeholder="0"
                className="text-lg font-mono"
                step="0.5"
              />
              <span className="text-muted-foreground font-semibold">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Kelembaban batu (negatif = basah, positif = kering)
            </p>
          </div>

          {/* Air Input */}
          <div className="space-y-2">
            <Label htmlFor="air" className="text-base font-semibold">
              Air (Adjustment %)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="air"
                type="number"
                value={air}
                onChange={(e) => setAir(e.target.value)}
                placeholder="0"
                className="text-lg font-mono"
                step="0.5"
              />
              <span className="text-muted-foreground font-semibold">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Koreksi langsung pemakaian air
            </p>
          </div>

          {/* Preview Section */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Preview (Contoh: K300, 160 kg air/m³)</h3>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Adjustment:</span>
                <span className={`font-bold text-lg ${totalAdjustment > 0 ? 'text-orange-500' : totalAdjustment < 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                  {totalAdjustment > 0 ? '+' : ''}{totalAdjustment.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Air setelah adjustment:</span>
                <span className="font-bold text-lg text-primary">
                  {adjustedWater} kg
                </span>
              </div>
              {isActive && (
                <p className="text-xs text-muted-foreground italic mt-2">
                  {totalAdjustment < 0 ? '⬇️ Air akan dikurangi' : '⬆️ Air akan ditambah'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
