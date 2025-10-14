import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export interface SiloData {
  id: number;
  currentVolume: number;
  capacity: number;
  lastFilled?: string;
}

interface SiloFillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  silos: SiloData[];
  onFill: (siloId: number, volume: number) => void;
}

export function SiloFillDialog({ open, onOpenChange, silos, onFill }: SiloFillDialogProps) {
  const [selectedSilo, setSelectedSilo] = useState<string>("");
  const [volume, setVolume] = useState("");
  const { toast } = useToast();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSilo("");
      setVolume("");
    }
  }, [open]);

  const selectedSiloData = silos.find(s => s.id === parseInt(selectedSilo));
  const remainingCapacity = selectedSiloData 
    ? selectedSiloData.capacity - selectedSiloData.currentVolume 
    : 0;

  const handleFill = () => {
    const siloId = parseInt(selectedSilo);
    const fillVolume = parseFloat(volume);

    // Validation
    if (!selectedSilo || !volume) {
      toast({
        title: "Error",
        description: "Silakan pilih silo dan masukkan volume",
        variant: "destructive",
      });
      return;
    }

    if (fillVolume <= 0) {
      toast({
        title: "Error",
        description: "Volume harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    if (fillVolume > remainingCapacity) {
      toast({
        title: "Error",
        description: `Volume melebihi kapasitas. Maksimal pengisian: ${remainingCapacity.toLocaleString('id-ID')} kg`,
        variant: "destructive",
      });
      return;
    }

    // Fill the silo
    onFill(siloId, fillVolume);

    // Show success toast
    toast({
      title: "Berhasil",
      description: `Silo ${siloId} berhasil diisi ${fillVolume.toLocaleString('id-ID')} kg`,
    });

    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Pengisian Silo Semen</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Pilih Silo */}
          <div className="grid gap-2">
            <Label htmlFor="silo">Pilih Silo</Label>
            <Select value={selectedSilo} onValueChange={setSelectedSilo}>
              <SelectTrigger id="silo">
                <SelectValue placeholder="Pilih silo" />
              </SelectTrigger>
              <SelectContent>
                {silos.map((silo) => (
                  <SelectItem key={silo.id} value={silo.id.toString()}>
                    Silo {silo.id} - {silo.currentVolume.toLocaleString('id-ID')} kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show remaining capacity */}
          {selectedSiloData && (
            <div className="bg-muted p-3 rounded-md text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Volume Saat Ini:</span>
                <span className="font-semibold">
                  {selectedSiloData.currentVolume.toLocaleString('id-ID')} kg
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Kapasitas:</span>
                <span className="font-semibold">
                  {selectedSiloData.capacity.toLocaleString('id-ID')} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kapasitas Tersisa:</span>
                <span className="font-semibold text-primary">
                  {remainingCapacity.toLocaleString('id-ID')} kg
                </span>
              </div>
            </div>
          )}

          {/* Volume Input */}
          <div className="grid gap-2">
            <Label htmlFor="volume">Volume Pengisian (kg)</Label>
            <Input
              id="volume"
              type="number"
              placeholder="Masukkan volume"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              min="1"
              max={remainingCapacity}
              step="1000"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleFill} disabled={!selectedSilo || !volume}>
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
