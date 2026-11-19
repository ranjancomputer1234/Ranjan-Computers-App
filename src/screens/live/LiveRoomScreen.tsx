import React from 'react';
import {Alert, Pressable, ScrollView, TextInput, View} from 'react-native';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';
import {isAppError, isFeatureUnavailable} from '../../core/api/http';
import {useSessionStore} from '../../core/session';
import {brand, colors, gradients} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Chalkboard} from '../../assets/illustrations';
import {Gradient} from '../../components/ui/Gradient';
import {Icon} from '../../assets/icons';
import type {HomeNav} from '../../navigation/types';
import {useLiveRoom} from '../../features/live/hooks/useLiveRoom';
import {MediaPlayer} from '../../components/media/MediaPlayer';
import {styles} from './styles';
import {useUiTranslation} from '../../features/settings/uiTranslations';

export function LiveRoomScreen() {
  const tx = useUiTranslation();
  const navigation = useNavigation<HomeNav>();
  const liveClassId = (useRoute().params as {liveClassId: string}).liveClassId;
  const {cls, join, chat, send, hand, message, setMessage, raised, authenticated, chatAvailable} = useLiveRoom(liveClassId);
  const focused = useIsFocused();
  const chatInput = React.useRef<React.ElementRef<typeof TextInput>>(null);
  const [playbackError, setPlaybackError] = React.useState(false);
  const [reloadToken, setReloadToken] = React.useState(0);
  const isLive = ['live', 'starting', 'reconnecting'].includes(cls.data?.status ?? '');
  const hasVideo = Boolean(join.data?.playbackUrl);
  const waitingForLink = authenticated && join.isSuccess && !join.data?.playbackUrl;
  const joinMessage = join.isError
    ? isFeatureUnavailable(join.error) || (isAppError(join.error) && (join.error.httpStatus === 404 || join.error.httpStatus === 409))
      ? 'This class is not open yet. It may still be a draft, or the classroom link has not been published.'
      : 'Join was not authorized.'
    : '';

  React.useEffect(() => {
    setPlaybackError(false);
  }, [liveClassId]);

  const retryPlayback = () => {
    setPlaybackError(false);
    void join.refetch().finally(() => setReloadToken(value => value + 1));
  };

  return (
    <Screen padded={false}>
      <DetailHeader
        title="Live Class Room"
        subtitle={brand.institute}
        onBack={() => navigation.goBack()}
        onMore={() => Alert.alert('Class options', 'Playback and classroom controls are available below.')}
      />
      <View style={styles.playerFrame}>
        {hasVideo ? (
          <MediaPlayer
            uri={join.data!.playbackUrl!}
            sessionKey={liveClassId}
            reloadToken={reloadToken}
            live={isLive}
            active={focused && !playbackError}
            onError={() => setPlaybackError(true)}
            onMic={chatAvailable ? () => chatInput.current?.focus() : undefined}
          />
        ) : (
          <Gradient colors={['#0D1B3E', '#0D47A1', '#1565C0']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.playerStage}>
            <Chalkboard lines={[cls.data?.title?.split('—')[0]?.trim() ?? 'RACI', 'Live Classroom']} />
          </Gradient>
        )}
        <View style={styles.playerTop} pointerEvents="none">
          {hasVideo || isLive ? (
            <View style={[styles.livePill, !isLive && styles.recordingPill]}>
              {isLive ? <View style={styles.liveDot} /> : <Icon name="play" size={9} color="#fff" filled />}
              <AppText weight="800" size={9.5} color="#fff" style={{letterSpacing: 1.4}}>{isLive ? 'LIVE' : 'RECORDING'}</AppText>
            </View>
          ) : null}
          {cls.data?.viewerCount ? (
            <View style={styles.viewerPill}>
              <Icon name="eye" size={13} color="#E3F2FD" />
              <AppText weight="600" size={10} color="#E3F2FD">{cls.data.viewerCount.toLocaleString('en-IN')} watching</AppText>
            </View>
          ) : null}
        </View>
      </View>
      <ScrollView style={styles.roomScroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        {cls.isLoading || join.isLoading ? <LoadingBlock /> : null}
        {cls.isError ? <ErrorState message="This class is unavailable." onRetry={() => cls.refetch()} /> : null}
        {join.isError ? <ErrorState message={joinMessage} onRetry={isFeatureUnavailable(join.error) ? undefined : () => join.refetch()} /> : null}
        {waitingForLink ? <AppText size={13} color={colors.text2}>This class is not open yet. The classroom link has not been published.</AppText> : null}
        {playbackError ? <ErrorState message="The stream stopped. Please try reconnecting." onRetry={retryPlayback} /> : null}
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
