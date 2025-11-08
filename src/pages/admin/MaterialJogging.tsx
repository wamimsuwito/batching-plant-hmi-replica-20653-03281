import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

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
  { nama: 'Timer Dumping Pasir', trigger: '', jogingOn: '3', jogingOff: '2', toleransi: '' },
  { nama: 'Timer Dumping Batu', trigger: '', jogingOn: '3', jogingOff: '2', toleransi: '' },
  { nama: 'Waiting Hopper 3-Phase', trigger: '', jogingOn: '5', jogingOff: '6', toleransi: '10' },
];

export default function MaterialJogging() {
  const [materials, setMaterials] = useState<MaterialSetting[]>(defaultMaterials);
  const [systemConfig, setSystemConfig] = useState<number>(1);
  const [accessories, setAccessories] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('material_jogging_settings');
    if (saved) {
      setMaterials(JSON.parse(saved));
    }
    
    const savedSystem = localStorage.getItem('batch_plant_system');
    if (savedSystem) {
      setSystemConfig(parseInt(savedSystem));
    }

    const savedAccessories = localStorage.getItem('batch_plant_accessories');
    if (savedAccessories) {
      setAccessories(JSON.parse(savedAccessories));
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
    <TooltipProvider>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Joging Material</CardTitle>
            <CardDescription>Pengaturan joging dan testing material</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          {systemConfig === 3 && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Timer Dumping:</strong> Mengatur interval ON/OFF pintu aggregate untuk mencegah material berceceran. 
                Pintu akan membuka (ON) dan menutup (OFF) berulang sampai aggregate kosong.
              </AlertDescription>
            </Alert>
          )}
          
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
                {materials.slice(0, 7).map((material, index) => (
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
                
                {/* System 3 Only: Timer Dumping */}
                {systemConfig === 3 && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="font-semibold text-primary">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Timer Dumping Aggregate (Sistem 3)
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Timer Dumping Pasir</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={materials[7]?.jogingOn || ''}
                          onChange={(e) => handleInputChange(7, 'jogingOn', e.target.value)}
                          placeholder="3"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={materials[7]?.jogingOff || ''}
                          onChange={(e) => handleInputChange(7, 'jogingOff', e.target.value)}
                          placeholder="2"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Timer Dumping Batu</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={materials[8]?.jogingOn || ''}
                          onChange={(e) => handleInputChange(8, 'jogingOn', e.target.value)}
                          placeholder="3"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={materials[8]?.jogingOff || ''}
                          onChange={(e) => handleInputChange(8, 'jogingOff', e.target.value)}
                          placeholder="2"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                    </TableRow>
                  </>
                )}

                {/* Waiting Hopper Settings */}
                {accessories.includes('4') && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="font-semibold text-primary">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Waiting Hopper 3-Phase Dumping
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={5} className="text-sm text-muted-foreground italic">
                        Phase 1 ON → Phase 2 OFF (hold) → Phase 3 ON (final discharge)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          Phase 1 (ON)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Initial discharge phase - material begins flowing from waiting hopper to mixer</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={materials[9]?.jogingOn || ''}
                          onChange={(e) => handleInputChange(9, 'jogingOn', e.target.value)}
                          placeholder="5"
                          className="w-full"
                        />
                        <span className="text-xs text-muted-foreground block mt-1">detik</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          Phase 2 (OFF - Hold)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Hold/stabilization phase - valve closed to allow material settling and mixer stabilization</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={materials[9]?.jogingOff || ''}
                          onChange={(e) => handleInputChange(9, 'jogingOff', e.target.value)}
                          placeholder="6"
                          className="w-full"
                        />
                        <span className="text-xs text-muted-foreground block mt-1">detik</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          Phase 3 (ON - Final)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Final complete discharge - valve opens fully to empty all remaining material into mixer</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={materials[9]?.toleransi || ''}
                          onChange={(e) => handleInputChange(9, 'toleransi', e.target.value)}
                          placeholder="10"
                          className="w-full"
                        />
                        <span className="text-xs text-muted-foreground block mt-1">detik</span>
                      </TableCell>
                    </TableRow>
                  </>
                )}
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
    </TooltipProvider>
  );
}