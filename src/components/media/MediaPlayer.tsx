import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Video, {
  type BufferingStrategyType,
  type OnLoadData,
  type OnProgressData,
  type VideoRef,
  type ViewType,
} from 'react-native-video';
import {Icon} from '../../assets/icons';
import {IconButton} from '../ui/Clay';
import {AppText} from '../ui/AppText';
import {Gradient} from '../ui/Gradient';
import {useUiTranslation} from '../../features/settings/uiTranslations';
import {buildPlaybackSource, formatClock} from './playbackSource';

const TEXTURE_VIEW = 0 as ViewType;
const PROGRESS_SAMPLE_MS = 15_000;

type Props = {
  uri: string;
  /** Changes when the lesson or class changes. A new signed URL alone does not. */
  sessionKey: string;
  /** Bump after a fresh URL is ready to reload without losing the playhead. */
  reloadToken?: number;
  live?: boolean;
  /** False while the screen is blurred. Backgrounding is handled here. */
  active?: boolean;
  maxBitRate?: number;
  initialBitrate?: number;
  mediaType?: string;
  badge?: string;
  onBack?: () => void;
  onMic?: () => void;
  onError?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Playback state stays inside this view. A time update must not re-render the
 * screen around it, and a refreshed signed URL must not restart the stream.
 */
export function MediaPlayer({
  uri,
  sessionKey,
  reloadToken = 0,
  live = false,
  active = true,
  maxBitRate,
  initialBitrate,
  mediaType,
  badge,
  onBack,
  onMic,
  onError,
  onTimeUpdate,
  style,
}: Props) {
  const tx = useUiTranslation();
  const videoRef = useRef<VideoRef>(null);
  const uriRef = useRef(uri);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const attempts = useRef(0);
  const scrubbing = useRef(false);
  const hasFrame = useRef(false);
  const endedRef = useRef(false);
  const trackWidthRef = useRef(1);
  const scrubOrigin = useRef(0);
  const lastSample = useRef(0);
  const readyFallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const buffered = useRef(new Animated.Value(0)).current;
  const onErrorRef = useRef(onError);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  uriRef.current = uri;
  onErrorRef.current = onError;
  onTimeUpdateRef.current = onTimeUpdate;

  const [loaded, setLoaded] = useState({uri, sessionKey, generation: 0});
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [userPaused, setUserPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [spinner, setSpinner] = useState(true);
  const [chrome, setChrome] = useState(true);
  const [interact, setInteract] = useState(0);
  const [clock, setClock] = useState(0);
  const [length, setLength] = useState(0);
  const [muted, setMuted] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);

  if (loaded.sessionKey !== sessionKey) {
    const time = positionRef.current;
    if (time > 1) onTimeUpdateRef.current?.(time, durationRef.current);
    positionRef.current = 0;
    durationRef.current = 0;
    attempts.current = 0;
    hasFrame.current = false;
    endedRef.current = false;
    lastSample.current = 0;
    progress.setValue(0);
    buffered.setValue(0);
    setLoaded({uri, sessionKey, generation: 0});
    setClock(0);
    setLength(0);
    setUserPaused(false);
    setEnded(false);
    setWaiting(true);
    setChrome(true);
  }

  const activeSource = loaded.sessionKey === sessionKey ? loaded : {uri, sessionKey, generation: 0};
  endedRef.current = ended;

  const source = useMemo(
    () =>
      buildPlaybackSource(activeSource.uri, {
        startPosition: positionRef.current,
        live,
        initialBitrate,
        mediaType,
      }),
    [activeSource.uri, activeSource.generation, activeSource.sessionKey, live, initialBitrate, mediaType],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (readyFallback.current) clearTimeout(readyFallback.current);
      const time = positionRef.current;
      if (time > 1) onTimeUpdateRef.current?.(time, durationRef.current);
    };
  }, [sessionKey]);

  useEffect(() => {
    if (!waiting) {
      setSpinner(false);
      return;
    }
    const delay = hasFrame.current ? 280 : 0;
    const timer = setTimeout(() => setSpinner(true), delay);
    return () => clearTimeout(timer);
  }, [waiting]);

  useEffect(() => {
    if (!chrome || userPaused || waiting) return;
    const timer = setTimeout(() => {
      if (!scrubbing.current) setChrome(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, [chrome, userPaused, waiting, interact]);

  const seenReload = useRef(reloadToken);
  useEffect(() => {
    if (seenReload.current === reloadToken) return;
    seenReload.current = reloadToken;
    const next = uriRef.current;
    if (!next) return;
    attempts.current = 0;
    hasFrame.current = false;
    setWaiting(true);
    setLoaded(prev => ({...prev, uri: next, generation: prev.generation + 1}));
  }, [reloadToken]);

  const reveal = useCallback(() => {
    setChrome(true);
    setInteract(value => value + 1);
  }, []);

  const publishClock = useCallback((current: number, duration: number) => {
    const nextClock = Math.floor(current);
    const nextLength = Math.floor(duration);
    setClock(prev => (prev === nextClock ? prev : nextClock));
    setLength(prev => (prev === nextLength ? prev : nextLength));
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const duration = durationRef.current;
    const next = duration > 0 ? Math.max(0, Math.min(duration, seconds)) : Math.max(0, seconds);
    positionRef.current = next;
    if (duration > 0) progress.setValue(next / duration);
    endedRef.current = false;
    setEnded(false);
    publishClock(next, duration);
    videoRef.current?.seek(next);
  }, [progress, publishClock]);

  const onProgress = useCallback((event: OnProgressData) => {
    const duration = event.seekableDuration > 1 ? event.seekableDuration : durationRef.current;
    if (duration > 0) durationRef.current = duration;
    if (scrubbing.current) return;
    positionRef.current = event.currentTime;
    if (duration > 0) {
      progress.setValue(Math.max(0, Math.min(1, event.currentTime / duration)));
      buffered.setValue(Math.max(0, Math.min(1, event.playableDuration / duration)));
    }
    publishClock(event.currentTime, duration);
    const now = Date.now();
    if (now - lastSample.current >= PROGRESS_SAMPLE_MS && event.currentTime > 1) {
      lastSample.current = now;
      onTimeUpdateRef.current?.(event.currentTime, duration);
    }
  }, [buffered, progress, publishClock]);

  const onLoad = useCallback((event: OnLoadData) => {
    const duration = Number.isFinite(event.duration) ? event.duration : 0;
    durationRef.current = duration;
    attempts.current = 0;
    const resume = positionRef.current;
    const at = event.currentTime ?? 0;
    if (!live && resume > 0.75 && Math.abs(at - resume) > 1.5) {
      videoRef.current?.seek(resume);
    }
    publishClock(resume > 0 ? resume : at, duration);
    if (readyFallback.current) clearTimeout(readyFallback.current);
    readyFallback.current = setTimeout(() => setWaiting(false), 700);
  }, [live, publishClock]);

  const onVideoError = useCallback(() => {
    const next = uriRef.current;
    if (next && attempts.current < 2) {
      attempts.current += 1;
      hasFrame.current = false;
      setWaiting(true);
      setLoaded(prev => ({...prev, uri: next, generation: prev.generation + 1}));
      return;
    }
    onErrorRef.current?.();
  }, []);

  const togglePlay = useCallback(() => {
    reveal();
    if (endedRef.current) {
      seekTo(0);
      setUserPaused(false);
      return;
    }
    setUserPaused(value => !value);
  }, [reveal, seekTo]);

  const seekBy = useCallback((amount: number) => {
    reveal();
    seekTo(positionRef.current + amount);
  }, [reveal, seekTo]);

  const ratioFromDelta = useCallback((dx: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return 0;
    return Math.max(0, Math.min(1, (scrubOrigin.current + dx) / width));
  }, []);

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => durationRef.current > 1,
    onMoveShouldSetPanResponder: (_, gesture) => durationRef.current > 1 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: event => {
      scrubbing.current = true;
      scrubOrigin.current = event.nativeEvent.locationX;
      setChrome(true);
      const ratio = ratioFromDelta(0);
      progress.setValue(ratio);
      publishClock(ratio * durationRef.current, durationRef.current);
    },
    onPanResponderMove: (_, gesture) => {
      const ratio = ratioFromDelta(gesture.dx);
      progress.setValue(ratio);
      positionRef.current = ratio * durationRef.current;
      publishClock(positionRef.current, durationRef.current);
    },
    onPanResponderRelease: (_, gesture) => {
      const ratio = ratioFromDelta(gesture.dx);
      scrubbing.current = false;
      seekTo(ratio * durationRef.current);
      setInteract(value => value + 1);
    },
    onPanResponderTerminate: () => {
      scrubbing.current = false;
    },
  }), [progress, publishClock, ratioFromDelta, seekTo]);

  const knobX = useMemo(() => Animated.multiply(progress, Math.max(trackWidth, 1)), [progress, trackWidth]);
  const canSeek = !live && length > 1;
  const paused = userPaused || !active || !foreground;
  const showSpinner = waiting && spinner;

  return (
    <View style={[styles.root, style]} collapsable={false}>
      <Video
        ref={videoRef}
        source={source}
        style={styles.fill}
        resizeMode="contain"
        paused={paused}
        muted={muted}
        rate={1}
        repeat={false}
        controls={false}
        playInBackground={false}
        playWhenInactive={false}
        enterPictureInPictureOnLeave={false}
        preventsDisplaySleepDuringVideoPlayback
        automaticallyWaitsToMinimizeStalling={false}
        preferredForwardBufferDuration={live ? 2 : 8}
        progressUpdateInterval={250}
        viewType={TEXTURE_VIEW}
        bufferingStrategy={'DependingOnMemory' as BufferingStrategyType}
        shutterColor="#0D1B3E"
        ignoreSilentSwitch="ignore"
        maxBitRate={maxBitRate && maxBitRate > 0 ? maxBitRate : undefined}
        onLoadStart={() => {
          if (!hasFrame.current) setWaiting(true);
        }}
        onLoad={onLoad}
        onReadyForDisplay={() => {
          if (readyFallback.current) clearTimeout(readyFallback.current);
          hasFrame.current = true;
          attempts.current = 0;
          setWaiting(false);
        }}
        onBuffer={({isBuffering}) => {
          if (!hasFrame.current) return;
          setWaiting(isBuffering);
        }}
        onProgress={onProgress}
        onEnd={() => {
          if (live) return;
          endedRef.current = true;
          setEnded(true);
          setUserPaused(true);
          setChrome(true);
        }}
        onError={onVideoError}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tx(chrome ? 'Hide player controls' : 'Show player controls')}
        onPress={() => {
          if (chrome && !userPaused) setChrome(false);
          else reveal();
        }}
        style={styles.fill}
      />

      {showSpinner ? (
        <View pointerEvents="none" style={styles.spinner}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      ) : null}

      {userPaused && !showSpinner ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Play')}
          onPress={togglePlay}
          style={styles.bigPlay}>
          <Icon name="play" size={26} color="#fff" filled />
        </Pressable>
      ) : null}

      <View pointerEvents="box-none" style={styles.header}>
        {onBack ? <IconButton icon="back" color="#102A43" onPress={onBack} accessibilityLabel="Back" /> : <View />}
        {badge ? (
          <View style={styles.badge}>
            <AppText weight="700" size={10} color="#fff">{badge}</AppText>
          </View>
        ) : null}
      </View>

      {chrome ? (
        <View pointerEvents="box-none" style={styles.scrimWrap}>
          <Gradient colors={['rgba(6,16,40,0)', 'rgba(6,16,40,0.9)']} style={styles.scrim}>
            {canSeek ? (
              <View
                accessibilityRole="adjustable"
                accessibilityLabel={tx('Playback position')}
                accessibilityValue={{min: 0, max: length, now: clock}}
                onLayout={event => {
                  const width = event.nativeEvent.layout.width;
                  trackWidthRef.current = width;
                  setTrackWidth(prev => (prev === width ? prev : width));
                }}
                style={styles.trackHit}
                {...pan.panHandlers}>
                <View pointerEvents="none" style={styles.track}>
                  {trackWidth > 0 ? (
                    <>
                      <Animated.View pointerEvents="none" style={[styles.bar, styles.buffered, {width: trackWidth, transform: [{translateX: -trackWidth / 2}, {scaleX: buffered}, {translateX: trackWidth / 2}]}]} />
                      <Animated.View pointerEvents="none" style={[styles.bar, styles.played, {width: trackWidth, transform: [{translateX: -trackWidth / 2}, {scaleX: progress}, {translateX: trackWidth / 2}]}]} />
                    </>
                  ) : null}
                </View>
                {trackWidth > 0 ? <Animated.View pointerEvents="none" style={[styles.knob, {transform: [{translateX: knobX}]}]} /> : null}
              </View>
            ) : null}
            {canSeek ? (
              <View style={styles.timeRow}>
                <AppText weight="700" size={11} color="#fff" translate={false}>{formatClock(clock)}</AppText>
                <AppText weight="600" size={11} color="rgba(255,255,255,0.78)" translate={false}>{formatClock(length)}</AppText>
              </View>
            ) : null}
            <View style={styles.controls}>
              {canSeek ? (
                <Control icon="skipb" label="Back 10 seconds" onPress={() => seekBy(-10)} />
              ) : <View style={styles.controlSpacer} />}
              <Control icon={userPaused ? 'play' : 'pause'} label={userPaused ? 'Play' : 'Pause'} onPress={togglePlay} filled={userPaused} />
              {canSeek ? (
                <Control icon="skipf" label="Forward 10 seconds" onPress={() => seekBy(10)} />
              ) : <View style={styles.controlSpacer} />}
              <View style={styles.flex} />
              {onMic ? <Control icon="mic" label="Microphone" onPress={() => { reveal(); onMic(); }} /> : null}
              <Control icon="vol" label={muted ? 'Unmute' : 'Mute'} onPress={() => { reveal(); setMuted(value => !value); }} dimmed={muted} />
              <Control icon="max" label="Full screen" onPress={() => { reveal(); videoRef.current?.presentFullscreenPlayer(); }} />
            </View>
          </Gradient>
        </View>
      ) : null}
    </View>
  );
}

