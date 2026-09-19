import { Video, Channel, IndexStatus, Country } from './types';

export const MOCK_CHANNELS: Channel[] = [
  { id: 'c1', title: 'Data Intensive', country: 'US', indexed: true },
  { id: 'c2', title: 'Tech Review Weekly', country: 'GB', indexed: true },
  { id: 'c3', title: 'Korean Code', country: 'KR', indexed: true },
  { id: 'c4', title: 'Obscure Synthesizers', country: 'NOT_SPECIFIED', indexed: false },
  { id: 'c5', title: 'Fireship', country: 'US', indexed: true },
  { id: 'c6', title: 'Kurzgesagt – In a Nutshell', country: 'DE', indexed: true },
];

export const MOCK_VIDEOS: Video[] = [
  {
    id: 'v1',
    title: 'PostgreSQL vs MySQL in 2024: A deep dive',
    description: 'We compare the two most popular open source relational databases with benchmarks...',
    channelId: 'c1',
    channelTitle: 'Data Intensive',
    publishedAt: '2024-02-15T10:00:00Z',
    country: 'US',
    duration: '18:42',
    views: 142000,
    thumbnail: 'thumb_blue'
  },
  {
    id: 'v2',
    title: 'The Primeagen reviews my setup',
    description: 'A brief look into the chaotic setup I use daily.',
    channelId: 'c2',
    channelTitle: 'Tech Review Weekly',
    publishedAt: '2024-03-01T12:30:00Z',
    country: 'GB',
    duration: '12:05',
    views: 85000,
    thumbnail: 'thumb_purple'
  },
  {
    id: 'v3',
    title: 'React Server Components explained in 100 seconds',
    description: 'React Server Components are finally here. Learn how they work.',
    channelId: 'c5',
    channelTitle: 'Fireship',
    publishedAt: '2023-11-20T14:15:00Z',
    country: 'US',
    duration: '02:14',
    views: 1250000,
    thumbnail: 'thumb_red'
  },
  {
    id: 'v4',
    title: 'Why you should learn Rust',
    description: 'Rust is consistently voted the most loved programming language.',
    channelId: 'c1',
    channelTitle: 'Data Intensive',
    publishedAt: '2024-01-10T09:00:00Z',
    country: 'US',
    duration: '24:50',
    views: 310000,
    thumbnail: 'thumb_orange'
  },
  {
    id: 'v5',
    title: 'The Future of AI in Development',
    description: 'How AI coding assistants are changing the way we build software.',
    channelId: 'c2',
    channelTitle: 'Tech Review Weekly',
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    country: 'GB',
    duration: '15:30',
    views: 45000,
    thumbnail: 'thumb_teal'
  },
  {
    id: 'v6',
    title: 'Optimistic UI Patterns',
    description: 'Make your app feel faster with optimistic updates.',
    channelId: 'c3',
    channelTitle: 'Korean Code',
    publishedAt: new Date().toISOString(), // today
    country: 'KR',
    duration: '08:45',
    views: 12000,
    thumbnail: 'thumb_indigo'
  }
];

export const MOCK_INDEX_STATUS: IndexStatus = {
  phase: 'building',
  indexedChannels: 84,
  totalChannels: 120,
  videoCount: 4521,
  updatedAt: new Date().toISOString(),
};

export const COUNTRY_LABELS: Record<Country, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  IN: 'India',
  JP: 'Japan',
  KR: 'South Korea',
  FR: 'France',
  DE: 'Germany',
  NOT_SPECIFIED: 'Not Specified'
};
