import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Bell, Volume2, Clock, AlertTriangle, Trash2, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Alert, AlertSettings as AlertSettingsType } from '@/hooks/useAlertMonitor';

const DEFAULT_SETTINGS: AlertSettingsType = {
  siloLowThreshold: 15,
  siloCriticalThreshold: 5,
  checkInterval: 5000,
  enableSound: true,
  enableToastNotification: true,
  maxAlertsHistory: 50,
};

export default function AlertSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AlertSettingsType>(() => {
    const saved = localStorage.getItem('alert_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Load alert history
  useEffect(() => {
    const saved = localStorage.getItem('alert_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlerts(parsed.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('alert_settings', JSON.stringify(settings));
    toast({
      title: "Pengaturan Disimpan",
      description: "Pengaturan alert berhasil disimpan.",
    });
  };

  const handleClearHistory = () => {
    localStorage.removeItem('alert_history');
    setAlerts([]);
    toast({
      title: "Riwayat Dihapus",
      description: "Semua riwayat alert telah dihapus.",
    });
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('alert_settings', JSON.stringify(DEFAULT_SETTINGS));
    toast({
      title: "Reset ke Default",
      description: "Pengaturan alert dikembalikan ke nilai default.",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAlertTypeStyle = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'warning': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'success': return 'bg-green-500/10 text-green-600 border-green-500/30';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan Alert</h1>
          <p className="text-muted-foreground">Konfigurasi notifikasi dan threshold peringatan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetDefaults}>
            Reset Default
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Threshold Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Threshold Silo
            </CardTitle>
            <CardDescription>
              Atur batas peringatan untuk level stok silo semen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Level Rendah (Warning)</Label>
                  <span className="text-sm font-medium text-yellow-500">
                    {settings.siloLowThreshold}%
                  </span>
                </div>
                <Slider
                  value={[settings.siloLowThreshold]}
                  onValueChange={([value]) => setSettings(s => ({ ...s, siloLowThreshold: value }))}
                  min={10}
                  max={30}
                  step={1}
                  className="[&_[role=slider]]:bg-yellow-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Peringatan muncul saat stok di bawah {settings.siloLowThreshold}%
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Level Kritis (Critical)</Label>
                  <span className="text-sm font-medium text-destructive">
                    {settings.siloCriticalThreshold}%
                  </span>
                </div>
                <Slider
                  value={[settings.siloCriticalThreshold]}
                  onValueChange={([value]) => setSettings(s => ({ ...s, siloCriticalThreshold: value }))}
                  min={1}
                  max={15}
                  step={1}
                  className="[&_[role=slider]]:bg-destructive"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert kritis muncul saat stok di bawah {settings.siloCriticalThreshold}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Pengaturan Notifikasi
            </CardTitle>
            <CardDescription>
              Konfigurasi cara notifikasi ditampilkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Suara Alert
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bunyi saat muncul alert kritis
                </p>
              </div>
              <Switch
                checked={settings.enableSound}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, enableSound: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Toast Notification
                </Label>
                <p className="text-xs text-muted-foreground">
                  Tampilkan popup notifikasi
                </p>
              </div>
              <Switch
                checked={settings.enableToastNotification}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, enableToastNotification: checked }))}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Interval Pengecekan
                </Label>
                <span className="text-sm font-medium">
                  {settings.checkInterval / 1000} detik
                </span>
              </div>
              <Slider
                value={[settings.checkInterval]}
                onValueChange={([value]) => setSettings(s => ({ ...s, checkInterval: value }))}
                min={2000}
                max={30000}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">
                Seberapa sering sistem memeriksa kondisi
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Maksimal Riwayat Alert</Label>
              <Input
                type="number"
                value={settings.maxAlertsHistory}
                onChange={(e) => setSettings(s => ({ ...s, maxAlertsHistory: parseInt(e.target.value) || 50 }))}
                min={10}
                max={200}
              />
              <p className="text-xs text-muted-foreground">
                Jumlah maksimal riwayat yang disimpan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alert History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Riwayat Alert</CardTitle>
                <CardDescription>
                  {alerts.length} alert tercatat
                </CardDescription>
              </div>
              {alerts.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleClearHistory}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Semua
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada riwayat alert</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        getAlertTypeStyle(alert.type),
                        alert.acknowledged && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">
                              {alert.category.toUpperCase()}
                            </Badge>
                            <span className="text-xs opacity-70">
                              {formatTime(alert.timestamp)}
                            </span>
                            {alert.acknowledged && (
                              <Badge variant="secondary" className="text-[10px]">
                                Dibaca
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs opacity-80 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
