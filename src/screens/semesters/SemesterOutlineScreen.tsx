import React from 'react';
import {Alert, Pressable, ScrollView, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {colors, gradients} from '../../theme';
import {AppText, ClayButton, EmptyState, ErrorState, LoadingBlock, ProgressBar} from '../../components/ui';
import {DetailHeader, Screen, StickyActionFooter} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {Icon, type IconName} from '../../assets/icons';
import type {Semester} from '../../core/types';
import {useSemesterOutline} from '../../features/semesters/hooks/useSemesterOutline';
import {formatDay} from '../../features/semesters/hooks/useSemesterWait';
import {styles} from './styles';

type ChipTone = 'now' | 'pend' | 'ok' | 'fail' | 'lock';

const STATUS_VIEW: Record<Semester['status'], {chip: string; tone: ChipTone}> = {
  in_progress: {chip: 'IN PROGRESS', tone: 'now'},
  available: {chip: 'AVAILABLE', tone: 'now'},
  requirements_complete: {chip: 'READY', tone: 'pend'},
  pending_review: {chip: 'IN REVIEW', tone: 'pend'},
  changes_required: {chip: 'CHANGES', tone: 'fail'},
  approved: {chip: 'DONE', tone: 'ok'},
  course_complete: {chip: 'DONE', tone: 'ok'},
  locked: {chip: 'LOCKED', tone: 'lock'},
};

const PROGRESS_STATUSES: Semester['status'][] = ['available', 'in_progress', 'approved', 'course_complete'];

function semesterMeta(item: Semester) {
  const parts = [`${item.lessonCount} lessons`, `${item.testCount} test${item.testCount === 1 ? '' : 's'}`];
  if (item.projectCount) parts.push(`${item.projectCount} project${item.projectCount === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

function semesterPercent(item: Semester) {
  if (item.progressPercent != null) return item.progressPercent;
  if (!item.lessonCount) return 0;
  return Math.round(((item.completedLessons ?? 0) / item.lessonCount) * 100);
}

export function SemesterOutlineScreen() {
  const outline = useSemesterOutline();
  const pullRefresh = usePullRefreshFeedback({
    refreshing: outline.refreshing,
    onRefresh: outline.refresh,
  });
  const course = outline.course;
  const courseTitle = course?.title ?? 'My Course';
  const percent = outline.enrollment?.progress.percent ?? 0;
  const doneLessons = outline.enrollment?.progress.completedLessons ?? 0;
  const totalLessons = outline.enrollment?.progress.totalLessons ?? course?.lessonCount ?? 0;
  const continueIcon: IconName =
    outline.current && ['pending_review', 'requirements_complete'].includes(outline.current.status) ? 'hourglass' : 'play';

  const explainUnlockRules = () =>
    Alert.alert(
      'Sequential unlock',
      'Semesters unlock strictly one by one. Finish all lessons and the semester test, then RACI admin verifies your work within 24–48 hrs and opens the next semester. No skipping ahead.',
    );

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title={courseTitle}
        subtitle={`My Course${outline.purchasedLabel ? ` · purchased ${outline.purchasedLabel}` : ''}`}
        onBack={() => outline.navigation.goBack()}
        onShare={() => void outline.shareCourse()}
        right={<PurchasedChip />}
      />
      {outline.list.isLoading ? <LoadingBlock /> : null}
      {outline.list.isError ? (
        <ErrorState message="Your semesters could not be loaded." onRetry={() => void outline.refresh()} />
      ) : null}
      {outline.list.data ? (
        <ScrollView
          {...pullRefresh.scrollProps}
          contentContainerStyle={styles.pageOutline}
          showsVerticalScrollIndicator={false}>
          {/* Course identity */}
          <View style={styles.identityCard}>
            <View style={styles.bigTile}>
              <AppText weight="900" size={20} color={course?.iconColor ?? colors.deepBlue}>
                {(course?.letter ?? courseTitle.charAt(0) ?? 'R').toUpperCase()}
              </AppText>
            </View>
            <View style={styles.identityBody}>
              <View style={styles.badgeRow}>
                {outline.semesters.length ? <Badge label={`${outline.semesters.length} SEMESTERS`} palette={gradients.freeBadge} /> : null}
                <Badge label="CERTIFICATION COURSE" palette={gradients.paidBadge} />
              </View>
              <View style={styles.metaRow}>
                {outline.learnerLabel ? (
                  <View style={styles.hmeta}>
                    <Icon name="users" size={12} color="#1565C0" />
                    <AppText weight="600" size={10.5} color={colors.text2}>
                      {outline.learnerLabel}
                    </AppText>
                  </View>
                ) : null}
                {outline.ratingLabel ? (
                  <View style={styles.hmeta}>
                    <Icon name="star" size={12} color="#F9A825" />
                    <AppText weight="600" size={10.5} color={colors.text2}>
                      {outline.ratingLabel}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Overall progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHead}>
              <AppText weight="800" size={12} color={colors.navy}>
                Overall Progress
              </AppText>
              <AppText weight="900" size={15} color={colors.primary}>
                {percent}%
              </AppText>
            </View>
            <View style={styles.pwrap}>
              <ProgressBar percent={percent} />
              <AppText weight="800" size={9} color={colors.text2}>
                {doneLessons}/{totalLessons}
              </AppText>
            </View>
            {outline.statusCaption ? (
              <AppText weight="500" size={9} color={colors.text2} style={styles.progressCaption}>
                {outline.statusCaption}
              </AppText>
            ) : null}
          </View>

          {/* Section header */}
          <View style={styles.shead}>
            <AppText weight="800" size={16.5} color={colors.navy} style={styles.sheadTitle}>
              Semester Structure
            </AppText>
            <Pressable onPress={explainUnlockRules} hitSlop={6} accessibilityRole="button" accessibilityLabel="How semesters unlock">
              <AppText weight="700" size={11.5} color={colors.primary}>
                Sequential unlock
              </AppText>
            </Pressable>
          </View>

          {/* Semester cards */}
          {outline.semesters.length ? (
            <View style={styles.semList}>
              {outline.semesters.map(item => (
                <SemesterCard
                  key={item.id}
                  item={item}
                  isLast={item.id === outline.lastSemesterId}
                  onPress={
                    item.status === 'locked'
                      ? () =>
                          Alert.alert(
                            `Semester ${item.index} locked`,
                            item.unlockReason ?? 'Finish the previous semester and its verification to unlock this one.',
                          )
                      : () => outline.openSemester(item)
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState title="No semesters yet" body="This certification track has not published its semester plan yet." />
          )}

          {/* Certificate shortcut once everything is verified */}
          {outline.courseComplete ? (
            <Pressable
              accessibilityRole="button"
              onPress={outline.openCertificate}
              style={({pressed}) => [styles.waitStrip, styles.waitStripGreen, pressed && styles.pressed]}>
              <Icon name="award" size={18} color="#2E7D32" />
              <AppText weight="800" size={11} color="#2E7D32" style={styles.waitStripText}>
                Course complete — view &amp; download your certificate
              </AppText>
            </Pressable>
          ) : null}

          {/* Sequential unlock explainer */}
          <View style={styles.shieldCard}>
            <Icon name="shield" size={18} color="#1565C0" />
            <AppText weight="500" size={10} color={colors.text2} style={styles.shieldText}>
              Semesters unlock strictly one by one — finish all lessons &amp; the semester test, then RACI admin verifies and
              opens the next semester. No skipping ahead.
            </AppText>
          </View>
        </ScrollView>
      ) : null}
      <StickyActionFooter>
        {outline.courseComplete ? (
          <ClayButton label="View certificate" icon="award" tone="success" onPress={outline.openCertificate} />
        ) : (
          <ClayButton
            label={outline.current ? `Continue Semester ${outline.current.index}` : 'Continue semester'}
            icon={continueIcon}
            disabled={!outline.canContinue}
            onPress={outline.continueSemester}
          />
        )}
      </StickyActionFooter>
    </Screen>
  );
}

function PurchasedChip() {
  return (
    <View style={styles.purchasedChip} accessibilityLabel="Purchased course">
      <Icon name="check" size={13} color="#2E7D32" />
      <AppText weight="600" size={10} color="#2E7D32">
        Purchased
      </AppText>
    </View>
  );
}

function Badge({label, palette}: {label: string; palette: readonly string[]}) {
  return (
    <Gradient colors={palette} style={styles.badge}>
      <AppText weight="800" size={8.5} color="#fff" style={styles.badgeText}>
        {label}
      </AppText>
    </Gradient>
  );
}

function StatChip({label, tone}: {label: string; tone: ChipTone}) {
  const color = tone === 'ok' ? '#2E7D32' : tone === 'fail' ? '#C62828' : tone === 'lock' ? '#90A4AE' : tone === 'now' ? '#1565C0' : '#E65100';
  const bg = tone === 'ok' ? styles.chipOk : tone === 'fail' ? styles.chipFail : tone === 'lock' ? styles.chipLock : tone === 'now' ? styles.chipNow : styles.chipPend;
  return (
    <View style={[styles.chip, bg]}>
      <AppText weight="800" size={7.5} color={color} style={styles.chipText}>
        {label}
      </AppText>
    </View>
  );
}

function SemesterTile({item, isLast}: {item: Semester; isLast: boolean}) {
  switch (item.status) {
    case 'locked':
      return (
        <View style={[styles.semNum, styles.semNumLock]}>
          <Icon name={isLast ? 'award' : 'lock'} size={19} color="#90A4AE" />
        </View>
      );
    case 'approved':
    case 'course_complete':
      return (
        <View style={[styles.semNum, styles.semNumReady]}>
          <Icon name="check" size={19} color="#2E7D32" />
        </View>
      );
    case 'pending_review':
    case 'requirements_complete':
      return (
        <View style={[styles.semNum, styles.semNumPend]}>
          <Icon name="hourglass" size={19} color="#E65100" />
        </View>
      );
    case 'changes_required':
      return (
        <View style={[styles.semNum, styles.semNumFail]}>
          <Icon name="edit" size={19} color="#C62828" />
        </View>
      );
    default:
      return (
        <View style={[styles.semNum, styles.semNumNow]}>
          <AppText weight="900" size={16} color="#1565C0">
            {String(item.index).padStart(2, '0')}
          </AppText>
          <AppText weight="800" size={6.5} color="#1565C0" style={styles.semNumLabel}>
            SEM
          </AppText>
        </View>
      );
  }
}

function SemesterStatusRow({item}: {item: Semester}) {
  switch (item.status) {
    case 'pending_review':
    case 'requirements_complete':
      return (
        <View style={styles.unlockRow}>
          <Icon name="hourglass" size={11} color="#E65100" />
          <AppText weight="600" size={8.5} color="#E65100" style={styles.unlockRowText}>
            {item.submittedAt ? `Submitted ${formatDay(item.submittedAt)} · ` : ''}waiting for admin verification
          </AppText>
        </View>
      );
    case 'changes_required':
      return (
        <View style={styles.unlockRow}>
          <Icon name="edit" size={11} color="#C62828" />
          <AppText weight="600" size={8.5} color="#C62828" style={styles.unlockRowText}>
            {item.reviewFeedback ?? 'The institute requested a few changes — tap to review'}
          </AppText>
        </View>
      );
    case 'approved':
    case 'course_complete':
      return item.testScorePercent != null ? (
        <View style={styles.unlockRow}>
          <Icon name="check" size={11} color="#2E7D32" />
          <AppText weight="600" size={8.5} color="#2E7D32" style={styles.unlockRowText}>
            Semester test {Math.round(item.testScorePercent)}%{item.testGrade ? ` · Grade ${item.testGrade}` : ''} · verified
          </AppText>
        </View>
      ) : null;
    default:
      return null;
  }
}

function SemesterCard({item, isLast, onPress}: {item: Semester; isLast: boolean; onPress: () => void}) {
  const view = STATUS_VIEW[item.status];
  const locked = item.status === 'locked';
  const showProgress = PROGRESS_STATUSES.includes(item.status);
  const percent = semesterPercent(item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Semester ${item.index}: ${item.title}. ${view.chip}`}
      onPress={onPress}
      style={({pressed}) => [styles.semCard, pressed && styles.pressed]}>
      <SemesterTile item={item} isLast={isLast} />
      <View style={styles.semBody}>
        <View style={styles.semTitleRow}>
          <AppText weight="800" size={12.5} color={locked ? '#78909C' : colors.navy} numberOfLines={1} style={styles.semTitle}>
            {item.title}
          </AppText>
          <StatChip label={view.chip} tone={view.tone} />
        </View>
        {showProgress ? (
          <View style={styles.pwrap}>
            <ProgressBar percent={percent} />
            <AppText weight="800" size={9} color={colors.text2}>
              {Math.min(item.completedLessons ?? 0, item.lessonCount)}/{item.lessonCount}
            </AppText>
          </View>
        ) : null}
        <AppText weight="500" size={9} color={colors.text2}>
          {semesterMeta(item)}
        </AppText>
        {locked ? (
          <View style={styles.unlockRow}>
            <Icon name={isLast ? 'verify' : 'clock'} size={11} color="#90A4AE" />
            <AppText weight="600" size={8.5} color="#90A4AE" style={styles.unlockRowText}>
              {isLast ? 'Certificate issued by admin after completion' : item.unlockReason ?? 'Complete the previous semester to unlock'}
            </AppText>
          </View>
        ) : (
          <SemesterStatusRow item={item} />
        )}
      </View>
    </Pressable>
  );
}
