import { useState } from 'react';
import { Building2, Upload, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { toast } from 'sonner';

export default function CompanySettings() {
  const { companySettings, updateSettings, resetToDefault } = useCompanySettings();
  const [formData, setFormData] = useState(companySettings);
  const [logoPreview, setLogoPreview] = useState(companySettings.logo);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar. Maksimal 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData(prev => ({ ...prev, logo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Pengaturan perusahaan berhasil disimpan');
  };

  const handleReset = () => {
    if (confirm('Reset ke pengaturan default? Semua data perusahaan akan dihapus.')) {
      resetToDefault();
      setFormData(resetToDefault as any);
      setLogoPreview('/src/assets/default-company-logo.png');
      toast.success('Pengaturan direset ke default');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Pengaturan Perusahaan</h1>
          <p className="text-muted-foreground">Konfigurasi identitas perusahaan untuk aplikasi</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Perusahaan</CardTitle>
          <CardDescription>
            Data ini akan ditampilkan di HMI, print tiket, dan seluruh aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Logo Perusahaan</Label>
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Upload logo perusahaan (PNG/JPG, max 2MB)
                </p>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name">Nama Perusahaan</Label>
            <Input
              id="company-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="PT. CONTOH BETON MANDIRI"
              className="font-semibold"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="READYMIX & PRECAST CONCRETE"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Jl. Raya Industri No. 45, Kota, Provinsi"
              rows={3}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(021) 555-1234"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Simpan Pengaturan
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Tampilan data perusahaan di print tiket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-background text-center space-y-2">
            <img 
              src={logoPreview} 
              alt="Logo Preview" 
              className="w-24 h-24 mx-auto object-contain mb-2"
            />
            <h2 className="text-xl font-bold">{formData.name || 'NAMA PERUSAHAAN'}</h2>
            <p className="text-sm font-semibold">{formData.tagline || 'READYMIX & PRECAST CONCRETE'}</p>
            <p className="text-xs">{formData.address || 'Alamat Perusahaan'}</p>
            <p className="text-xs">Telp. {formData.phone || 'Telepon Perusahaan'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
