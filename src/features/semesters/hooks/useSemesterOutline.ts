import {useMemo, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import {accountKey} from '../../../core/session';
import {shareService} from '../../../core/services';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {LearningStackParamList} from '../../../navigation/types';
import {formatDay} from './useSemesterWait';

const ACTIVE_STATUSES = ['available', 'in_progress', 'changes_required', 'pending_review', 'requirements_complete'];
const DONE_STATUSES = ['approved', 'course_complete'];
const ESTIMATE_CAP_DAYS = 730;

function formatLearnerCount(count?: number) {
  if (count == null || !Number.isFinite(count)) return undefined;
  return `${new Intl.NumberFormat('en-IN').format(count)} learners`;
}

function formatRating(rating?: number) {
  if (rating == null || !Number.isFinite(rating)) return undefined;
  return rating.toFixed(1);
}

/** Pace-based estimate: elapsed time since purchase scaled to 100% at the current rate. */
function estimateCompletion(purchasedAt?: string, percent?: number) {
  if (!purchasedAt || percent == null || percent <= 0 || percent >= 100) return undefined;
  const start = new Date(purchasedAt).getTime();
  if (!Number.isFinite(start)) return undefined;
  const elapsed = Date.now() - start;
  if (elapsed <= 0) return undefined;
  const projected = elapsed / (percent / 100);
  const capped = Math.min(projected, ESTIMATE_CAP_DAYS * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-GB', {month: 'short', year: 'numeric'}).format(new Date(start + capped));
}

export function useSemesterOutline() {
  const navigation = useNavigation<NativeStackNavigationProp<LearningStackParamList>>();
  const enrollmentId = (useRoute().params as {enrollmentId: string}).enrollmentId;
  const repos = useRepositories();
  const owner = accountKey();

  const enrollments = useQuery({queryKey: queryKeys.enrollments(owner), queryFn: () => repos.learning.enrollments()});
  const enrollment = enrollments.data?.find(item => item.id === enrollmentId);
  const course = useQuery({
    queryKey: queryKeys.course(enrollment?.courseId ?? ''),
    queryFn: () => repos.catalog.course(enrollment!.courseId),
    enabled: Boolean(enrollment),
  });
  const list = useQuery({queryKey: queryKeys.semesters(owner, enrollmentId), queryFn: () => repos.learning.semesters(enrollmentId)});

  const semesters = useMemo(() => list.data ?? [], [list.data]);
  const current = useMemo(() => semesters.find(s => ACTIVE_STATUSES.includes(s.status)), [semesters]);
  const courseComplete = semesters.length > 0 && semesters.every(s => DONE_STATUSES.includes(s.status));
  const lastSemesterId = semesters.length ? semesters[semesters.length - 1].id : undefined;

  const openSemester = (item: {id: string; status: string}) => {
    if (item.status === 'locked') return;
    if (['pending_review', 'requirements_complete', 'changes_required', 'approved', 'course_complete'].includes(item.status)) {
      navigation.getParent()?.getParent()?.navigate('SemesterWait', {enrollmentId, semesterId: item.id});
      return;
    }
    navigation.navigate('SemesterContent', {enrollmentId, semesterId: item.id});
  };

  const continueSemester = () => {
    if (current) openSemester(current);
  };

  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([list.refetch(), enrollments.refetch(), course.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const shareCourse = async () => {
    const title = course.data?.title ?? 'this certification course';
    const percent = enrollment?.progress.percent ?? 0;
    try {
      await shareService.share(`I'm ${percent}% through ${title} at RACI — Ranjan Computer Institute. Come learn with me!`);
    } catch {
      // user dismissed the share sheet
    }
  };

  const openCertificate = () => navigation.navigate('DocumentList', {kind: 'certificate'});

  const purchasedLabel = formatDay(enrollment?.purchasedAt);
  const estimate = estimateCompletion(enrollment?.purchasedAt, enrollment?.progress.percent);

  const statusCaption = useMemo(() => {
    if (!semesters.length) return undefined;
    if (courseComplete) return 'All semesters verified — your certificate is ready';
    if (!current) return undefined;
    const suffix = estimate ? ` · estimated completion ${estimate}` : '';
    switch (current.status) {
      case 'pending_review':
      case 'requirements_complete':
        return `Semester ${current.index} under admin verification${suffix}`;
      case 'changes_required':
        return `Semester ${current.index} needs a few changes${suffix}`;
      default:
        return `Currently in Semester ${current.index}${suffix}`;
    }
  }, [semesters.length, courseComplete, current, estimate]);

  return {
    navigation,
    enrollmentId,
    list,
    enrollment,
    course: course.data,
    semesters,
    current,
    courseComplete,
    lastSemesterId,
    canContinue: Boolean(current),
    openSemester,
    continueSemester,
    refreshing,
    refresh,
    shareCourse,
    openCertificate,
    purchasedLabel,
    statusCaption,
    learnerLabel: formatLearnerCount(course.data?.learnerCount),
    ratingLabel: formatRating(course.data?.rating),
  };
}