function Control({
  icon,
  label,
  onPress,
  filled,
  dimmed,
}: {
  icon: 'skipb' | 'skipf' | 'play' | 'pause' | 'mic' | 'vol' | 'max';
  label: string;
  onPress: () => void;
  filled?: boolean;
  dimmed?: boolean;
}) {
  const tx = useUiTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tx(label)}
      hitSlop={6}
      onPress={onPress}
      style={({pressed}) => [styles.control, pressed && styles.controlPressed, dimmed && styles.controlDimmed]}>
      {icon === 'pause' ? <PauseMark /> : <Icon name={icon} size={16} color="#E3F2FD" filled={filled} />}
    </Pressable>
  );
}

function PauseMark() {
  return (
    <View style={styles.pause}>
      <View style={styles.pauseBar} />
      <View style={styles.pauseBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#0D1B3E', overflow: 'hidden'},
  fill: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
  spinner: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 64,
    height: 64,
    marginTop: -32,
    marginLeft: -32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(13,27,62,0.55)',
  },
  scrimWrap: {position: 'absolute', left: 0, right: 0, bottom: 0},
  scrim: {paddingHorizontal: 10, paddingTop: 22, paddingBottom: 8},
  trackHit: {height: 22, justifyContent: 'center', marginBottom: 2},
  track: {height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden'},
  bar: {position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99},
  buffered: {backgroundColor: 'rgba(255,255,255,0.38)'},
  played: {backgroundColor: '#FF8F00'},
  knob: {
    position: 'absolute',
    left: -6,
    top: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  timeRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2},
  controls: {flexDirection: 'row', alignItems: 'center', gap: 8},
  control: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  controlPressed: {opacity: 0.72},
  controlDimmed: {opacity: 0.55},
  controlSpacer: {width: 36, height: 36},
  flex: {flex: 1},
  pause: {flexDirection: 'row', alignItems: 'center', gap: 3},
  pauseBar: {width: 3.5, height: 13, borderRadius: 1, backgroundColor: '#E3F2FD'},
});
