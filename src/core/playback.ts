const HLS_TYPES = new Set(['mux_hls', 'cloudinary_hls']);

export type PlayableStream = {
  url: string;
  mediaType: 'mp4' | 'm3u8';
};

/** HTTPS streams the in-app player can open. Progressive MP4 is what the learner API returns today. */
export function playableStream(
  playback?: {type?: string | null; url?: string | null} | null,
): PlayableStream | undefined {
  const url = playback?.url?.trim() ?? '';
  const type = playback?.type ?? '';
  if (!url || !/^https:\/\//i.test(url)) return undefined;
  if (type === 'progressive_mp4') return {url, mediaType: 'mp4'};
  if (HLS_TYPES.has(type)) return {url, mediaType: 'm3u8'};
  return undefined;
}
