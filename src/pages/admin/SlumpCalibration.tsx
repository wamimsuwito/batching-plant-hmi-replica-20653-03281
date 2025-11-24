import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSlumpEstimation, CalibrationPoint } from "@/hooks/useSlumpEstimation";
import { useRaspberryPi } from "@/hooks/useRaspberryPi";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, RotateCcw, Download, Upload, TrendingUp } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SlumpCalibration = () => {
  const { toast } = useToast();
  const { ampereData, isConnected } = useRaspberryPi();
  const { calibrationTable, saveCalibration, resetToDefault } = useSlumpEstimation(ampereData.ampere);
  
  const [editTable, setEditTable] = useState<CalibrationPoint[]>(calibrationTable);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleAddPoint = () => {
    const newPoint: CalibrationPoint = {
      ampere: 100,
      slump: 12,
    };
    setEditTable([...editTable, newPoint]);
  };

  const handleDeletePoint = (index: number) => {
    const updated = editTable.filter((_, i) => i !== index);
    setEditTable(updated);
  };

  const handleUpdatePoint = (index: number, field: 'ampere' | 'slump', value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = [...editTable];
    updated[index] = { ...updated[index], [field]: numValue };
    setEditTable(updated);
  };

  const handleSave = () => {
    if (editTable.length < 2) {
      toast({
        variant: "destructive",
        title: "Validasi Gagal",
        description: "Minimal 2 titik kalibrasi diperlukan",
      });
      return;
    }

    const sorted = [...editTable].sort((a, b) => a.ampere - b.ampere);
    saveCalibration(sorted);
    
    toast({
      title: "✅ Kalibrasi Tersimpan",
      description: `${sorted.length} titik kalibrasi berhasil disimpan`,
    });
  };

  const handleReset = () => {
    resetToDefault();
    setEditTable(calibrationTable);
    setShowResetDialog(false);
    
    toast({
      title: "🔄 Kalibrasi Direset",
      description: "Kurva kalibrasi kembali ke default",
    });
  };

  const handleExportCSV = () => {
    const csv = "Ampere,Slump\n" + editTable.map(p => `${p.ampere},${p.slump}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `slump_calibration_${Date.now()}.csv`;
    link.click();
    
    toast({
      title: "📥 Export Berhasil",
      description: "File CSV berhasil didownload",
    });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").slice(1);
        const imported: CalibrationPoint[] = lines
          .filter(line => line.trim())
          .map(line => {
            const [ampere, slump] = line.split(",").map(v => parseFloat(v.trim()));
            return { ampere, slump };
          })
          .filter(p => !isNaN(p.ampere) && !isNaN(p.slump));

        if (imported.length < 2) {
          throw new Error("Minimal 2 titik kalibrasi diperlukan");
        }

        setEditTable(imported.sort((a, b) => a.ampere - b.ampere));
        toast({
          title: "📤 Import Berhasil",
          description: `${imported.length} titik kalibrasi berhasil diimport`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Import Gagal",
          description: error.message,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kalibrasi Slump</h1>
          <p className="text-muted-foreground mt-2">
            Kalibrasi kurva ampere → slump berdasarkan data lapangan
          </p>
        </div>

        {/* Live Ampere Reading */}
        <Card className="border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Live Reading
            </CardTitle>
            <CardDescription>Data real-time dari PZEM-016 ampere meter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-card rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Ampere</p>
                <p className="text-3xl font-bold text-cyan-400 tabular-nums">
                  {isConnected ? ampereData.ampere.toFixed(1) : '--'}
                </p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Voltage</p>
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {isConnected ? ampereData.voltage.toFixed(0) : '--'}
                </p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Power</p>
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {isConnected ? (ampereData.power / 1000).toFixed(1) : '--'}
                </p>
              </div>
            </div>
            {!isConnected && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                ⚠️ Controller tidak terhubung
              </p>
            )}
          </CardContent>
        </Card>

        {/* Calibration Table Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Tabel Kalibrasi</CardTitle>
            <CardDescription>
              Edit titik-titik kalibrasi untuk kurva ampere → slump
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {editTable.sort((a, b) => a.ampere - b.ampere).map((point, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Ampere (A)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={point.ampere}
                        onChange={(e) => handleUpdatePoint(index, 'ampere', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Slump (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={point.slump}
                        onChange={(e) => handleUpdatePoint(index, 'slump', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePoint(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAddPoint} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Titik
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            💾 Simpan Kalibrasi
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <div className="inline-block">
            <input
              type="file"
              accept=".csv"
              id="import-csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-csv')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
          <Button variant="destructive" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Default
          </Button>
        </div>

        {/* Instructions */}
        <Card className="border-yellow-500/30 bg-yellow-950/10">
          <CardHeader>
            <CardTitle className="text-sm">💡 Cara Kalibrasi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Jalankan produksi dengan mix design yang diketahui</li>
              <li>Catat pembacaan ampere saat mixing (di Live Reading)</li>
              <li>Ukur slump aktual menggunakan slump cone test</li>
              <li>Input data ampere dan slump ke tabel kalibrasi</li>
              <li>Ulangi untuk berbagai mix design (minimal 5-10 batch)</li>
              <li>Simpan kalibrasi untuk estimasi otomatis</li>
            </ol>
            <p className="mt-3 text-yellow-600 dark:text-yellow-400">
              ⚠️ Akurasi estimasi tergantung pada jumlah dan kualitas data kalibrasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset ke Default?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua kalibrasi custom akan dihapus dan diganti dengan kurva default.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SlumpCalibration;
