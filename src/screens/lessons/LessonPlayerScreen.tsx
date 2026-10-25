import {createThemedStyles} from '../../theme';
import React, {useRef, useState} from 'react';
import {AppState, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';
import {useMutation, useQuery} from '@tanstack/react-query';
import Video, {type VideoRef} from 'react-native-video';
import {useRepositories} from '../../core/di';
import {colors, space} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {Screen, StickyActionFooter} from '../../components/layout/Screen';
import {IconButton} from '../../components/ui/Clay';
import {Chalkboard} from '../../assets/illustrations';
import type {HomeNav} from '../../navigation/types';
import {accountKey, isAuthenticated} from '../../core/session';
import {queryClient} from '../../core/query';
import {useResource} from '../../core/useResource';
import {usePreferencesStore} from '../../features/settings/preferencesStore';
import {videoBitRate} from '../../features/settings/preferences';

export function LessonPlayerScreen() {
  const navigation = useNavigation<HomeNav>();
  const {courseId: routeCourseId, lessonId} = useRoute().params as {courseId?: string; lessonId: string};
  const repos = useRepositories();
  const [tab, setTab] = useState<'Notes' | 'Q&A' | 'Docs' | 'Chat'>('Notes');
  const last = useRef(0);
  const duration = useRef(0);
  const video = useRef<VideoRef>(null);
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [playbackError, setPlaybackError] = useState(false);
  const quality = usePreferencesStore(s => s.videoQuality);
  const [progressError, setProgressError] = useState(false);
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  React.useEffect(() => { last.current = 0; setPlaybackError(false); }, [lessonId]);
  const lesson = useQuery({queryKey: ['lesson', accountKey(), routeCourseId, lessonId], queryFn: () => repos.learning.lesson(lessonId)});
  const videoResource = lesson.data?.resources.find(item => item.kind === 'video');
  const playback = useQuery({
    queryKey: ['playback', accountKey(), videoResource?.id],
    enabled: Boolean(videoResource) && isAuthenticated() && lesson.data?.state !== 'locked',
    staleTime: 0,
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

  return (
    <Screen padded={false}>
      <View style={styles.player}>
        {streamUrl && lesson.data?.state !== 'locked' && !playbackError ? (
          <Video
            ref={video}
            source={{uri: streamUrl, type: 'm3u8'}}
            style={StyleSheet.absoluteFill}
            controls
            paused={!focused || !active}
            playInBackground={false}
            maxBitRate={videoBitRate(quality)}
            onError={() => setPlaybackError(true)}
            onLoad={({duration: length}) => { duration.current = length; }}
            resizeMode="contain"
            onProgress={({currentTime}) => {
              if (isAuthenticated() && Date.now() - last.current > 15000) {
                last.current = Date.now();
                const progressPct = duration.current > 0 ? (currentTime / duration.current) * 100 : undefined;
                void repos.learning.saveProgress(lessonId, currentTime, progressPct).then(() => setProgressError(false)).catch(() => setProgressError(true));
              }
            }}
          />
        ) : (
          <View style={styles.poster}><Chalkboard lines={['RACI', 'Learn at', 'your pace']} /></View>
        )}
        <View style={styles.overlay}>
          <IconButton icon="back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
          <AppText size={11} weight="700" color="#fff">{quality}</AppText>
        </View>
      </View>
      {lesson.isLoading ? <LoadingBlock /> : null}
      {lesson.isError ? <ErrorState message="This lesson could not be opened." onRetry={() => lesson.refetch()} /> : null}
      {playbackError ? <ErrorState message="Video playback stopped. Check your connection and try again." onRetry={() => { setPlaybackError(false); void lesson.refetch(); }} /> : null}
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
  player: {height: 228, backgroundColor: '#0D1B3E', justifyContent: 'center', alignItems: 'center'},
  poster: {alignItems: 'center'},
  overlay: {position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  page: {padding: space.pageX, gap: 12, paddingBottom: 26},
  tabs: {flexDirection: 'row', backgroundColor: colors.pressed, borderRadius: 14, padding: 4},
  tab: {flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12},
  tabOn: {backgroundColor: '#fff'},
});
