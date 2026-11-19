import {createThemedStyles} from '../../theme';
import React, {useCallback, useState} from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {colors, space} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard, IconButton} from '../../components/ui/Clay';
import {Screen, StickyActionFooter} from '../../components/layout/Screen';
import {Chalkboard} from '../../assets/illustrations';
import {MediaPlayer} from '../../components/media/MediaPlayer';
import type {HomeNav} from '../../navigation/types';
import {accountKey, isAuthenticated} from '../../core/session';
import {queryClient} from '../../core/query';
import {useResource} from '../../core/useResource';
import {usePreferencesStore} from '../../features/settings/preferencesStore';
import {videoBitRate, videoInitialBitRate} from '../../features/settings/preferences';

export function LessonPlayerScreen() {
  const navigation = useNavigation<HomeNav>();
  const {courseId: routeCourseId, lessonId} = useRoute().params as {courseId?: string; lessonId: string};
  const repos = useRepositories();
  const [tab, setTab] = useState<'Notes' | 'Q&A' | 'Docs' | 'Chat'>('Notes');
  const focused = useIsFocused();
  const [playbackError, setPlaybackError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const quality = usePreferencesStore(s => s.videoQuality);
  const [progressError, setProgressError] = useState(false);
  React.useEffect(() => { setPlaybackError(false); }, [lessonId]);
  const lesson = useQuery({queryKey: ['lesson', accountKey(), routeCourseId, lessonId], queryFn: () => repos.learning.lesson(lessonId)});
  const videoResource = lesson.data?.resources.find(item => item.kind === 'video');
  const playback = useQuery({
    queryKey: ['playback', accountKey(), videoResource?.id],
    enabled: Boolean(videoResource) && isAuthenticated() && lesson.data?.state !== 'locked',
    staleTime: 45_000,
    queryFn: () => repos.account.authorizeDownload(videoResource!.id),
    refetchInterval: query => {
      const seconds = query.state.data?.playback?.expiresInSeconds;
      if (!seconds || seconds <= 0) return false;
      return Math.max(15_000, (seconds - 30) * 1000);
    },
  });
  const stream = playback.data?.playback;
  const streamUrl = stream?.url && (stream.type === 'mux_hls' || stream.type === 'cloudinary_hls') ? stream.url : undefined;
  const complete = useMutation({mutationFn: () => repos.learning.completeLesson(lessonId), onSuccess: () => queryClient.invalidateQueries()});
  const resource = useResource();
  const saveProgress = useCallback((currentTime: number, duration: number) => {
    if (!isAuthenticated() || currentTime < 1) return;
    const progressPct = duration > 0 ? (currentTime / duration) * 100 : undefined;
    void repos.learning.saveProgress(lessonId, currentTime, progressPct)
      .then(() => setProgressError(prev => (prev ? false : prev)))
      .catch(() => setProgressError(prev => (prev ? prev : true)));
  }, [lessonId, repos.learning]);
  const retryPlayback = useCallback(() => {
    setPlaybackError(false);
    void playback.refetch().finally(() => setReloadToken(value => value + 1));
  }, [playback]);

  return (
    <Screen padded={false}>
      <View style={styles.player}>
        {streamUrl && lesson.data?.state !== 'locked' ? (
          <MediaPlayer
            uri={streamUrl}
            sessionKey={lessonId}
            reloadToken={reloadToken}
            active={focused && !playbackError}
            mediaType="m3u8"
            maxBitRate={videoBitRate(quality)}
            initialBitrate={videoInitialBitRate(quality)}
            badge={quality}
            onBack={() => navigation.goBack()}
            onError={() => setPlaybackError(true)}
            onTimeUpdate={saveProgress}
          />
        ) : (
          <View style={styles.poster}>
            <View style={styles.posterBack}>
              <IconButton icon="back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
            </View>
            <Chalkboard lines={['RACI', 'Learn at', 'your pace']} />
          </View>
        )}
      </View>
      {lesson.isLoading ? <LoadingBlock /> : null}
      {lesson.isError ? <ErrorState message="This lesson could not be opened." onRetry={() => lesson.refetch()} /> : null}
      {playbackError ? <ErrorState message="Video playback stopped. Check your connection and try again." onRetry={retryPlayback} /> : null}
      {lesson.data ? (
        <>
          <ScrollView contentContainerStyle={styles.page}>
            <AppText weight="900" size={18} color={colors.navy}>{lesson.data.title}</AppText>
            <AppText size={12} color={colors.text2}>Course lesson {lesson.data.index}</AppText>
            <View style={styles.tabs}>
              {(['Notes', 'Docs'] as const).map(item => (
                <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabOn]}>
                  <AppText weight="800" size={11} color={tab === item ? colors.primary : colors.text2}>{item}</AppText>
                </Pressable>
              ))}
            </View>
            {tab === 'Notes' ? <ClayCard variant="white"><AppText size={13} style={{lineHeight: 21}}>{lesson.data.notes ?? 'No notes have been added to this lesson yet.'}</AppText></ClayCard> : null}
            {tab === 'Docs' ? lesson.data.resources.filter(res => res.kind !== 'video').map(res => (
              <ClayCard key={res.id} variant="sky"><AppText weight="800">{res.title}</AppText><AppText size={11} color={colors.text2}>{res.mimeType}</AppText>{res.canDownload && isAuthenticated() ? <>
                <ClayButton label="Open resource" compact disabled={resource.busy} onPress={() => navigation.navigate('ProtectedViewer', {resourceId: res.id, title: res.title, mimeType: res.mimeType, kind: res.kind === 'pdf' || res.mimeType === 'application/pdf' ? 'pdf' : res.kind})} />
                {res.mimeType === 'application/pdf' || res.kind === 'pdf' ? <ClayButton label={resource.busy ? 'Working…' : 'Save PDF'} compact tone="ghost" disabled={resource.busy} onPress={() => resource.open({resourceId: res.id, title: res.title, kind: 'pdf', mimeType: 'application/pdf'}, true)} /> : null}
              </> : null}</ClayCard>
            )) : null}
            {lesson.data.hasMedia && !videoResource ? <AppText size={12} color={colors.text2}>This lesson has media, but the catalogue has not attached a resource id yet.</AppText> : null}
            {stream && !streamUrl ? <AppText size={12} color={colors.text2}>{stream.status === 'not_ready_or_signing_not_configured' ? 'This video is not ready to play yet.' : 'This video cannot be played inside the app yet.'}</AppText> : null}
            {playback.isError ? <AppText color={colors.error}>Video access could not be authorized.</AppText> : null}
            {tab === 'Docs' && !lesson.data.resources.length ? <AppText>No resources have been added yet.</AppText> : null}
            {resource.error ? <AppText color={colors.error}>{resource.error}</AppText> : null}
            {progressError ? <AppText color={colors.error}>Your progress could not be saved. We will retry while you keep watching.</AppText> : null}
            {complete.isError ? <AppText color={colors.error}>The lesson could not be marked complete. Please retry.</AppText> : null}
          </ScrollView>
          <StickyActionFooter>
            <ClayButton disabled={complete.isPending || complete.isSuccess || lesson.data.state === 'locked' || !isAuthenticated()} label={complete.isSuccess ? 'Completed' : complete.isPending ? 'Saving…' : 'Mark as complete'} onPress={() => complete.mutate()} />
          </StickyActionFooter>
        </>
      ) : null}
    </Screen>
  );
}

const styles = createThemedStyles({
  player: {height: 228, backgroundColor: '#0D1B3E', overflow: 'hidden'},
  poster: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  posterBack: {position: 'absolute', top: 12, left: 12},
  page: {padding: space.pageX, gap: 12, paddingBottom: 26},
  tabs: {flexDirection: 'row', backgroundColor: colors.pressed, borderRadius: 14, padding: 4},
  tab: {flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12},
  tabOn: {backgroundColor: '#fff'},
});
