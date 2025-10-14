import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface MaterialSetting {
  nama: string;
  trigger: string;
  jogingOn: string;
  jogingOff: string;
  toleransi: string;
}

const defaultMaterials: MaterialSetting[] = [
  { nama: 'Pasir 1', trigger: '', jogingOn: '', jogingOff: '', toleransi: '' },
  { nama: 'Pasir 2', trigger: '', jogingOn: '', jogingOff: '', toleransi: '' },
  { nama: 'Batu 1', trigger: '', jogingOn: '', jogingOff: '', toleransi: '' },
  { nama: 'Batu 2', trigger: '', jogingOn: '', jogingOff: '', toleransi: '' },
  { nama: 'Semen', trigger: '', jogingOn: '', jogingOff: '', toleransi: '' },
  { nama: 'Air', trigger: '', jogingOn: '', jogingOff: '', toleransi: '' },
  { nama: 'Additive', trigger: '', jogingOn: '', jogingOff: '', toleransi: '' },
];

export default function MaterialJogging() {
  const [materials, setMaterials] = useState<MaterialSetting[]>(defaultMaterials);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('material_jogging_settings');
    if (saved) {
      setMaterials(JSON.parse(saved));
    }
  }, []);

  const handleInputChange = (index: number, field: keyof MaterialSetting, value: string) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const handleSave = () => {
    localStorage.setItem('material_jogging_settings', JSON.stringify(materials));
    toast({
      title: 'Berhasil',
      description: 'Setting joging material berhasil disimpan',
    });
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Joging Material</CardTitle>
          <CardDescription>Pengaturan joging dan testing material</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Nama material</TableHead>
                  <TableHead className="w-[120px]">Trigger (%)</TableHead>
                  <TableHead className="text-center" colSpan={2}>Joging (detik)</TableHead>
                  <TableHead className="w-[140px]">Toleransi (kg)</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="w-[100px] text-center">On</TableHead>
                  <TableHead className="w-[100px] text-center">Off</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material, index) => (
                  <TableRow key={material.nama}>
                    <TableCell className="font-medium">{material.nama}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={material.trigger}
                        onChange={(e) => handleInputChange(index, 'trigger', e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={material.jogingOn}
                        onChange={(e) => handleInputChange(index, 'jogingOn', e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={material.jogingOff}
                        onChange={(e) => handleInputChange(index, 'jogingOff', e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={material.toleransi}
                        onChange={(e) => handleInputChange(index, 'toleransi', e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
