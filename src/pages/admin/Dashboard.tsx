import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Factory, Droplets, Users, AlertTriangle } from 'lucide-react';

interface ProductionRecord {
  id: string;
  timestamp: string;
  truckNumber?: string;
  customerName?: string;
  mutuBeton?: string;
  totalVolume?: number;
  semenActual?: number;
  pasir1Actual?: number;
  pasir2Actual?: number;
  batu1Actual?: number;
  batu2Actual?: number;
  airActual?: number;
}

interface DailyProduction {
  date: string;
  batches: number;
  volume: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Dashboard() {
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState({ batches: 0, volume: 0, customers: 0 });
  const [weeklyData, setWeeklyData] = useState<DailyProduction[]>([]);
  const [materialUsage, setMaterialUsage] = useState<{ name: string; value: number }[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    try {
      const savedRecords = localStorage.getItem('production_records');
      const records: ProductionRecord[] = savedRecords ? JSON.parse(savedRecords) : [];
      
      const today = new Date().toDateString();
      const todayRecords = records.filter(r => new Date(r.timestamp).toDateString() === today);
      
      // Today's stats
      const uniqueCustomers = new Set(todayRecords.map(r => r.customerName).filter(Boolean));
      setTodayStats({
        batches: todayRecords.length,
        volume: todayRecords.reduce((sum, r) => sum + (r.totalVolume || 0), 0) / 1000,
        customers: uniqueCustomers.size
      });

      // Weekly data (last 7 days)
      const weekly: DailyProduction[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const dayRecords = records.filter(r => new Date(r.timestamp).toDateString() === dateStr);
        weekly.push({
          date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
          batches: dayRecords.length,
          volume: dayRecords.reduce((sum, r) => sum + (r.totalVolume || 0), 0) / 1000
        });
      }
      setWeeklyData(weekly);

      // Material usage (today)
      const totalSemen = todayRecords.reduce((sum, r) => sum + (r.semenActual || 0), 0);
      const totalPasir = todayRecords.reduce((sum, r) => sum + (r.pasir1Actual || 0) + (r.pasir2Actual || 0), 0);
      const totalBatu = todayRecords.reduce((sum, r) => sum + (r.batu1Actual || 0) + (r.batu2Actual || 0), 0);
      const totalAir = todayRecords.reduce((sum, r) => sum + (r.airActual || 0), 0);
      
      setMaterialUsage([
        { name: 'Semen', value: totalSemen },
        { name: 'Pasir', value: totalPasir },
        { name: 'Batu', value: totalBatu },
        { name: 'Air', value: totalAir }
      ].filter(m => m.value > 0));

      // Check for alerts
      const newAlerts: string[] = [];
      const siloLevels = localStorage.getItem('silo_levels');
      if (siloLevels) {
        const levels = JSON.parse(siloLevels);
        Object.entries(levels).forEach(([silo, level]) => {
          if (typeof level === 'number' && level < 5000) {
            newAlerts.push(`${silo}: Level rendah (${(level / 1000).toFixed(1)} ton)`);
          }
        });
      }
      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-2">
          Selamat datang, {user?.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produksi Hari Ini</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.batches} Batch</div>
            <p className="text-xs text-muted-foreground">Total mixing hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Hari Ini</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.volume.toFixed(1)} M³</div>
            <p className="text-xs text-muted-foreground">Total volume beton</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.customers}</div>
            <p className="text-xs text-muted-foreground">Pelanggan hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Sistem</CardTitle>
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">Sistem berjalan normal</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Production Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Produksi 7 Hari Terakhir</CardTitle>
            <CardDescription>Volume produksi harian (M³)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} M³`, 'Volume']}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Material Usage Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Penggunaan Material Hari Ini</CardTitle>
            <CardDescription>Distribusi material (kg)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {materialUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialUsage}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${(value / 1000).toFixed(1)}t`}
                    >
                      {materialUsage.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Jumlah']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Belum ada data produksi hari ini
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Peringatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alerts.map((alert, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <div className="grid gap-4 md:grid-cols-2">
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
