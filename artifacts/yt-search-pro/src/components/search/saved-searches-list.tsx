import React from 'react';
import { SavedSearch } from '@/lib/types';
import { Bookmark, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SavedSearchesListProps {
  searches: SavedSearch[];
  onSelect: (search: SavedSearch) => void;
  onDelete: (id: string) => void;
}

export function SavedSearchesList({ searches, onSelect, onDelete }: SavedSearchesListProps) {
  if (searches.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground flex flex-col items-center justify-center min-h-[120px]">
        <Bookmark className="w-6 h-6 mb-2 opacity-20" />
        No saved searches yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-2 bg-muted/50 border-b flex justify-between items-center">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saved Queries</h3>
      </div>
      <div className="divide-y max-h-[300px] overflow-y-auto">
        {searches.map(s => (
          <div key={s.id} className="p-3 flex items-start gap-3 hover:bg-accent/50 transition-colors group">
            <div className="mt-0.5 text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground truncate">{s.name}</div>
              <div className="text-xs text-muted-foreground truncate font-mono mt-0.5">"{s.query}"</div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-medium">{s.scope}</span>
                {s.dateWindow !== 'any' && (
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-medium">{s.dateWindow.replace('_', ' ')}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onSelect(s)}>
                <Play className="w-3 h-3 text-primary" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
