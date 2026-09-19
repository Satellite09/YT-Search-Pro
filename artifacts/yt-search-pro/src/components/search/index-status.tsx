import React from 'react';
import { IndexStatus } from '@/lib/types';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface IndexStatusProps {
  status: IndexStatus;
}

export function IndexStatusView({ status }: IndexStatusProps) {
  const percent = status.totalChannels > 0 ? (status.indexedChannels / status.totalChannels) * 100 : 0;
  
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Database className="w-4 h-4 text-primary" />
          <span>Local Index Status</span>
        </div>
        <StatusBadge phase={status.phase} />
      </div>
      
      {status.phase === 'building' && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>{status.indexedChannels} / {status.totalChannels} Channels</span>
            <span>{Math.round(percent)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Videos Indexed</span>
          <span className="text-sm font-mono font-medium">{new Intl.NumberFormat().format(status.videoCount)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Last Updated</span>
          <span className="text-sm font-mono font-medium truncate">
            {new Date(status.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ phase }: { phase: IndexStatus['phase'] }) {
  switch (phase) {
    case 'building':
      return (
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
          <Loader2 className="w-3 h-3 animate-spin" />
          Building
        </div>
      );
    case 'complete':
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-500/10 px-2 py-0.5 rounded-full dark:text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          Complete
        </div>
      );
    case 'incomplete':
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full dark:text-amber-400">
          <AlertCircle className="w-3 h-3" />
          Partial
        </div>
      );
    default:
      return (
        <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
          Idle
        </div>
      );
  }
}
