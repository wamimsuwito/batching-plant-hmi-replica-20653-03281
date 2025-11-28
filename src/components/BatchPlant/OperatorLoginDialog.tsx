import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  namaUser: string;
  nik: string;
  jabatan: string;
  password: string;
}

interface OperatorLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (operator: { id: string; namaUser: string; nik: string; jabatan: string }) => void;
}

export function OperatorLoginDialog({ open, onOpenChange, onLoginSuccess }: OperatorLoginDialogProps) {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    console.log('🔐 Login attempt:', { nik: nik.trim(), passwordLength: password.length });
    
    // Validate inputs
    if (!nik.trim() || !password.trim()) {
      toast({
        title: "Input Tidak Lengkap",
        description: "Harap isi NIK dan Password",
        variant: "destructive",
      });
      return;
    }

    // Load users from localStorage
    const usersData = localStorage.getItem('app_users');
    console.log('📦 Raw users data:', usersData);
    
    if (!usersData) {
      toast({
        title: "Login Gagal",
        description: "Data user tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    const users: User[] = JSON.parse(usersData);
    console.log('👥 Parsed users:', users);
    console.log('🔍 Looking for NIK:', nik.trim());
    
    // Find user by NIK
    const user = users.find(u => u.nik === nik.trim());
    console.log('✅ Found user:', user);
    
    if (!user) {
      toast({
        title: "Login Gagal",
        description: "NIK tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    // Check if user is operator or supervisor (not admin)
    if (user.jabatan === 'Admin') {
      toast({
        title: "Akses Ditolak",
        description: "Gunakan akun Operator atau Supervisor",
        variant: "destructive",
      });
      return;
    }

    // Verify password
    if (user.password !== password) {
      toast({
        title: "Login Gagal",
        description: "Password salah",
        variant: "destructive",
      });
      return;
    }

    // Login success
    const operatorData = {
      id: user.id,
      namaUser: user.namaUser,
      nik: user.nik,
      jabatan: user.jabatan,
    };

    onLoginSuccess(operatorData);
    
    toast({
      title: "Login Berhasil",
      description: `Selamat datang, ${user.namaUser}`,
    });

    // Reset form
    setNik('');
    setPassword('');
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Login Operator</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Masukkan NIK dan Password untuk login
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nik">NIK</Label>
            <Input
              id="nik"
              placeholder="Masukkan NIK"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full"
          >
            Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
