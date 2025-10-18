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
import { useToast } from "@/hooks/use-toast";

export interface SiloData {
  id: number;
  currentVolume: number;
  capacity: number;
  lastFilled?: string;
}

interface BatchStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (config: {
    selectedSilos: number[];
    selectedBins: {
      pasir: number;
      batu: number;
    };
    targetWeights: {
      pasir: number;
      batu: number;
      semen: number;
      air: number;
      additive: number;
    };
    mixingTime: number;
    jumlahMixing: number;
    currentMixing: number;
  }) => void;
  silos: SiloData[];
}

export function BatchStartDialog({ open, onOpenChange, onStart, silos }: BatchStartDialogProps) {
  const [mutuBeton, setMutuBeton] = useState("");
  const [volume, setVolume] = useState("");
  const [slump, setSlump] = useState("12"); // Default 12 cm
  const [pelanggan, setPelanggan] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [noKendaraan, setNoKendaraan] = useState("");
  const [sopir, setSopir] = useState("");
  const [selectedSilo, setSelectedSilo] = useState<string>(""); // Single silo dropdown
  const [jumlahMixing, setJumlahMixing] = useState<string>("2"); // Default 2
  const [mixingTime, setMixingTime] = useState<string>("10");
  const [jmfOptions, setJmfOptions] = useState<any[]>([]);
  const { toast } = useToast();

  // Auto-calculate jumlahMixing from volume
  useEffect(() => {
    if (volume && parseFloat(volume) > 0) {
      const calculatedMixing = Math.ceil(parseFloat(volume) / 3.5);
      setJumlahMixing(calculatedMixing.toString());
    }
  }, [volume]);

  // Load JMF data and relay settings
  useEffect(() => {
    const savedFormulas = localStorage.getItem('job_mix_formulas');
    if (savedFormulas) {
      try {
        const formulas = JSON.parse(savedFormulas);
        setJmfOptions(formulas);
      } catch (error) {
        console.error('Error loading JMF data:', error);
        setJmfOptions([]);
      }
    }

    const savedRelaySettings = localStorage.getItem('relay_settings');
    if (savedRelaySettings) {
      try {
        const relaySettings = JSON.parse(savedRelaySettings);
        const mixingRelay = relaySettings.find((r: any) => r.name === 'Waktu Mixing (detik)');
        if (mixingRelay?.timer1) {
          setMixingTime(mixingRelay.timer1);
        }
      } catch (error) {
        console.error('Error loading relay settings:', error);
      }
    }
  }, [open]);

  const isFormValid = mutuBeton !== "" && volume !== "" && slump !== "" && selectedSilo !== "" && jumlahMixing !== "";

  const handleStart = () => {
    if (!isFormValid) return;

    // Get selected JMF data
    const selectedFormula = jmfOptions.find((f: any) => f.mutuBeton === mutuBeton);
    if (!selectedFormula) {
      toast({
        title: "Error",
        description: "Formula tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    // Calculate total material requirements and divide by jumlahMixing
    const batchVolume = parseFloat(volume);
    const mixingCount = parseInt(jumlahMixing);
    
    // Calculate total weights
    const totalWeights = {
      semen: (parseFloat(selectedFormula.semen) || 0) * batchVolume,
      pasir: (parseFloat(selectedFormula.pasir) || 0) * batchVolume,
      batu: (parseFloat(selectedFormula.batu1) || 0) * batchVolume + (parseFloat(selectedFormula.batu2) || 0) * batchVolume,
      air: (parseFloat(selectedFormula.air) || 0) * batchVolume,
      additive: (parseFloat(selectedFormula.additive) || 0) * batchVolume,
    };
    
    // Divide equally per mixing
    const targetWeights = {
      semen: totalWeights.semen / mixingCount,
      pasir: totalWeights.pasir / mixingCount,
      batu: totalWeights.batu / mixingCount,
      air: totalWeights.air / mixingCount,
      additive: totalWeights.additive / mixingCount,
    };

    // Check if selected silo has enough cement (can go negative)
    const siloId = parseInt(selectedSilo);
    const silo = silos.find(s => s.id === siloId);
    const totalCementNeeded = totalWeights.semen;
    
    // Note: We allow negative silo values, so no check needed here

    // Start production
    onStart({
      selectedSilos: [parseInt(selectedSilo)], // Single silo as array
      selectedBins: {
        pasir: 1, // Bin 1 untuk PASIR
        batu: 2,  // Bin 2 untuk BATU 1
      },
      targetWeights, // Already divided per mixing
      mixingTime: parseInt(mixingTime),
      jumlahMixing: mixingCount,
      currentMixing: 1, // Start with mixing 1
    });

    onOpenChange(false);
    
    // Reset form
    setMutuBeton("");
    setVolume("");
    setSlump("12");
    setPelanggan("");
    setLokasi("");
    setNoKendaraan("");
    setSopir("");
    setSelectedSilo("");
    setJumlahMixing("2");
    setMixingTime("120");
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
                    jmfOptions.map((formula: any) => (
                      <SelectItem key={formula.id} value={formula.mutuBeton}>
                        {formula.mutuBeton}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Volume & Jumlah Mixing - Horizontal (Opsi A) */}
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="jumlah-mixing">
                  Jumlah Mixing <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jumlah-mixing"
                  type="number"
                  placeholder="Auto dari volume"
                  value={jumlahMixing}
                  onChange={(e) => setJumlahMixing(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">↑ auto dari volume</p>
              </div>
            </div>

            {/* Slump - Required (Dropdown) */}
            <div className="grid gap-2">
              <Label htmlFor="slump">
                Slump <span className="text-destructive">*</span>
              </Label>
              <Select value={slump} onValueChange={setSlump}>
                <SelectTrigger id="slump">
                  <SelectValue placeholder="Pilih slump" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 cm</SelectItem>
                  <SelectItem value="10">10 cm</SelectItem>
                  <SelectItem value="12">12 cm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pilih Silo Semen - Required (Single Dropdown) */}
            <div className="grid gap-2">
              <Label htmlFor="silo-select">
                Pilih Silo Semen <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedSilo} onValueChange={setSelectedSilo}>
                <SelectTrigger id="silo-select">
                  <SelectValue placeholder="Pilih silo" />
                </SelectTrigger>
                <SelectContent>
                  {silos.map((silo) => {
                    const isNegative = silo.currentVolume < 0;
                    return (
                      <SelectItem key={silo.id} value={silo.id.toString()}>
                        Silo {silo.id} - {silo.currentVolume.toLocaleString('id-ID')} kg
                        {isNegative && " ⚠️"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Mixing Time */}
            <div className="grid gap-2">
              <Label htmlFor="mixing-time">
                Waktu Mixing (detik) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mixing-time"
                type="number"
                placeholder="Masukkan waktu mixing"
                value={mixingTime}
                onChange={(e) => setMixingTime(e.target.value)}
                min="1"
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
