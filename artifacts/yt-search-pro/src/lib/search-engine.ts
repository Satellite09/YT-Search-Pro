import { getAllChannels, getAllVideos, NOT_SPECIFIED } from "./index-db";
import type { RankedVideo, SearchFilters, VideoRecord } from "./types";

function cutoff(filters: SearchFilters): { start?: number; end?: number } {
  const now = Date.now();
  const days = { "24h": 1, "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  if (filters.datePreset === "custom") {
    return {
      start: filters.startDate ? new Date(filters.startDate).getTime() : undefined,
      end: filters.endDate ? new Date(`${filters.endDate}T23:59:59`).getTime() : undefined,
    };
  }
  return { start: now - days[filters.datePreset] * 86_400_000, end: now };
}

function relevance(video: VideoRecord, terms: string[]): number {
  const title = video.title.toLocaleLowerCase();
  const description = video.description.toLocaleLowerCase();
  return terms.reduce((score, term) => {
    if (title === term) return score + 20;
    if (title.includes(term)) return score + 8;
    if (description.includes(term)) return score + 2;
    return score;
  }, 0);
}

export async function searchLocalIndex(filters: SearchFilters): Promise<RankedVideo[]> {
  const [videos, channels] = await Promise.all([getAllVideos(), getAllChannels()]);
  const countryByChannel = new Map(
    channels.map((channel) => [channel.id, channel.country ?? NOT_SPECIFIED]),
  );
  const terms = filters.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const { start, end } = cutoff(filters);

  return videos
    .map((video) => ({
      ...video,
      country: countryByChannel.get(video.channelId) ?? null,
      score: relevance(video, terms),
    }))
    .filter((video) => {
      const published = new Date(video.publishedAt).getTime();
      const country = video.country ?? NOT_SPECIFIED;
      return (
        (!terms.length || video.score > 0) &&
        (!start || published >= start) &&
        (!end || published <= end) &&
        (!filters.countries.length || filters.countries.includes(country))
      );
    })
    .sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt));
}