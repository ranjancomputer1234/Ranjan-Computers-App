import React, {useCallback, useMemo} from 'react';
import {Alert, Linking, Pressable, ScrollView, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey} from '../../core/session';
import {brand, colors, gradients} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {RediLogo} from '../../assets/illustrations';
import {Icon} from '../../assets/icons';
import {styles} from './styles';
import {useResource} from '../../core/useResource';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

function detail(details: Record<string, string>, key: string) {
  return details[key]?.trim() || '';
}

function formatIssuedDate(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
}

function parseIso(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toCalendarStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function examStatusInfo(examAt?: string) {
  const start = parseIso(examAt);
  if (!start) return null;

  const now = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);

  if (dayDiff > 1) {
    return {
      kind: 'upcoming' as const,
      label: `Exam in ${dayDiff} days · ${start.toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric', month: 'short'})}`,
      color: colors.activeBlue,
    };
  }
  if (dayDiff === 1) {
    return {
      kind: 'upcoming' as const,
      label: 'Exam tomorrow · arrive with this admit card & photo ID',
      color: colors.activeBlue,
    };
  }
  if (dayDiff === 0) {
    return {
      kind: 'today' as const,
      label: 'Exam today · report at the listed reporting time',
      color: colors.orange,
    };
  }
  return {
    kind: 'past' as const,
    label: 'Exam date has passed · keep this card for your records',
    color: '#6D4C41',
  };
}

function candidateInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '·';
}

