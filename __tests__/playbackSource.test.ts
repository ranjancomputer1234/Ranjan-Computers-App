import {buildPlaybackSource, formatClock, LIVE_BUFFER, VOD_BUFFER} from '../src/components/media/playbackSource';
import {playableStream} from '../src/core/playback';

describe('playback source', () => {
  it('formats a stable clock', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3661)).toBe('1:01:01');
    expect(formatClock(Number.NaN)).toBe('0:00');
  });

  it('starts vod quickly and keeps a rewind buffer', () => {
    const source = buildPlaybackSource('https://cdn.example/lesson.m3u8?token=1', {
      mediaType: 'm3u8',
      startPosition: 42,
      initialBitrate: 1_000_000,
    });
    expect(source.type).toBe('m3u8');
    expect(source.startPosition).toBe(42_000);
    expect(source.bufferConfig.bufferForPlaybackMs).toBeLessThanOrEqual(1000);
    expect(source.bufferConfig.minBufferMs).toBeLessThan(VOD_BUFFER.maxBufferMs);
    expect(source.bufferConfig.minBufferMs).toBeGreaterThanOrEqual(source.bufferConfig.bufferForPlaybackAfterRebufferMs);
    expect(source.bufferConfig.backBufferDurationMs).toBeGreaterThanOrEqual(15_000);
    expect(source.bufferConfig.initialBitrate).toBe(1_000_000);
  });

  it('does not restart a live edge from an old position', () => {
    const source = buildPlaybackSource('https://cdn.example/live.m3u8', {
      live: true,
      startPosition: 90,
    });
    expect(source.startPosition).toBeUndefined();
    expect(source.bufferConfig.live?.targetOffsetMs).toBe(LIVE_BUFFER.live?.targetOffsetMs);
    expect(source.bufferConfig.live?.targetOffsetMs).toBeLessThanOrEqual(3_000);
    expect(source.bufferConfig.maxBufferMs).toBeGreaterThanOrEqual(source.bufferConfig.minBufferMs);
  });

  it('plays the progressive mp4 the learner API returns, and signed hls', () => {
    expect(playableStream({type: 'progressive_mp4', url: 'https://cdn.example/lesson.mp4'})).toEqual({
      url: 'https://cdn.example/lesson.mp4',
      mediaType: 'mp4',
    });
    expect(playableStream({type: 'mux_hls', url: 'https://stream.example/index.m3u8'})?.mediaType).toBe('m3u8');
    expect(playableStream({type: 'progressive_mp4', url: 'http://cdn.example/lesson.mp4'})).toBeUndefined();
    expect(playableStream({type: 'dash', url: 'https://cdn.example/lesson.mpd'})).toBeUndefined();
    expect(playableStream({
      type: 'progressive_mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    })).toBeUndefined();
  });

  it('lets the player sniff files that are not hls', () => {
    expect(buildPlaybackSource('https://cdn.example/clip.mp4').type).toBe('mp4');
    expect(buildPlaybackSource('https://cdn.example/stream').type).toBeUndefined();
    expect(buildPlaybackSource('https://cdn.example/lesson.m3u8', {startPosition: 0.2}).startPosition).toBeUndefined();
  });
});
