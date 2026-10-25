import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';
import Video, {type VideoRef} from 'react-native-video';
import {useSessionStore} from '../../core/session';
import {brand, colors, gradients} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Chalkboard} from '../../assets/illustrations';
import {Gradient} from '../../components/ui/Gradient';
import {Icon} from '../../assets/icons';
import type {HomeNav} from '../../navigation/types';
import {useLiveRoom} from '../../features/live/hooks/useLiveRoom';
import {styles} from './styles';
import {useUiTranslation} from '../../features/settings/uiTranslations';

const formatClock = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

export function LiveRoomScreen() {
  const tx = useUiTranslation();
  const navigation = useNavigation<HomeNav>();
  const liveClassId = (useRoute().params as {liveClassId: string}).liveClassId;
  const {cls, join, chat, send, hand, message, setMessage, raised, authenticated, chatAvailable} = useLiveRoom(liveClassId);
  const focused = useIsFocused();
  const video = React.useRef<VideoRef>(null);
  const chatInput = React.useRef<React.ElementRef<typeof TextInput>>(null);
  const [playbackError, setPlaybackError] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const isLive = ['live', 'starting', 'reconnecting'].includes(cls.data?.status ?? '');
  const hasVideo = Boolean(join.data?.playbackUrl && !playbackError);

  React.useEffect(() => {
    setPlaybackError(false);
    setPaused(false);
    setCurrentTime(0);
  }, [liveClassId]);

  const seekBy = (amount: number) => {
    const next = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, currentTime + amount));
    video.current?.seek(next);
    setCurrentTime(next);
  };

  return (
    <Screen padded={false}>
      <DetailHeader
        title="Live Class Room"
        subtitle={brand.institute}
        onBack={() => navigation.goBack()}
        onMore={() => Alert.alert('Class options', 'Playback and classroom controls are available below.')}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Gradient colors={['#0D1B3E', '#0D47A1', '#1565C0']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.player}>
          {hasVideo ? (
            <Video
              ref={video}
              source={{uri: join.data!.playbackUrl!}}
              paused={!focused || paused}
              muted={muted}
              playInBackground={false}
              onError={() => setPlaybackError(true)}
              onLoad={event => setDuration(event.duration)}
              onProgress={event => setCurrentTime(event.currentTime)}
              style={StyleSheet.absoluteFill}
              controls={false}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.playerStage}>
              <Chalkboard lines={[cls.data?.title?.split('—')[0]?.trim() ?? 'RACI', 'Live Classroom']} />
            </View>
          )}

          <View style={styles.playerTop} pointerEvents="none">
            <View style={[styles.livePill, !isLive && styles.recordingPill]}>
              {isLive ? <View style={styles.liveDot} /> : <Icon name="play" size={9} color="#fff" filled />}
              <AppText weight="800" size={9.5} color="#fff" style={{letterSpacing: 1.4}}>{isLive ? 'LIVE' : 'RECORDING'}</AppText>
            </View>
            {cls.data?.viewerCount ? (
              <View style={styles.viewerPill}>
                <Icon name="eye" size={13} color="#E3F2FD" />
                <AppText weight="600" size={10} color="#E3F2FD">{cls.data.viewerCount.toLocaleString('en-IN')} watching</AppText>
              </View>
            ) : null}
          </View>

          {paused && hasVideo ? (
            <Pressable accessibilityRole="button" accessibilityLabel={tx('Play')} onPress={() => setPaused(false)} style={styles.bigPlay}>
              <Icon name="play" size={24} color="#fff" filled />
            </Pressable>
          ) : null}

          <View style={styles.progressTrack}>
            <Gradient colors={gradients.orangeCta} style={[styles.progressFill, {width: `${duration ? Math.min(100, currentTime / duration * 100) : 0}%`}]} />
          </View>
          <View style={styles.playerControls}>
            <PlayerButton icon="skipb" label="Back 10 seconds" onPress={() => seekBy(-10)} />
            <PlayerButton icon="play" label={paused ? 'Play' : 'Pause'} onPress={() => setPaused(value => !value)} />
            <PlayerButton icon="skipf" label="Forward 10 seconds" onPress={() => seekBy(10)} />
            {chatAvailable ? <PlayerButton icon="mic" label="Microphone" onPress={() => chatInput.current?.focus()} /> : null}
            <AppText weight="600" size={9.5} color="rgba(255,255,255,0.85)" style={styles.playerTime}>{formatClock(currentTime)}</AppText>
            <PlayerButton icon="vol" label={muted ? 'Unmute' : 'Mute'} onPress={() => setMuted(value => !value)} />
            <PlayerButton icon="max" label="Full screen" onPress={() => video.current?.presentFullscreenPlayer()} />
          </View>
        </Gradient>

        {cls.isLoading || join.isLoading ? <LoadingBlock /> : null}
        {cls.isError ? <ErrorState message="This class is unavailable." onRetry={() => cls.refetch()} /> : null}
        {join.isError ? <ErrorState message="Join was not authorized." onRetry={() => join.refetch()} /> : null}
        {playbackError ? <ErrorState message="The stream stopped. Please try reconnecting." onRetry={() => { setPlaybackError(false); void join.refetch(); }} /> : null}
        {!authenticated ? (
          <ClayButton label="Sign in to join" onPress={() => {
            useSessionStore.getState().setPendingDestination({kind: 'liveClass', id: liveClassId});
            useSessionStore.getState().showLogin();
          }} />
        ) : null}

        {cls.data ? (
          <>
            <View style={styles.classInfo}>
              <View style={styles.classIcon}><Icon name="bank" size={20} color={colors.deepBlue} /></View>
              <View style={{flex: 1, gap: 5}}>
                <AppText weight="800" size={12} color={colors.navy}>{cls.data.title}</AppText>
                <AppText size={10} color={colors.text2}>
                  {cls.data.batch ?? 'RACI Batch'} · {new Date(cls.data.startsAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})} {new Date(cls.data.startsAt).toLocaleTimeString('en-IN', {hour: 'numeric', minute: '2-digit'})} · {cls.data.durationLabel ?? 'Live class'}
                </AppText>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => Alert.alert(cls.data!.instructorName, 'RACI faculty member')}
              style={styles.teacherCard}>
              <Gradient colors={gradients.avatar} style={styles.teacherAvatar}><Icon name="teacher" size={20} color="#fff" /></Gradient>
              <View style={{flex: 1, gap: 4}}>
                <View style={styles.teacherName}>
                  <AppText weight="800" size={12} color={colors.navy}>{cls.data.instructorName}</AppText>
                  <View style={styles.facultyChip}><AppText weight="700" size={8} color={colors.primary}>Faculty</AppText></View>
                </View>
                <AppText size={9.5} color={colors.text2}>Experienced RACI educator · live support</AppText>
              </View>
              <Icon name="chev" size={14} color="#B0BEC5" />
            </Pressable>
          </>
        ) : null}

        {chatAvailable ? (
          <View style={styles.chatCard}>
            <View style={styles.chatHead}>
              <AppText weight="800" size={16.5} color={colors.navy}>Live Chat</AppText>
              <View style={styles.onlineChip}><AppText weight="700" size={9} color={colors.success}>{cls.data?.viewerCount ?? chat.data?.length ?? 0} online</AppText></View>
            </View>
            {chat.isLoading ? <LoadingBlock /> : null}
            {chat.data?.map((item, index) => {
              const name = item.senderName ?? (item.mine ? 'You' : 'Learner');
              const palette = item.faculty ? ['#90CAF9', '#1976D2'] as const : index % 2 ? ['#FFCC80', '#FB8C00'] as const : ['#F48FB1', '#EC407A'] as const;
              return (
                <View key={item.id} style={styles.chatRow}>
                  <Gradient colors={palette} style={styles.chatAvatar}><AppText weight="800" size={9.5} color="#fff">{name.charAt(0).toUpperCase()}</AppText></Gradient>
                  <View style={[styles.chatBubble, item.faculty && styles.chatBubbleFaculty]}>
                    <AppText weight="800" size={10.5} color={colors.navy}>{name}</AppText>
                    <AppText size={10} color={colors.text2} style={{lineHeight: 14, marginTop: 3}}>{item.body}</AppText>
                  </View>
                </View>
              );
            })}
            <View style={styles.chatInput}>
              <Icon name="mic" size={16} color={colors.text3} />
              <TextInput
                ref={chatInput}
                value={message}
                onChangeText={setMessage}
                maxLength={1000}
                placeholder={tx('Type your doubt…')}
                placeholderTextColor={colors.text3}
                style={styles.chatTextInput}
                returnKeyType="send"
                onSubmitEditing={() => { if (message.trim() && !send.isPending) send.mutate(); }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('Send message')}
                disabled={send.isPending || !message.trim()}
                onPress={() => send.mutate()}
                style={({pressed}) => [{opacity: send.isPending || !message.trim() ? 0.45 : pressed ? 0.8 : 1}]}>
                <Gradient colors={gradients.primaryButton} style={styles.sendButton}><Icon name="send" size={16} color="#fff" /></Gradient>
              </Pressable>
            </View>
            {send.isError ? <AppText color={colors.error} size={10}>Message not sent. Please retry.</AppText> : null}
          </View>
        ) : null}

        {authenticated && join.data && isLive ? (
          <View style={styles.dualActions}>
            {chatAvailable ? <ClayButton label="Ask a Doubt" icon="chat" compact onPress={() => chatInput.current?.focus()} /> : null}
            <ClayButton label={hand.isPending ? 'Updating…' : raised ? 'Lower Hand' : 'Raise Hand'} icon="flag" tone="ghost" compact disabled={hand.isPending} onPress={() => hand.mutate()} />
          </View>
        ) : null}
        {hand.isError ? <AppText color={colors.error} size={11}>Could not update your hand. Please retry.</AppText> : null}
      </ScrollView>
    </Screen>
  );
}

function PlayerButton({icon, label, onPress}: {icon: 'skipb' | 'skipf' | 'play' | 'mic' | 'vol' | 'max'; label: string; onPress: () => void}) {
  const tx = useUiTranslation();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={tx(label)} onPress={onPress} style={styles.playerButton}>
      <Icon name={icon} size={15} color="#E3F2FD" filled={icon === 'play'} />
    </Pressable>
  );
}
