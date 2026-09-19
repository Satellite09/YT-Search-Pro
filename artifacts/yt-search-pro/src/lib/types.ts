export type Scope = 'subscriptions' | 'global';
export type DatePreset = 'any' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';
export type Country = 'US' | 'GB' | 'CA' | 'AU' | 'IN' | 'JP' | 'KR' | 'FR' | 'DE' | 'NOT_SPECIFIED';

export interface Video {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  country: Country;
  duration: string;
  views: number;
  thumbnail: string;
}

export interface Channel {
  id: string;
  title: string;
  country: Country;
  indexed: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  scope: Scope;
  dateWindow: DatePreset;
  countries: Country[];
  createdAt: string;
}

export interface IndexStatus {
  phase: 'idle' | 'building' | 'incomplete' | 'complete' | 'empty';
  indexedChannels: number;
  totalChannels: number;
  videoCount: number;
  updatedAt: string;
}

export interface AppState {
  authStatus: 'authenticated' | 'expired' | 'unauthenticated';
  quotaStatus: 'ok' | 'exhausted';
  indexStatus: IndexStatus;
  
  searchQuery: string;
  scope: Scope;
  datePreset: DatePreset;
  customDateRange: { start: string; end: string } | null;
  selectedCountries: Country[];
  
  savedSearches: SavedSearch[];
  uiPreferences: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
  };
}

export type LocalDatePreset = '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface ChannelRecord {
  id: string;
  title: string;
  uploadsPlaylistId: string;
  country: string | null;
  indexedAt: string | null;
  latestVideoAt: string | null;
}

export interface VideoRecord {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string | null;
}

export interface IndexCheckpoint {
  id: 'current';
  phase: 'idle' | 'subscriptions' | 'channels' | 'uploads' | 'complete' | 'error';
  indexedChannels: number;
  totalChannels: number;
  nextSubscriptionPageToken?: string;
  pendingChannelIds: string[];
  updatedAt: string | null;
  error?: string;
}

export interface SearchFilters {
  query: string;
  scope: Scope;
  datePreset: LocalDatePreset;
  startDate?: string;
  endDate?: string;
  countries: string[];
}

export interface RankedVideo extends VideoRecord {
  country: string | null;
  score: number;
}
