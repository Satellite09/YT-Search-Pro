import {
  getAllChannels,
  getCheckpoint,
  pruneOlderThan,
  putChannels,
  putVideos,
  saveCheckpoint,
} from "./index-db";
import type { ChannelRecord, IndexCheckpoint, VideoRecord } from "./types";

const API = "https://www.googleapis.com/youtube/v3";

interface Page<T> {
  items: T[];
  nextPageToken?: string;
}

async function youtube<T>(token: string, path: string, params: URLSearchParams): Promise<T> {
  const response = await fetch(`${API}/${path}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `YouTube API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getGoogleToken(interactive = true): Promise<string> {
  if (!("chrome" in globalThis) || !chrome.runtime?.sendMessage) {
    throw new Error("Google sign-in is available in the installed Chrome extension.");
  }
  const result = await chrome.runtime.sendMessage({ type: "GET_GOOGLE_TOKEN", interactive });
  if (result?.error || !result?.token) throw new Error(result?.error ?? "Google sign-in failed");
  return result.token as string;
}

export async function buildOrResumeIndex(
  token: string,
  onProgress: (status: IndexCheckpoint) => void,
) {
  let checkpoint = (await getCheckpoint()) ?? {
    id: "current",
    phase: "subscriptions",
    indexedChannels: 0,
    totalChannels: 0,
    pendingChannelIds: [],
    updatedAt: null,
  };

  if (checkpoint.phase === "complete") {
    checkpoint = { ...checkpoint, phase: "uploads", indexedChannels: 0 };
  }

  if (checkpoint.phase === "subscriptions") {
    const collected: Array<{ snippet: { resourceId: { channelId: string }; title: string } }> = [];
    let pageToken = checkpoint.nextSubscriptionPageToken;
    do {
      const params = new URLSearchParams({
        part: "snippet",
        mine: "true",
        maxResults: "50",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const page = await youtube<Page<(typeof collected)[number]>>(token, "subscriptions", params);
      collected.push(...page.items);
      pageToken = page.nextPageToken;
      checkpoint = {
        ...checkpoint,
        totalChannels: checkpoint.totalChannels + page.items.length,
        pendingChannelIds: [
          ...checkpoint.pendingChannelIds,
          ...page.items.map((item) => item.snippet.resourceId.channelId),
        ],
        nextSubscriptionPageToken: pageToken,
      };
      await saveCheckpoint(checkpoint);
      onProgress(checkpoint);
    } while (pageToken);
    checkpoint = { ...checkpoint, phase: "channels", nextSubscriptionPageToken: undefined };
  }

  if (checkpoint.phase === "channels") {
    const ids = checkpoint.pendingChannelIds;
    for (let i = 0; i < ids.length; i += 50) {
      const page = await youtube<Page<{
        id: string;
        snippet: { title: string; country?: string };
        contentDetails: { relatedPlaylists: { uploads: string } };
      }>>(token, "channels", new URLSearchParams({
        part: "snippet,contentDetails",
        id: ids.slice(i, i + 50).join(","),
        maxResults: "50",
      }));
      const records: ChannelRecord[] = page.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        country: item.snippet.country ?? null,
        uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
        indexedAt: null,
        latestVideoAt: null,
      }));
      await putChannels(records);
    }
    checkpoint = { ...checkpoint, phase: "uploads", indexedChannels: 0 };
    await saveCheckpoint(checkpoint);
  }

  const channels = await getAllChannels();
  const rollingCutoff = new Date(Date.now() - 365 * 86_400_000);
  for (const channel of channels.slice(checkpoint.indexedChannels)) {
    let pageToken: string | undefined;
    let reachedCutoff = false;
    do {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId: channel.uploadsPlaylistId,
        maxResults: "50",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const page = await youtube<Page<{
        contentDetails: { videoId: string; videoPublishedAt?: string };
        snippet: {
          title: string;
          description: string;
          channelId: string;
          channelTitle: string;
          publishedAt: string;
          thumbnails?: { medium?: { url: string } };
        };
      }>>(token, "playlistItems", params);
      const videos: VideoRecord[] = [];
      for (const item of page.items) {
        const publishedAt = item.contentDetails.videoPublishedAt ?? item.snippet.publishedAt;
        if (new Date(publishedAt) < rollingCutoff) {
          reachedCutoff = true;
          break;
        }
        videos.push({
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          publishedAt,
          thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? null,
        });
      }
      await putVideos(videos);
      pageToken = page.nextPageToken;
    } while (pageToken && !reachedCutoff);

    checkpoint = {
      ...checkpoint,
      indexedChannels: checkpoint.indexedChannels + 1,
      updatedAt: new Date().toISOString(),
    };
    await saveCheckpoint(checkpoint);
    onProgress(checkpoint);
  }

  await pruneOlderThan(rollingCutoff.toISOString());
  checkpoint = { ...checkpoint, phase: "complete", updatedAt: new Date().toISOString() };
  await saveCheckpoint(checkpoint);
  onProgress(checkpoint);
}