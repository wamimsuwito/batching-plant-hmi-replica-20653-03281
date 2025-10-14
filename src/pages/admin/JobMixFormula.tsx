import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';

interface MixFormula {
  id: string;
  kode: string;
  nama: string;
  semen: string;
  pasir: string;
  batu1: string;
  batu2: string;
  air: string;
  additive: string;
  totalVolume: string;
}

const STORAGE_KEY = 'job_mix_formulas';

export default function JobMixFormula() {
  const [formulas, setFormulas] = useState<MixFormula[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MixFormula>({
    id: '',
    kode: '',
    nama: '',
    semen: '',
    pasir: '',
    batu1: '',
    batu2: '',
    air: '',
    additive: '',
    totalVolume: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setFormulas(JSON.parse(saved));
    }
  }, []);

  const saveToStorage = (data: MixFormula[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const handleAdd = () => {
    if (!formData.kode || !formData.nama) {
      toast({
        title: 'Error',
        description: 'Kode dan Nama wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    const newFormula = {
      ...formData,
      id: Date.now().toString(),
    };
    const updated = [...formulas, newFormula];
    setFormulas(updated);
    saveToStorage(updated);
    setFormData({
      id: '',
      kode: '',
      nama: '',
      semen: '',
      pasir: '',
      batu1: '',
      batu2: '',
      air: '',
      additive: '',
      totalVolume: '',
    });
    toast({
      title: 'Berhasil',
      description: 'Formula baru ditambahkan',
    });
  };

  const handleUpdate = () => {
    const updated = formulas.map((f) => (f.id === editingId ? { ...formData } : f));
    setFormulas(updated);
    saveToStorage(updated);
    setEditingId(null);
    setFormData({
      id: '',
      kode: '',
      nama: '',
      semen: '',
      pasir: '',
      batu1: '',
      batu2: '',
      air: '',
      additive: '',
      totalVolume: '',
    });
    toast({
      title: 'Berhasil',
      description: 'Formula berhasil diperbarui',
    });
  };

  const handleEdit = (formula: MixFormula) => {
    setFormData(formula);
    setEditingId(formula.id);
  };

  const handleDelete = (id: string) => {
    const updated = formulas.filter((f) => f.id !== id);
    setFormulas(updated);
    saveToStorage(updated);
    toast({
      title: 'Berhasil',
      description: 'Formula berhasil dihapus',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      id: '',
      kode: '',
      nama: '',
      semen: '',
      pasir: '',
      batu1: '',
      batu2: '',
      air: '',
      additive: '',
      totalVolume: '',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Mix Formula</CardTitle>
          <CardDescription>Konfigurasi formula campuran beton</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Mix *</Label>
              <Input
                id="kode"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Contoh: K300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Campuran *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Beton K300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semen">Semen (kg)</Label>
              <Input
                id="semen"
                type="number"
                value={formData.semen}
                onChange={(e) => setFormData({ ...formData, semen: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pasir">Pasir (kg)</Label>
              <Input
                id="pasir"
                type="number"
                value={formData.pasir}
                onChange={(e) => setFormData({ ...formData, pasir: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batu1">Batu 1 (kg)</Label>
              <Input
                id="batu1"
                type="number"
                value={formData.batu1}
                onChange={(e) => setFormData({ ...formData, batu1: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batu2">Batu 2 (kg)</Label>
              <Input
                id="batu2"
                type="number"
                value={formData.batu2}
                onChange={(e) => setFormData({ ...formData, batu2: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="air">Air (liter)</Label>
              <Input
                id="air"
                type="number"
                value={formData.air}
                onChange={(e) => setFormData({ ...formData, air: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additive">Additive (ml)</Label>
              <Input
                id="additive"
                type="number"
                value={formData.additive}
                onChange={(e) => setFormData({ ...formData, additive: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalVolume">Total Volume (m³)</Label>
              <Input
                id="totalVolume"
                type="number"
                value={formData.totalVolume}
                onChange={(e) => setFormData({ ...formData, totalVolume: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            {editingId ? (
              <>
                <Button onClick={handleUpdate}>Perbarui Formula</Button>
                <Button variant="outline" onClick={handleCancel}>Batal</Button>
              </>
            ) : (
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Formula
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Formula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Semen (kg)</TableHead>
                  <TableHead>Pasir (kg)</TableHead>
                  <TableHead>Batu 1 (kg)</TableHead>
                  <TableHead>Batu 2 (kg)</TableHead>
                  <TableHead>Air (L)</TableHead>
                  <TableHead>Additive (ml)</TableHead>
                  <TableHead>Volume (m³)</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      Belum ada formula. Tambahkan formula baru di atas.
                    </TableCell>
                  </TableRow>
                ) : (
                  formulas.map((formula) => (
                    <TableRow key={formula.id}>
                      <TableCell className="font-medium">{formula.kode}</TableCell>
                      <TableCell>{formula.nama}</TableCell>
                      <TableCell>{formula.semen || '-'}</TableCell>
                      <TableCell>{formula.pasir || '-'}</TableCell>
                      <TableCell>{formula.batu1 || '-'}</TableCell>
                      <TableCell>{formula.batu2 || '-'}</TableCell>
                      <TableCell>{formula.air || '-'}</TableCell>
                      <TableCell>{formula.additive || '-'}</TableCell>
                      <TableCell>{formula.totalVolume || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(formula)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(formula.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
