import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface BPNamingData {
  lokasiBP: string;
  inisialBP: string;
  nomorBP: string;
}

const BPNaming = () => {
  const [formData, setFormData] = useState<BPNamingData>({
    lokasiBP: '',
    inisialBP: '',
    nomorBP: '',
  });
  const { toast } = useToast();

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bp_naming_config');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    // Validate
    if (!formData.lokasiBP || !formData.inisialBP || !formData.nomorBP) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('bp_naming_config', JSON.stringify(formData));
    
    toast({
      title: "Berhasil",
      description: "Konfigurasi Penamaan BP berhasil disimpan",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Penamaan BP (Batch Plant)</CardTitle>
          <CardDescription>
            Konfigurasi identitas dan penamaan untuk Batch Plant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lokasi BP */}
          <div className="space-y-2">
            <Label htmlFor="lokasiBP">Lokasi BP *</Label>
            <Input
              id="lokasiBP"
              value={formData.lokasiBP}
              onChange={(e) => setFormData({ ...formData, lokasiBP: e.target.value })}
              placeholder="Contoh: Jakarta Utara"
            />
          </div>

          {/* Inisial BP */}
          <div className="space-y-2">
            <Label htmlFor="inisialBP">Inisial BP *</Label>
            <Input
              id="inisialBP"
              value={formData.inisialBP}
              onChange={(e) => setFormData({ ...formData, inisialBP: e.target.value })}
              placeholder="Contoh: JKT"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Maksimal 10 karakter
            </p>
          </div>

          {/* Nomor BP */}
          <div className="space-y-2">
            <Label htmlFor="nomorBP">Nomor BP *</Label>
            <Input
              id="nomorBP"
              value={formData.nomorBP}
              onChange={(e) => setFormData({ ...formData, nomorBP: e.target.value })}
              placeholder="Contoh: 001"
              maxLength={5}
            />
            <p className="text-xs text-muted-foreground">
              Maksimal 5 karakter
            </p>
          </div>

          {/* Preview */}
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-semibold mb-2">Preview Nama BP:</p>
            <p className="text-lg font-bold text-primary">
              {formData.lokasiBP && formData.inisialBP && formData.nomorBP
                ? `${formData.lokasiBP} - ${formData.inisialBP}-${formData.nomorBP}`
                : 'Isi semua field untuk melihat preview'}
            </p>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="w-4 h-4" />
            Simpan Konfigurasi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BPNaming;
