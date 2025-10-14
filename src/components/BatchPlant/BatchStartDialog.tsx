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
import { ScrollArea } from "@/components/ui/scroll-area";

interface BatchStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
}

export function BatchStartDialog({ open, onOpenChange, onStart }: BatchStartDialogProps) {
  const [mutuBeton, setMutuBeton] = useState("");
  const [volume, setVolume] = useState("");
  const [slump, setSlump] = useState("");
  const [pelanggan, setPelanggan] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [noKendaraan, setNoKendaraan] = useState("");
  const [sopir, setSopir] = useState("");
  const [jmfOptions, setJmfOptions] = useState<string[]>([]);

  // Load JMF data from localStorage
  useEffect(() => {
    const savedFormulas = localStorage.getItem('job_mix_formulas');
    if (savedFormulas) {
      try {
        const formulas = JSON.parse(savedFormulas);
        const mutuBetonList = formulas.map((f: any) => f.mutuBeton).filter(Boolean);
        setJmfOptions(mutuBetonList);
      } catch (error) {
        console.error('Error loading JMF data:', error);
        setJmfOptions([]);
      }
    }
  }, [open]);

  const isFormValid = mutuBeton !== "" && volume !== "" && slump !== "";

  const handleStart = () => {
    if (isFormValid) {
      onStart();
      onOpenChange(false);
      // Reset form
      setMutuBeton("");
      setVolume("");
      setSlump("");
      setPelanggan("");
      setLokasi("");
      setNoKendaraan("");
      setSopir("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Konfigurasi Batch</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            {/* Mutu Beton - Required */}
            <div className="grid gap-2">
              <Label htmlFor="mutu-beton">
                Mutu Beton <span className="text-destructive">*</span>
              </Label>
              <Select value={mutuBeton} onValueChange={setMutuBeton}>
                <SelectTrigger id="mutu-beton">
                  <SelectValue placeholder="Pilih mutu beton" />
                </SelectTrigger>
                <SelectContent>
                  {jmfOptions.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      Belum ada formula yang tersimpan.
                      <br />
                      Silakan tambahkan di menu Job Mix Formula.
                    </div>
                  ) : (
                    jmfOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Volume - Required */}
            <div className="grid gap-2">
              <Label htmlFor="volume">
                Volume (m³) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="volume"
                type="number"
                placeholder="Masukkan volume"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            {/* Slump - Required */}
            <div className="grid gap-2">
              <Label htmlFor="slump">
                Slump (cm) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slump"
                type="number"
                placeholder="Masukkan slump"
                value={slump}
                onChange={(e) => setSlump(e.target.value)}
                min="0"
                step="1"
              />
            </div>

            {/* Pelanggan - Optional */}
            <div className="grid gap-2">
              <Label htmlFor="pelanggan">Pelanggan</Label>
              <Input
                id="pelanggan"
                placeholder="Masukkan nama pelanggan"
                value={pelanggan}
                onChange={(e) => setPelanggan(e.target.value)}
              />
            </div>

            {/* Lokasi - Optional */}
            <div className="grid gap-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                placeholder="Masukkan lokasi"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
              />
            </div>

            {/* No. Kendaraan - Optional */}
            <div className="grid gap-2">
              <Label htmlFor="no-kendaraan">No. Kendaraan</Label>
              <Input
                id="no-kendaraan"
                placeholder="Masukkan no. kendaraan"
                value={noKendaraan}
                onChange={(e) => setNoKendaraan(e.target.value)}
              />
            </div>

            {/* Sopir - Optional */}
            <div className="grid gap-2">
              <Label htmlFor="sopir">Sopir</Label>
              <Input
                id="sopir"
                placeholder="Masukkan nama sopir"
                value={sopir}
                onChange={(e) => setSopir(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleStart}
            disabled={!isFormValid}
            className="w-full sm:w-auto"
          >
            Mulai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
