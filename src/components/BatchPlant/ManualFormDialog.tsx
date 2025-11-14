import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { SiloData } from "./SiloFillDialog";

interface ManualFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (formData: {
    pelanggan: string;
    lokasiProyek: string;
    mutuBeton: string;
    slump: string;
    targetProduksi: string;
    selectedSilo: string;
    namaSopir: string;
    nomorMobil: string;
  }) => void;
  silos: SiloData[];
}

export function ManualFormDialog({ open, onOpenChange, onStart, silos }: ManualFormDialogProps) {
  const [pelanggan, setPelanggan] = useState("");
  const [lokasiProyek, setLokasiProyek] = useState("");
  const [mutuBeton, setMutuBeton] = useState("");
  const [slump, setSlump] = useState("12"); // Default 12
  const [targetProduksi, setTargetProduksi] = useState("");
  const [selectedSilo, setSelectedSilo] = useState("");
  const [namaSopir, setNamaSopir] = useState("");
  const [nomorMobil, setNomorMobil] = useState("");
  const [jmfOptions, setJmfOptions] = useState<any[]>([]);

  // Load JMF data
  useEffect(() => {
    const savedFormulas = localStorage.getItem('job_mix_formulas');
    console.log('📋 Loading JMF from localStorage:', savedFormulas);
    
    if (savedFormulas) {
      try {
        const formulas = JSON.parse(savedFormulas);
        console.log('📋 Parsed JMF formulas:', formulas);
        setJmfOptions(formulas);
      } catch (error) {
        console.error('❌ Error loading JMF data:', error);
        setJmfOptions([]);
      }
    } else {
      console.log('⚠️ No JMF formulas found in localStorage');
      setJmfOptions([]);
    }
  }, []); // Load once on mount, not dependent on dialog open

  // Load last selected silo when dialog opens
  useEffect(() => {
    if (open) {
      const savedSilo = localStorage.getItem('last_selected_silo');
      if (savedSilo) {
        setSelectedSilo(savedSilo);
      }
    }
  }, [open]);

  const isFormValid = pelanggan !== "" && lokasiProyek !== "" && mutuBeton !== "" && slump !== "" && targetProduksi !== "" && selectedSilo !== "";

  const handleStart = () => {
    if (!isFormValid) return;

    // Save last selected silo
    localStorage.setItem('last_selected_silo', selectedSilo);

    onStart({
      pelanggan,
      lokasiProyek,
      mutuBeton,
      slump,
      targetProduksi,
      selectedSilo,
      namaSopir,
      nomorMobil,
    });

    // Reset form
    setPelanggan("");
    setLokasiProyek("");
    setMutuBeton("");
    setSlump("12");
    setTargetProduksi("");
    setNamaSopir("");
    setNomorMobil("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">FORM PRODUKSI MANUAL</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Isi data produksi manual sebelum memulai
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-3">
            {/* Pelanggan */}
            <div>
              <Label htmlFor="pelanggan" className="text-xs">Pelanggan *</Label>
              <Input
                id="pelanggan"
                value={pelanggan}
                onChange={(e) => setPelanggan(e.target.value)}
                placeholder="Nama pelanggan"
                className="h-8 text-sm"
              />
            </div>

            {/* Lokasi Proyek */}
            <div>
              <Label htmlFor="lokasi" className="text-xs">Lokasi Proyek *</Label>
              <Input
                id="lokasi"
                value={lokasiProyek}
                onChange={(e) => setLokasiProyek(e.target.value)}
                placeholder="Alamat proyek"
                className="h-8 text-sm"
              />
            </div>

            {/* Mutu Beton - Dropdown JMF */}
            <div>
              <Label htmlFor="mutu" className="text-xs">Mutu Beton *</Label>
              <Select value={mutuBeton} onValueChange={setMutuBeton}>
                <SelectTrigger className="h-8 text-sm bg-background">
                  <SelectValue placeholder="Pilih mutu beton" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-[100] max-h-[300px]">
                  {jmfOptions.length === 0 ? (
                    <SelectItem value="none" disabled>Tidak ada JMF tersimpan</SelectItem>
                  ) : (
                    jmfOptions.map((jmf) => (
                      <SelectItem key={jmf.id} value={jmf.mutuBeton}>
                        {jmf.mutuBeton}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {jmfOptions.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {jmfOptions.length} formula tersedia
                </p>
              )}
            </div>

            {/* Slump */}
            <div>
              <Label htmlFor="slump" className="text-xs">Slump (cm) *</Label>
              <Input
                id="slump"
                type="number"
                value={slump}
                onChange={(e) => setSlump(e.target.value)}
                placeholder="12"
                className="h-8 text-sm"
              />
            </div>

            {/* Volume */}
            <div>
              <Label htmlFor="targetProduksi" className="text-xs">Volume (m3) *</Label>
              <Input
                id="targetProduksi"
                type="number"
                step="0.01"
                value={targetProduksi}
                onChange={(e) => setTargetProduksi(e.target.value)}
                placeholder="Contoh: 3.5"
                className="h-8 text-sm"
              />
            </div>

            {/* Silo Selection */}
            <div>
              <Label htmlFor="silo" className="text-xs">Pilih Silo *</Label>
              <Select value={selectedSilo} onValueChange={setSelectedSilo}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Pilih silo" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {silos.map((silo) => (
                    <SelectItem key={silo.id} value={silo.id.toString()}>
                      Silo {silo.id} ({silo.currentVolume.toFixed(0)} / {silo.capacity} kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nama Sopir */}
            <div>
              <Label htmlFor="sopir" className="text-xs">Nama Sopir</Label>
              <Input
                id="sopir"
                value={namaSopir}
                onChange={(e) => setNamaSopir(e.target.value)}
                placeholder="Opsional"
                className="h-8 text-sm"
              />
            </div>

            {/* Nomor Mobil */}
            <div>
              <Label htmlFor="mobil" className="text-xs">Nomor Mobil</Label>
              <Input
                id="mobil"
                value={nomorMobil}
                onChange={(e) => setNomorMobil(e.target.value)}
                placeholder="Opsional"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            Batal
          </Button>
          <Button
            onClick={handleStart}
            disabled={!isFormValid}
            className="flex-1"
            size="sm"
          >
            Mulai Manual
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
