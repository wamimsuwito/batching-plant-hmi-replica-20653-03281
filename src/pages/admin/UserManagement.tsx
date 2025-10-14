import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  namaUser: string;
  nik: string;
  jabatan: 'Admin' | 'Operator' | 'Supervisor' | 'Teknisi';
  password: string;
}

const STORAGE_KEY = 'app_users';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<User>({
    id: '',
    namaUser: '',
    nik: '',
    jabatan: 'Operator',
    password: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      // Set default admin user if no users exist
      const defaultAdmin: User = {
        id: '1',
        namaUser: 'Administrator',
        nik: 'ADMIN001',
        jabatan: 'Admin',
        password: 'admin',
      };
      setUsers([defaultAdmin]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultAdmin]));
    }
  }, []);

  const saveToStorage = (data: User[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const handleAdd = () => {
    if (!formData.namaUser || !formData.nik || !formData.password) {
      toast({
        title: 'Error',
        description: 'Semua field wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    // Check if NIK already exists
    if (users.some(u => u.nik === formData.nik)) {
      toast({
        title: 'Error',
        description: 'NIK sudah terdaftar',
        variant: 'destructive',
      });
      return;
    }

    const newUser: User = {
      ...formData,
      id: Date.now().toString(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveToStorage(updated);
    setFormData({
      id: '',
      namaUser: '',
      nik: '',
      jabatan: 'Operator',
      password: '',
    });
    toast({
      title: 'Berhasil',
      description: 'User baru berhasil ditambahkan',
    });
  };

  const handleUpdate = () => {
    if (!formData.namaUser || !formData.nik || !formData.password) {
      toast({
        title: 'Error',
        description: 'Semua field wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    // Check if NIK already exists (excluding current user)
    if (users.some(u => u.nik === formData.nik && u.id !== editingId)) {
      toast({
        title: 'Error',
        description: 'NIK sudah terdaftar',
        variant: 'destructive',
      });
      return;
    }

    const updated = users.map((u) => (u.id === editingId ? { ...formData } : u));
    setUsers(updated);
    saveToStorage(updated);
    setEditingId(null);
    setFormData({
      id: '',
      namaUser: '',
      nik: '',
      jabatan: 'Operator',
      password: '',
    });
    toast({
      title: 'Berhasil',
      description: 'Data user berhasil diperbarui',
    });
  };

  const handleEdit = (user: User) => {
    setFormData(user);
    setEditingId(user.id);
  };

  const handleDelete = (id: string) => {
    // Prevent deleting the last admin
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.jabatan === 'Admin') {
      const adminCount = users.filter(u => u.jabatan === 'Admin').length;
      if (adminCount === 1) {
        toast({
          title: 'Error',
          description: 'Tidak dapat menghapus admin terakhir',
          variant: 'destructive',
        });
        return;
      }
    }

    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveToStorage(updated);
    toast({
      title: 'Berhasil',
      description: 'User berhasil dihapus',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      id: '',
      namaUser: '',
      nik: '',
      jabatan: 'Operator',
      password: '',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen User</CardTitle>
          <CardDescription>Tambah dan kelola user sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="namaUser">Nama User *</Label>
              <Input
                id="namaUser"
                value={formData.namaUser}
                onChange={(e) => setFormData({ ...formData, namaUser: e.target.value })}
                placeholder="Masukkan nama user"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">NIK *</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="Masukkan NIK"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jabatan">Jabatan *</Label>
              <Select
                value={formData.jabatan}
                onValueChange={(value: any) => setFormData({ ...formData, jabatan: value })}
              >
                <SelectTrigger id="jabatan">
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Operator">Operator</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Teknisi">Teknisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Masukkan password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            {editingId ? (
              <>
                <Button onClick={handleUpdate}>Perbarui User</Button>
                <Button variant="outline" onClick={handleCancel}>Batal</Button>
              </>
            ) : (
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama User</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada user terdaftar
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.namaUser}</TableCell>
                      <TableCell>{user.nik}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.jabatan === 'Admin' ? 'bg-primary/20 text-primary' :
                          user.jabatan === 'Supervisor' ? 'bg-secondary/20 text-secondary' :
                          user.jabatan === 'Operator' ? 'bg-accent/20 text-accent-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.jabatan}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
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
