import { useState } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Alert } from '@/hooks/useAlertMonitor';

interface AlertNotificationCenterProps {
  alerts: Alert[];
  unacknowledgedCount: number;
  onAcknowledge: (alertId: string) => void;
  onAcknowledgeAll: () => void;
  onClear: () => void;
}

export function AlertNotificationCenter({
  alerts,
  unacknowledgedCount,
  onAcknowledge,
  onAcknowledgeAll,
  onClear,
}: AlertNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getAlertStyles = (type: Alert['type'], acknowledged: boolean) => {
    const base = acknowledged ? 'opacity-60' : '';
    switch (type) {
      case 'error':
        return cn(base, 'border-l-4 border-l-destructive bg-destructive/10');
      case 'warning':
        return cn(base, 'border-l-4 border-l-yellow-500 bg-yellow-500/10');
      case 'success':
        return cn(base, 'border-l-4 border-l-green-500 bg-green-500/10');
      default:
        return cn(base, 'border-l-4 border-l-blue-500 bg-blue-500/10');
    }
  };

  const getCategoryBadge = (category: Alert['category']) => {
    switch (category) {
      case 'silo':
        return <Badge variant="outline" className="text-[10px] px-1">SILO</Badge>;
      case 'equipment':
        return <Badge variant="outline" className="text-[10px] px-1">EQUIPMENT</Badge>;
      case 'production':
        return <Badge variant="outline" className="text-[10px] px-1">PRODUKSI</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1">SYSTEM</Badge>;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="relative gap-2"
        >
          <Bell className={cn("w-4 h-4", unacknowledgedCount > 0 && "text-yellow-500")} />
          {unacknowledgedCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] animate-pulse"
            >
              {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
          <h4 className="font-semibold text-sm">Notifikasi</h4>
          <div className="flex gap-1">
            {unacknowledgedCount > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 text-xs"
                onClick={onAcknowledgeAll}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Tandai Semua
              </Button>
            )}
            {alerts.length > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={onClear}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[320px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
              <Bell className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-3 hover:bg-accent/50 transition-colors cursor-pointer relative",
                    getAlertStyles(alert.type, alert.acknowledged)
                  )}
                  onClick={() => !alert.acknowledged && onAcknowledge(alert.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getCategoryBadge(alert.category)}
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="font-medium text-sm leading-tight">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledge(alert.id);
                        }}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
