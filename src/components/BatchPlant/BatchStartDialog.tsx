import { useState, useEffect, useRef } from "react";
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
      pasir1: number;
      pasir2: number;
      batu1: number;
      batu2: number;
    };
    targetWeights: {
      pasir1: number;
      pasir2: number;
      batu1: number;
      batu2: number;
      semen: number;
      air: number;
      additive: number;
    };
    mixingTime: number;
    jumlahMixing: number;
    currentMixing: number;
    // Additional form data for ticket generation
    mutuBeton?: string;
    volume?: number;
    slump?: string;
    pelanggan?: string;
    lokasi?: string;
    noKendaraan?: string;
    sopir?: string;
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
  const defaultMixingTimeRef = useRef<string>("10"); // Store default mixing time

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
          const timeValue = mixingRelay.timer1;
          setMixingTime(timeValue);
          defaultMixingTimeRef.current = timeValue; // Save as default
        }
      } catch (error) {
        console.error('Error loading relay settings:', error);
      }
    }

    // Load last selected silo
    const savedSilo = localStorage.getItem('last_selected_silo');
    if (savedSilo) {
      setSelectedSilo(savedSilo);
    }
  }, [open]);

  const isFormValid = mutuBeton !== "" && volume !== "" && slump !== "" && selectedSilo !== "" && jumlahMixing !== "";
  
  // Helper to check which required fields are missing
  const missingFields = [];
  if (!mutuBeton) missingFields.push("Mutu Beton");
  if (!volume) missingFields.push("Volume");
  if (!slump) missingFields.push("Slump");
  if (!selectedSilo) missingFields.push("Silo");
  if (!jumlahMixing) missingFields.push("Jumlah Mixing");

  const handleStart = () => {
    if (!isFormValid) return;

    // Get selected JMF data
    const selectedFormula = jmfOptions.find((f: any) => f.mutuBeton === mutuBeton);
    if (!selectedFormula) {
      console.error('❌ Formula tidak ditemukan untuk mutu:', mutuBeton);
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
    
    // Calculate total weights for 4 aggregate materials
    const totalWeights = {
      semen: (parseFloat(selectedFormula.semen) || 0) * batchVolume,
      pasir1: (parseFloat(selectedFormula.pasir1) || 0) * batchVolume,
      pasir2: (parseFloat(selectedFormula.pasir2) || 0) * batchVolume,
      batu1: (parseFloat(selectedFormula.batu1) || 0) * batchVolume,
      batu2: (parseFloat(selectedFormula.batu2) || 0) * batchVolume,
      air: (parseFloat(selectedFormula.air) || 0) * batchVolume,
      additive: (parseFloat(selectedFormula.additive) || 0) * batchVolume,
    };
    
    // Load moisture control settings and apply to water
    const moistureSettings = JSON.parse(
      localStorage.getItem('moisture_control_settings') || 
      '{"pasir":0,"batu":0,"air":0}'
    );
    
    // Calculate total moisture adjustment
    const totalMoistureAdjustment = 
      moistureSettings.pasir + 
      moistureSettings.batu + 
      moistureSettings.air;
    
    // Apply moisture adjustment to water
    const adjustedWater = Math.round(
      totalWeights.air * (1 + totalMoistureAdjustment / 100)
    );
    
    // Divide equally per mixing
    const targetWeights = {
      semen: totalWeights.semen / mixingCount,
      pasir1: totalWeights.pasir1 / mixingCount,
      pasir2: totalWeights.pasir2 / mixingCount,
      batu1: totalWeights.batu1 / mixingCount,
      batu2: totalWeights.batu2 / mixingCount,
      air: adjustedWater / mixingCount,
      additive: totalWeights.additive / mixingCount,
    };

    // Auto-select bins based on which materials are needed
    const selectedBins = {
      pasir1: totalWeights.pasir1 > 0 ? 1 : 0,  // Bin 1 if pasir1 needed
      pasir2: totalWeights.pasir2 > 0 ? 2 : 0,  // Bin 2 if pasir2 needed
      batu1: totalWeights.batu1 > 0 ? 3 : 0,    // Bin 3 if batu1 needed
      batu2: totalWeights.batu2 > 0 ? 4 : 0,    // Bin 4 if batu2 needed
    };

    console.log('📊 Batch Configuration:', {
      totalWeights,
      targetWeights,
      selectedBins,
      mixingCount
    });
    
    console.log('🚀 CALLING startProduction - Belt Atas should turn ON immediately');

    // Start production with full config including form data
    onStart({
      selectedSilos: [parseInt(selectedSilo)],
      selectedBins,
      targetWeights,
      mixingTime: parseInt(mixingTime),
      jumlahMixing: mixingCount,
      currentMixing: 1,
      // Additional form data for ticket
      mutuBeton,
      volume: batchVolume,
      slump,
      pelanggan: pelanggan || "",
      lokasi: lokasi || "",
      noKendaraan: noKendaraan || "",
      sopir: sopir || "",
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
    // Don't reset selectedSilo - keep it persistent
    setJumlahMixing("2");
    setMixingTime(defaultMixingTimeRef.current); // Use default from Relay Settings or "10"
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
                  step="0.5"
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
              <Select value={selectedSilo} onValueChange={(value) => {
                setSelectedSilo(value);
                localStorage.setItem('last_selected_silo', value);
              }}>
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

        <div className="flex flex-col gap-2 pt-4 border-t">
          {!isFormValid && missingFields.length > 0 && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              ⚠️ Lengkapi field berikut: <span className="font-semibold">{missingFields.join(", ")}</span>
            </div>
          )}
          <Button
            onClick={handleStart}
            disabled={!isFormValid}
            className="w-full sm:w-auto"
          >
            {isFormValid ? "Mulai Produksi" : `Lengkapi Form (${missingFields.length} field)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
