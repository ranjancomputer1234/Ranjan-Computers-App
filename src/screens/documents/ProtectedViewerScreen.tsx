import React from 'react';
import {Image, NativeModules, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useIsFocused, useRoute} from '@react-navigation/native';
import {useRepositories} from '../../core/di';
import {MediaPlayer} from '../../components/media/MediaPlayer';
import {usePreferencesStore} from '../../features/settings/preferencesStore';
import {videoBitRate, videoInitialBitRate} from '../../features/settings/preferences';
import {accountKey} from '../../core/session';
import {playableStream} from '../../core/playback';
import {offlineFiles} from '../../core/offlineFiles';
import {colors, space} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';

type ViewerParams = {
  resourceId: string;
  title: string;
  mimeType: string;
  kind: 'pdf' | 'video' | 'notes' | 'audio' | 'other';
};

type PdfModule = {
  renderPage: (path: string, index: number) => Promise<{path: string; pageCount: number; index: number}>;
};

type ViewState =
  | {mode: 'video'; url: string; mediaType: 'mp4' | 'm3u8'; expiresInSeconds: number | null}
  | {mode: 'note'; note: string}
  | {mode: 'pdf'; path: string; pageCount: number; index: number; imagePath: string};

export function ProtectedViewerScreen() {
  const params = useRoute().params as ViewerParams;
  const repos = useRepositories();
  const focused = useIsFocused();
  const quality = usePreferencesStore(s => s.videoQuality);
  const [state, setState] = React.useState<ViewState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reloadToken, setReloadToken] = React.useState(0);

  const load = React.useCallback(async (pageIndex = 0, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const auth = await repos.account.authorizeDownload(params.resourceId);
      if (params.kind === 'video' || auth.kind === 'video' || auth.playback) {
        const stream = playableStream(auth.playback);
        if (!stream) {
          if (silent) return;
          setState({
            mode: 'note',
            note: auth.playback?.status === 'not_ready_or_signing_not_configured'
              ? 'This video is not ready to play yet.'
              : auth.drmMessage || 'This video cannot be played inside the app yet.',
          });
          return;
        }
        setState({
          mode: 'video',
          url: stream.url,
          mediaType: stream.mediaType,
          expiresInSeconds: auth.playback?.expiresInSeconds ?? null,
        });
        return;
      }
      if (silent) return;
      const delivery = await offlineFiles.fetchPrivateCopy(auth);
      if (delivery.kind !== 'pdf') {
        setState({mode: 'note', note: delivery.note});
        return;
      }
      const pdf = NativeModules.RaciPdf as PdfModule | undefined;
      if (!pdf) {
        setState({mode: 'note', note: 'The in-app PDF viewer is not available on this device.'});
        return;
      }
      const page = await pdf.renderPage(delivery.path, pageIndex);
      setState({
        mode: 'pdf',
        path: delivery.path,
        pageCount: page.pageCount,
        index: page.index,
        imagePath: page.path,
      });
    } catch (cause) {
      if (silent) return;
      const message = cause && typeof cause === 'object' && 'message' in cause
        ? String((cause as {message: unknown}).message)
        : 'This file could not be opened inside the app.';
      setError(message);
      setState(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [params.kind, params.resourceId, repos.account]);

  React.useEffect(() => {
    void load(0);
  }, [load]);

  React.useEffect(() => {
    if (state?.mode !== 'video' || !state.expiresInSeconds) return;
    const delay = Math.max(15, state.expiresInSeconds - 30) * 1000;
    const timer = setTimeout(() => {
      void load(0, true);
    }, delay);
    return () => clearTimeout(timer);
  }, [load, state]);

  const showPage = async (index: number) => {
    if (state?.mode !== 'pdf') return;
    setLoading(true);
    setError(null);
    try {
      const auth = await repos.account.authorizeDownload(params.resourceId);
      if (!auth.offlineGrant) throw new Error('Offline authorization is no longer valid.');
      const pdf = NativeModules.RaciPdf as PdfModule;
      const page = await pdf.renderPage(state.path, index);
      setState({...state, pageCount: page.pageCount, index: page.index, imagePath: page.path});
    } catch (cause) {
      const message = cause && typeof cause === 'object' && 'message' in cause
        ? String((cause as {message: unknown}).message)
        : 'This page could not be shown.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false}>
      <DetailHeader title={params.title} subtitle="Inside the app only" />
      {loading && state?.mode !== 'video' ? <LoadingBlock /> : null}
      {error ? <ErrorState message={error} onRetry={() => {
        if (state?.mode === 'video') {
          setError(null);
          void load(0, true).finally(() => setReloadToken(value => value + 1));
          return;
        }
        void load(state?.mode === 'pdf' ? state.index : 0);
      }} /> : null}
      {state?.mode === 'note' ? (
        <View style={styles.note}>
          <AppText size={14} color={colors.navy}>{state.note}</AppText>
          <AppText size={12} color={colors.text2}>Sharing, printing, and public downloads stay off.</AppText>
        </View>
      ) : null}
      {state?.mode === 'video' ? (
        <View style={styles.video}>
          <MediaPlayer
            uri={state.url}
            sessionKey={params.resourceId}
            reloadToken={reloadToken}
            active={focused && !error}
            mediaType={state.mediaType}
            maxBitRate={videoBitRate(quality)}
            initialBitrate={videoInitialBitRate(quality)}
            onError={() => setError('Video playback stopped. A fresh authorization is required.')}
          />
        </View>
      ) : null}
      {state?.mode === 'pdf' ? (
        <ScrollView contentContainerStyle={styles.page}>
          <Image source={{uri: `file://${state.imagePath}`}} style={styles.image} resizeMode="contain" />
          <View style={styles.pager}>
            <ClayButton label="Previous" compact tone="ghost" disabled={state.index <= 0 || loading} onPress={() => void showPage(state.index - 1)} />
            <AppText weight="800" size={12} color={colors.text2}>{state.index + 1} / {state.pageCount}</AppText>
            <ClayButton label="Next" compact tone="ghost" disabled={state.index + 1 >= state.pageCount || loading} onPress={() => void showPage(state.index + 1)} />
          </View>
          <Pressable accessibilityRole="text">
            <AppText size={11} color={colors.text2}>This document stays inside {accountKey() === 'guest' ? 'the app' : 'your account'}.</AppText>
          </Pressable>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {padding: space.pageX, gap: 10},
  video: {height: 240, backgroundColor: '#0D1B3E'},
  page: {padding: space.pageX, gap: 12, paddingBottom: 28},
  image: {width: '100%', height: 480, backgroundColor: '#fff'},
  pager: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
});
