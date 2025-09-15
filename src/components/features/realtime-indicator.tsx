import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdated?: Date;
  isRefreshing?: boolean;
}

export function RealtimeIndicator({ 
  isConnected, 
  lastUpdated, 
  isRefreshing = false 
}: RealtimeIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setTimeAgo(`${hours}h ago`);
      } else if (minutes > 0) {
        setTimeAgo(`${minutes}m ago`);
      } else if (seconds > 0) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        setTimeAgo('Just now');
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className={cn(
          "flex items-center space-x-1 transition-all",
          isConnected && "animate-pulse-slow"
        )}
      >
        {isRefreshing ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span className="text-xs">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </Badge>
      
      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          Updated {timeAgo}
        </span>
      )}
    </div>
  );
}