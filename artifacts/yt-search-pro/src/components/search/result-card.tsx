import React from 'react';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Clock } from 'lucide-react';
import { COUNTRY_LABELS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';

interface ResultCardProps {
  video: Video;
}

export function ResultCard({ video }: ResultCardProps) {
  // Use data URI for placeholder to avoid external unsplash breaking
  const thumbUrl = video.thumbnail.startsWith('thumb_') 
    ? `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%" height="100%" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999">${video.channelTitle}</text></svg>`
    : video.thumbnail;

  return (
    <div className="flex gap-4 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group cursor-pointer">
      <div className="relative shrink-0 w-[160px] h-[90px] rounded-md overflow-hidden bg-muted">
        <img 
          src={thumbUrl} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
          {video.duration}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 py-0.5 flex flex-col">
        <h3 className="text-base font-semibold leading-tight text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium">
          <span className="text-foreground">{video.channelTitle}</span>
          <span className="w-1 h-1 rounded-full bg-border"></span>
          <span>{COUNTRY_LABELS[video.country]}</span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto font-mono">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {new Intl.NumberFormat('en-US', { notation: "compact" }).format(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
