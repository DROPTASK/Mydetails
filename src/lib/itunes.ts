// Apple's iTunes Search API — free, no API key, CORS-enabled.
// Note: previewUrl is a ~30s preview clip, not the full track.

export type ItunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string | null;
  artworkUrl100: string | null;
};

export function upsizeArtwork(url: string | null, size = 600): string | null {
  if (!url) return null;
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, `/${size}x${size}bb.$1`);
}

export async function searchTracks(query: string): Promise<ItunesTrack[]> {
  if (!query.trim()) return [];
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "24");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`iTunes search ${res.status}`);
  const data = await res.json();
  return (data.results || []).filter((r: ItunesTrack) => r.previewUrl);
}
