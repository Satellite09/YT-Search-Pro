import type { ChannelRecord, IndexCheckpoint, VideoRecord } from "./types";

const DB_NAME = "yt-search-pro";
const DB_VERSION = 1;

export const NOT_SPECIFIED = "Not Specified";

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
}

export async function openIndex(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, DB_VERSION);
    opening.onupgradeneeded = () => {
      const db = opening.result;
      const videos = db.createObjectStore("videos", { keyPath: "id" });
      videos.createIndex("publishedAt", "publishedAt");
      videos.createIndex("channelId", "channelId");
      db.createObjectStore("channels", { keyPath: "id" });
      db.createObjectStore("meta", { keyPath: "id" });
    };
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
}

export async function putChannels(channels: ChannelRecord[]) {
  const db = await openIndex();
  const tx = db.transaction("channels", "readwrite");
  const store = tx.objectStore("channels");
  channels.forEach((channel) => store.put(channel));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function putVideos(videos: VideoRecord[]) {
  const db = await openIndex();
  const tx = db.transaction("videos", "readwrite");
  const store = tx.objectStore("videos");
  videos.forEach((video) => store.put(video));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAllChannels(): Promise<ChannelRecord[]> {
  const db = await openIndex();
  const result = await request(db.transaction("channels").objectStore("channels").getAll());
  db.close();
  return result;
}

export async function getAllVideos(): Promise<VideoRecord[]> {
  const db = await openIndex();
  const result = await request(db.transaction("videos").objectStore("videos").getAll());
  db.close();
  return result;
}

export async function saveCheckpoint(checkpoint: IndexCheckpoint) {
  const db = await openIndex();
  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").put(checkpoint);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getCheckpoint(): Promise<IndexCheckpoint | undefined> {
  const db = await openIndex();
  const result = await request(
    db.transaction("meta").objectStore("meta").get("current"),
  ) as IndexCheckpoint | undefined;
  db.close();
  return result;
}

export async function pruneOlderThan(isoDate: string) {
  const db = await openIndex();
  const tx = db.transaction("videos", "readwrite");
  const index = tx.objectStore("videos").index("publishedAt");
  const cursor = index.openCursor(IDBKeyRange.upperBound(isoDate, true));
  cursor.onsuccess = () => {
    const current = cursor.result;
    if (!current) return;
    current.delete();
    current.continue();
  };
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}