export function AdmitCardScreen() {
  const navigation = useNavigation();
  const documentId = (useRoute().params as {documentId: string}).documentId;
  const repos = useRepositories();
  const resource = useResource();
  const doc = useQuery({
    queryKey: queryKeys.document(accountKey(), documentId),
    queryFn: () => repos.account.document(documentId),
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: doc.isRefetching,
    onRefresh: () => {
      doc.refetch().catch(() => undefined);
    },
  });
  const data = doc.data;

  const roll = detail(data?.details ?? {}, 'roll');
  const course = detail(data?.details ?? {}, 'course');
  const semester = detail(data?.details ?? {}, 'semester');
  const examDate = detail(data?.details ?? {}, 'examDate');
  const reporting = detail(data?.details ?? {}, 'reporting');
  const period = detail(data?.details ?? {}, 'period');
  const venue = detail(data?.details ?? {}, 'venue');
  const academicYear = detail(data?.details ?? {}, 'academicYear');
  const admitCardId = detail(data?.details ?? {}, 'admitCardId') || roll;
  const examAt = detail(data?.details ?? {}, 'examAt');
  const examEndAt = detail(data?.details ?? {}, 'examEndAt');
  const issuedLabel = formatIssuedDate(data?.issuedAt);
  const status = examStatusInfo(examAt);

  const instructions = useMemo(() => {
    const raw = detail(data?.details ?? {}, 'instructions');
    if (!raw) return [];
    return raw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  }, [data?.details]);

  const headerSubtitle = useMemo(() => {
    const semesterLabel = semester.split(/[·•]/)[0]?.trim() || semester;
    if (semesterLabel && course) return `${semesterLabel} Exam · ${course}`;
    if (course) return course;
    return 'Semester exam · issued by admin';
  }, [course, semester]);

  const rows = useMemo(
    () =>
      [
        {label: 'Candidate Name', value: data?.learnerName, mono: false},
        {label: 'Roll Number', value: roll, mono: true},
        {label: 'Course', value: course, mono: false},
        {label: 'Semester', value: semester, mono: false},
        {label: 'Exam Date', value: examDate, mono: false},
        {label: 'Reporting Time', value: reporting, mono: false},
        {label: 'Exam Timing', value: period, mono: false},
        {label: 'Venue', value: venue, mono: false},
      ].filter(row => Boolean(row.value)),
    [course, data?.learnerName, examDate, period, reporting, roll, semester, venue],
  );

  const onOpenPdf = useCallback(() => {
    if (!data?.resourceId) return;
    (navigation.navigate as (screen: string, params: object) => void)('ProtectedViewer', {resourceId: data.resourceId, title: data.title, mimeType: 'application/pdf', kind: 'pdf'});
  }, [data, navigation]);

  const onDownloadPdf = useCallback(() => {
    if (!data?.resourceId) return;
    resource.open({resourceId: data.resourceId, title: data.title, kind: 'pdf', mimeType: 'application/pdf'}, true);
  }, [data, resource]);

  const onVerify = useCallback(() => {
    if (!data?.verificationToken) {
      Alert.alert('Verification', 'This document does not include a verification token.');
      return;
    }
    void repos.account.verifyDocument(data.verificationToken).then(result => {
      const lines = [
        result.valid ? 'This document is valid.' : result.message || 'This document could not be verified.',
        result.serial ? `Serial: ${result.serial}` : '',
        result.displayName ? `Name: ${result.displayName}` : '',
        result.issuer ? `Issuer: ${result.issuer}` : '',
      ].filter(Boolean);
      Alert.alert(result.valid ? 'Verified' : 'Not verified', lines.join('\n'));
    }).catch(error => {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Verification could not be completed.';
      Alert.alert('Verification', message);
    });
  }, [data?.verificationToken, repos.account]);

  const onAddToCalendar = useCallback(() => {
    const start = parseIso(examAt);
    if (!start) {
      Alert.alert('Exam schedule', examDate ? `Exam date: ${examDate}` : 'Exam schedule is not available on this card.');
      return;
    }
    const end = parseIso(examEndAt) ?? new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const title = encodeURIComponent(`${course || 'RACI Exam'} · Admit Card`);
    const details = encodeURIComponent(
      [
        data?.learnerName ? `Candidate: ${data.learnerName}` : null,
        roll ? `Roll: ${roll}` : null,
        reporting ? `Reporting: ${reporting}` : null,
        venue ? `Venue: ${venue}` : null,
        admitCardId ? `ID: ${admitCardId}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    );
    const location = encodeURIComponent(venue || brand.institute);
    const dates = `${toCalendarStamp(start)}/${toCalendarStamp(end)}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;

    Alert.alert('Add to calendar', 'Open Google Calendar with this exam pre-filled?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Open',
        onPress: () => {
          void Linking.openURL(url).catch(() => {
            Alert.alert('Could not open calendar', 'Refer to the exam details on this card.');
          });
        },
      },
    ]);
  }, [admitCardId, course, data?.learnerName, examAt, examDate, examEndAt, reporting, roll, venue]);

  if (doc.isLoading) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }

  if (doc.isError || data?.status !== 'issued' || data.kind !== 'admit_card') {
    return (
      <Screen padded={false}>
        <DetailHeader title="Admit Card" onBack={() => navigation.goBack()} />
        <ErrorState message="This admit card is unavailable or has been revoked." onRetry={() => void doc.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Admit Card"
        subtitle={headerSubtitle}
        onBack={() => navigation.goBack()}
        onCalendar={examAt || examDate ? onAddToCalendar : undefined}
      />
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open admit card verification"
          onPress={onVerify}
          style={({pressed}) => [styles.issuedBanner, pressed && {opacity: 0.9}]}>
          <Icon name="verify" size={18} color={colors.success} />
          <AppText weight="800" size={10.5} color={colors.success} style={styles.issuedText}>
            Issued by RACI Admin Panel · {issuedLabel}
            {admitCardId ? ` · ID ${admitCardId}` : ''}
          </AppText>
        </Pressable>

        {status ? (
          <View
            style={[
              styles.examStatus,
              status.kind === 'today'
                ? styles.examStatusToday
                : status.kind === 'past'
                  ? styles.examStatusPast
                  : styles.examStatusUpcoming,
            ]}>
            <Icon name={status.kind === 'past' ? 'check' : 'clock'} size={16} color={status.color} />
            <AppText weight="800" size={10.5} color={status.color} style={styles.examStatusText}>
              {status.label}
            </AppText>
          </View>
        ) : null}

        <View style={styles.admitCard}>
          {data.verified ? (
            <View pointerEvents="none" style={styles.admitStamp}>
              <AppText face="mono" weight="800" size={7.5} color={colors.success} style={styles.admitStampText}>
                ISSUED BY ADMIN · VERIFIED
              </AppText>
            </View>
          ) : null}

          <View style={styles.admitHead}>
            <RediLogo size={40} />
            <View style={styles.admitHeadText}>
              <AppText weight="900" size={11.5} color={colors.navy} style={styles.admitHeadTitle}>
                {brand.institute.toUpperCase()}
              </AppText>
              <AppText face="mono" weight="700" size={6.5} color={colors.text2} style={styles.admitHeadSub}>
                SEMESTER EXAM ADMIT CARD{academicYear ? ` · ${academicYear}` : ''}
              </AppText>
            </View>
          </View>

          <View style={styles.admitBody}>
            <Gradient colors={gradients.avatar} start={{x: 0.15, y: 0}} end={{x: 0.9, y: 1}} style={styles.admitPhoto}>
              <AppText weight="900" size={26} color={colors.white}>
                {candidateInitial(data.learnerName)}
              </AppText>
              <AppText weight="600" size={6.5} style={styles.admitPhotoLabel}>
                CANDIDATE
              </AppText>
            </Gradient>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan QR to verify admit card"
              onPress={onVerify}
              style={({pressed}) => [styles.admitQr, pressed && {opacity: 0.85}]}>
              <Icon name="qr" size={44} color={colors.navy} />
              <AppText face="mono" weight="600" size={6} color={colors.text3} style={styles.admitQrLabel}>
                SCAN TO VERIFY
              </AppText>
            </Pressable>
          </View>

          <View style={styles.admitRows}>
            {rows.map((row, index) => (
              <Pressable
                key={row.label}
                disabled={row.label !== 'Roll Number'}
                accessibilityRole={row.label === 'Roll Number' ? 'button' : undefined}
                style={[styles.admitRow, index === rows.length - 1 && styles.admitRowLast]}>
                <AppText weight="600" size={10} color={colors.text2}>
                  {row.label}
                </AppText>
                <AppText
                  face={row.mono ? 'mono' : undefined}
                  weight="700"
                  size={row.mono ? 9 : 10}
                  color={colors.ink}
                  style={[styles.admitRowValue, row.mono && styles.admitRowMono]}>
                  {row.value}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {instructions.length ? <ClayCard variant="white" style={styles.instructionsCard}>
          <AppText weight="800" size={16.5} color={colors.navy}>
            Instructions
          </AppText>
          <View style={styles.instructionList}>
            {instructions.map(line => (
              <View key={line} style={styles.instructionRow}>
                <Icon name="flag" size={12} color={colors.orange} style={styles.instructionIcon} />
                <AppText weight="600" size={10} color={colors.text2} style={styles.instructionText}>
                  {line}
                </AppText>
              </View>
            ))}
          </View>
        </ClayCard> : null}

        {resource.error ? (
          <AppText accessibilityRole="alert" color={colors.error} size={12}>
            {resource.error}
          </AppText>
        ) : null}

        <ClayButton
          label={resource.busy ? 'Working…' : 'Save protected PDF'}
          icon="download"
          compact
          disabled={resource.busy || !data.resourceId}
          onPress={onDownloadPdf}
        />

        <ClayButton
          label={resource.busy ? 'Working…' : 'Open official PDF'}
          tone="ghost"
          compact
          disabled={resource.busy || !data.resourceId}
          onPress={onOpenPdf}
        />

        <AppText size={10} color={colors.text2}>
          This issued document can only be opened inside RACI. Sharing, exporting and printing are disabled.
        </AppText>

        {(examAt || examDate) && (
          <View style={styles.actionHint}>
            <Icon name="cal" size={14} color={colors.activeBlue} />
            <AppText size={10} color={colors.text2} style={styles.actionHintText}>
              Use the calendar icon in the header to add this exam to Google Calendar.
            </AppText>
          </View>
        )}

        <ClayCard variant="white" style={styles.verifyCard} onPress={onVerify}>
          <View style={styles.verifyRow}>
            <Icon name="shield" size={18} color="#1565C0" />
            <AppText size={10} color={colors.text2} style={styles.verifyText}>
              {data.verificationUrl
                ? `Tap to verify this admit card online · ID ${admitCardId || 'on record'}.`
                : `Issued by RACI Admin Panel · admit card ID ${admitCardId || 'on record'} is verified only from the issued record.`}
            </AppText>
          </View>
        </ClayCard>
      </ScrollView>
    </Screen>
  );
}
