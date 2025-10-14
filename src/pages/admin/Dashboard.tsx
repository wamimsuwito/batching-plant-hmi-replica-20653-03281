import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-2">
          Selamat datang, {user?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sistem Status</CardTitle>
            <CardDescription>Status operasional sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm">Sistem Aktif</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mode Penyimpanan</CardTitle>
            <CardDescription>Lokasi penyimpanan data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Offline - Local Storage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Login</CardTitle>
            <CardDescription>Informasi user aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">Role: {user?.role}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
