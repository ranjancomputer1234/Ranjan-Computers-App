export type PlaybackBuffer = {
  minBufferMs: number;
  maxBufferMs: number;
  bufferForPlaybackMs: number;
  bufferForPlaybackAfterRebufferMs: number;
  backBufferDurationMs: number;
  cacheSizeMB?: number;
  initialBitrate?: number;
  live?: {
    targetOffsetMs: number;
    minOffsetMs: number;
    maxOffsetMs: number;
    minPlaybackSpeed: number;
    maxPlaybackSpeed: number;
  };
};

export type PlaybackSource = {
  uri: string;
  type?: string;
  startPosition?: number;
  minLoadRetryCount: number;
  bufferConfig: PlaybackBuffer;
};

/**
 * Start as soon as a short buffer exists, then keep a modest cushion.
 * The player default holds about 50s, which delays the first frame and
 * makes rewind wait on the network.
 */
export const VOD_BUFFER: PlaybackBuffer = {
  minBufferMs: 8_000,
  maxBufferMs: 30_000,
  bufferForPlaybackMs: 750,
  bufferForPlaybackAfterRebufferMs: 1_500,
  backBufferDurationMs: 30_000,
  cacheSizeMB: 48,
};

/** Stay close to the live edge without stalling on every jitter. */
export const LIVE_BUFFER: PlaybackBuffer = {
  minBufferMs: 2_000,
  maxBufferMs: 8_000,
  bufferForPlaybackMs: 400,
  bufferForPlaybackAfterRebufferMs: 800,
  backBufferDurationMs: 10_000,
  cacheSizeMB: 16,
  live: {
    targetOffsetMs: 2_500,
    minOffsetMs: 800,
    maxOffsetMs: 6_000,
    minPlaybackSpeed: 0.97,
    maxPlaybackSpeed: 1.04,
  },
};

export function formatClock(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  const clock = `${minutes}:${String(remainder).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${clock.padStart(5, '0')}` : clock;
}

export function inferMediaType(uri: string): string | undefined {
  const path = uri.split('?')[0]?.split('#')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.m3u8')) return 'm3u8';
  if (path.endsWith('.mpd')) return 'mpd';
  if (path.endsWith('.mp4') || path.endsWith('.m4v')) return 'mp4';
  if (path.endsWith('.mp3') || path.endsWith('.m4a') || path.endsWith('.aac')) return 'mp3';
  return undefined;
}

export function buildPlaybackSource(
  uri: string,
  options: {
    startPosition?: number;
    live?: boolean;
    initialBitrate?: number;
    mediaType?: string;
  } = {},
): PlaybackSource {
  const live = options.live ?? false;
  const start = options.startPosition ?? 0;
  const buffer = live ? LIVE_BUFFER : VOD_BUFFER;
  return {
    uri,
    type: options.mediaType ?? inferMediaType(uri),
    // Native startPosition is milliseconds on both platforms.
    startPosition: !live && start > 0.75 ? Math.round(start * 1000) : undefined,
    minLoadRetryCount: 4,
    bufferConfig: {
      ...buffer,
      initialBitrate: options.initialBitrate ?? (live ? 800_000 : 1_000_000),
    },
  };
}
