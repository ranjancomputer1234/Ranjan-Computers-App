import {useEffect, useMemo, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import {accountKey} from '../../../core/session';
import {getAccountScoped, setAccountScoped} from '../../../core/storage';
import {useAsyncAction} from '../../../core/useAsyncAction';
import type {Lesson, LiveClass, Project, Semester, TestDefinition} from '../../../core/types';
import type {RootNav} from '../../../navigation/types';

export type WaitRowState = 'ok' | 'pend' | 'todo' | 'fail';
export type WaitHeroTone = 'amber' | 'green' | 'red' | 'blue';

export type WaitChecklistItem = {
  id: 'lessons' | 'test' | 'project' | 'review';
  state: WaitRowState;
  title: string;
  detail: string;
  value?: string;
  chip?: string;
};

export type SemesterDetail = Semester & {
  lessons: Lesson[];
  tests: TestDefinition[];
  projects: Project[];
};

const PASS_PERCENT = 70;

export function gradeFromPercent(percent?: number) {
  if (percent == null || !Number.isFinite(percent)) return undefined;
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const IST = 'Asia/Kolkata';

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function istParts(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  const monthNum = Number(read('month'));
  return {
    day: Number(read('day')),
    month: MONTHS[monthNum - 1],
    year: read('year'),
    hour: Number(read('hour')),
    minute: Number(read('minute')),
  };
}

export function formatDay(iso?: string) {
  if (!iso) return undefined;
  const parts = istParts(iso);
  if (!parts) return iso;
  return `${parts.day} ${parts.month} ${parts.year}`;
}

export function formatSubmittedAt(iso?: string) {
  if (!iso) return undefined;
  const parts = istParts(iso);
  if (!parts) return iso;
  return `${parts.day} ${parts.month} ${parts.year} · ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function formatEstimate(iso?: string) {
  return formatDay(iso);
}

export function currentChecklistStep(items: WaitChecklistItem[]) {
  const index = items.findIndex(item => item.state !== 'ok');
  return index < 0 ? items.length : index + 1;
}

export function pickWaitLiveClass(classes: LiveClass[], courseTitle?: string) {
  if (!classes.length) return undefined;
  const hay = (courseTitle ?? '').toLowerCase();
  const keywords = ['tally', 'gst', 'accounting', 'tax'].filter(word => hay.includes(word));
  const ranked = [...classes].sort((a, b) => {
    const score = (item: LiveClass) => {
      const title = `${item.title} ${item.batch ?? ''}`.toLowerCase();
      const keywordHit = keywords.some(word => title.includes(word)) ? 8 : 0;
      const live = ['live', 'starting', 'reconnecting'].includes(item.status) ? 4 : 0;
      const soon = item.status === 'scheduled' ? 2 : 0;
      const ended = item.status === 'ended' && item.recordingAvailable ? 1 : 0;
      return keywordHit + live + soon + ended;
    };
    return score(b) - score(a);
  });
  return ranked[0];
}

export function liveClassLine(item?: LiveClass) {
  if (!item) return 'Daily batches · keep learning while you wait';
  const time = new Intl.DateTimeFormat('en-IN', {hour: 'numeric', minute: '2-digit', hour12: true}).format(new Date(item.startsAt));
  const bits = [item.instructorName, item.batch, time].filter(Boolean);
  return bits.join(' · ');
}

export function buildChecklist(semester?: SemesterDetail): WaitChecklistItem[] {
  if (!semester) return [];
  const totalLessons = Math.max(semester.lessonCount, semester.lessons.length, 0);
  const completedLessons =
    semester.completedLessons ?? semester.lessons.filter(lesson => lesson.state === 'completed').length;
  const lessonsDone =
    totalLessons > 0
      ? completedLessons >= totalLessons
      : semester.status !== 'available' && semester.status !== 'in_progress';
  const score = semester.testScorePercent;
  const grade = semester.testGrade ?? gradeFromPercent(score);
  const testDone =
    score != null
      ? score >= PASS_PERCENT
      : ['requirements_complete', 'pending_review', 'approved', 'course_complete'].includes(semester.status);
  const project = semester.projects[0];
  const projectDone = !semester.projectCount || project?.status === 'accepted';
  const projectPending = project?.status === 'submitted';
  const reviewDone = semester.status === 'approved' || semester.status === 'course_complete';
  const reviewFail = semester.status === 'changes_required';
  const reviewPend = semester.status === 'pending_review';

  const items: WaitChecklistItem[] = [
    {
      id: 'lessons',
      state: lessonsDone ? 'ok' : 'todo',
      title: 'Lessons completed',
      detail: lessonsDone
        ? `All ${totalLessons} lessons watched`
        : `${completedLessons} of ${totalLessons} lessons watched`,
      value: totalLessons ? `${Math.min(completedLessons, totalLessons)}/${totalLessons}` : undefined,
    },
    {
      id: 'test',
      state: testDone ? 'ok' : score != null && score < PASS_PERCENT ? 'fail' : 'todo',
      title: testDone ? 'Semester test passed' : score != null ? 'Semester test below pass mark' : 'Semester test',
      detail:
        score != null
          ? `Score ${Math.round(score)}%${grade ? ` · Grade ${grade}` : ''}`
          : testDone
            ? 'Institute recorded a passing score'
            : 'Clear the semester test to submit for review',
      value: score != null ? `${Math.round(score)}%` : undefined,
    },
  ];

  if (semester.projectCount) {
    items.push({
      id: 'project',
      state: projectDone ? 'ok' : projectPending ? 'pend' : project?.status === 'changes_required' ? 'fail' : 'todo',
      title: project?.title ?? 'Project work',
      detail:
        project?.status === 'accepted'
          ? 'Accepted by the institute'
          : project?.status === 'submitted'
            ? 'Waiting for institute review'
            : project?.feedback ?? 'Upload the required project to continue',
      chip: projectPending ? 'PENDING' : project?.status === 'changes_required' ? 'CHANGES' : undefined,
      value: projectDone ? 'Done' : undefined,
    });
  }

  const submitted = formatSubmittedAt(semester.submittedAt);
  items.push({
    id: 'review',
    state: reviewDone ? 'ok' : reviewFail ? 'fail' : reviewPend ? 'pend' : 'todo',
    title: reviewDone ? 'Admin verification' : reviewFail ? 'Changes requested' : 'Admin verification',
    detail: reviewFail
      ? semester.reviewFeedback ?? 'The institute asked for a few corrections before approval.'
      : reviewDone
        ? 'Verified — the next semester can unlock'
        : reviewPend
          ? submitted
            ? `Submitted ${submitted}`
            : 'Your work is with RACI admin'
          : 'Submit after lessons and tests are complete',
    chip: reviewPend ? 'PENDING' : reviewFail ? 'CHANGES' : reviewDone ? 'VERIFIED' : undefined,
  });

  return items;
}

export function waitHero(
  semester?: Semester,
  items: WaitChecklistItem[] = [],
): {title: string; subtitle: string; tone: WaitHeroTone; icon: 'hourglass' | 'check' | 'verify' | 'edit'} {
  const n = semester?.index ?? 1;
  const lessons = items.find(item => item.id === 'lessons');
  const test = items.find(item => item.id === 'test');
  const score = semester?.testScorePercent;
  const lessonBit = lessons?.state === 'ok' ? 'All lessons done' : lessons?.detail ?? 'Finish required lessons';
  const testBit =
    test?.state === 'ok' && score != null
      ? `semester test cleared with ${Math.round(score)}%`
      : test?.state === 'ok'
        ? 'semester test cleared'
        : 'semester test pending';

  switch (semester?.status) {
    case 'approved':
      return {
        title: `Semester ${n} approved`,
        subtitle: 'Your institute has verified this semester. The next one can unlock now.',
        tone: 'green',
        icon: 'check',
      };
    case 'course_complete':
      return {
        title: 'Certification complete',
        subtitle: 'Every semester is verified. Open your course to download certificates.',
        tone: 'green',
        icon: 'check',
      };
    case 'changes_required':
      return {
        title: 'Changes requested',
        subtitle: semester.reviewFeedback ?? 'The institute asked you to update your work before approval.',
        tone: 'red',
        icon: 'edit',
      };
    case 'requirements_complete':
      return {
        title: 'Ready for institute review',
        subtitle: `${lessonBit} · ${testBit}`,
        tone: 'amber',
        icon: 'verify',
      };
    case 'pending_review':
      return {
        title: `Semester ${n} Completed!`,
        subtitle: `${lessonBit} · ${testBit}`,
        tone: 'amber',
        icon: 'hourglass',
      };
    default:
      return {
        title: `Semester ${n} in progress`,
        subtitle: `${lessonBit} · ${testBit}`,
        tone: 'blue',
        icon: 'hourglass',
      };
  }
}

export function nextSemesterMeta(next?: Semester) {
  if (!next) return undefined;
  const parts = [
    `${next.lessonCount} lessons`,
    `${next.testCount} test${next.testCount === 1 ? '' : 's'}`,
  ];
  if (next.projectCount) parts.push(`${next.projectCount} project${next.projectCount === 1 ? '' : 's'}`);
  const estimate = formatEstimate(next.estimatedUnlockAt);
  if (estimate) parts.push(`est. start ${estimate}`);
  return parts.join(' · ');
}

export function notifyPrefKey(enrollmentId: string, semesterId: string) {
  return `unlockNotify.${enrollmentId}.${semesterId}`;
}

export function useSemesterWait() {
  const navigation = useNavigation<RootNav>();
  const {enrollmentId, semesterId} = useRoute().params as {enrollmentId: string; semesterId: string};
  const repos = useRepositories();
  const client = useQueryClient();
  const owner = accountKey();
  const semesterKey = queryKeys.semester(owner, enrollmentId, semesterId);
  const listKey = queryKeys.semesters(owner, enrollmentId);

  const detail = useQuery({
    queryKey: semesterKey,
    queryFn: () => repos.learning.semester(enrollmentId, semesterId),
    staleTime: 0,
    refetchInterval: query => (query.state.data?.status === 'pending_review' ? 30_000 : false),
  });
  const list = useQuery({
    queryKey: listKey,
    queryFn: () => repos.learning.semesters(enrollmentId),
  });
  const enrollments = useQuery({
    queryKey: queryKeys.enrollments(owner),
    queryFn: () => repos.learning.enrollments(),
  });
  const enrollment = enrollments.data?.find(item => item.id === enrollmentId);
  const course = useQuery({
    queryKey: queryKeys.course(enrollment?.courseId ?? ''),
    queryFn: () => repos.catalog.course(enrollment!.courseId),
    enabled: Boolean(enrollment?.courseId),
  });
  const home = useQuery({
    queryKey: queryKeys.home(owner),
    queryFn: () => repos.catalog.home(),
  });
  const live = useQuery({
    queryKey: queryKeys.live({wait: true}),
    queryFn: () =>
      repos.live.schedule(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ),
  });

  const semester = detail.data;
  const nextSemester = useMemo(() => {
    if (!list.data || !semester) return undefined;
    return list.data.find(item => item.index === semester.index + 1) ?? list.data.find(item => item.status === 'locked');
  }, [list.data, semester]);

  const checklist = useMemo(() => buildChecklist(semester), [semester]);
  const hero = useMemo(() => waitHero(semester, checklist), [semester, checklist]);
  const step = currentChecklistStep(checklist);
  const liveClass = useMemo(
    () => pickWaitLiveClass(live.data ?? home.data?.liveClasses ?? [], course.data?.title),
    [live.data, home.data?.liveClasses, course.data?.title],
  );

  const notifyTargetId = nextSemester?.id ?? semesterId;
  const [notify, setNotifyState] = useState(true);
  useEffect(() => {
    let mounted = true;
    void getAccountScoped(owner, notifyPrefKey(enrollmentId, notifyTargetId), true).then(value => {
      if (mounted) setNotifyState(Boolean(value));
    });
    return () => {
      mounted = false;
    };
  }, [owner, enrollmentId, notifyTargetId]);

  const setNotify = async (next: boolean) => {
    setNotifyState(next);
    await setAccountScoped(owner, notifyPrefKey(enrollmentId, notifyTargetId), next);
  };

  const review = useAsyncAction(async () => {
    await repos.learning.submitReview(enrollmentId, semesterId);
    await Promise.all([
      client.invalidateQueries({queryKey: semesterKey}),
      client.invalidateQueries({queryKey: listKey}),
      client.invalidateQueries({queryKey: ['learner', owner]}),
    ]);
  });

  const refresh = async () => {
    await Promise.all([detail.refetch(), list.refetch(), live.refetch(), home.refetch()]);
  };

  const openNotifications = () =>
    navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'Notifications'}});
  const openCourse = () =>
    navigation.navigate('Main', {
      screen: 'LearningTab',
      params: {screen: 'SemesterOutline', params: {enrollmentId}},
    });
  const openContent = (id = semesterId) =>
    navigation.navigate('Main', {
      screen: 'LearningTab',
      params: {screen: 'SemesterContent', params: {enrollmentId, semesterId: id}},
    });
  const openTest = () => {
    const testId = semester?.tests[0]?.id;
    if (!testId) return openContent();
    navigation.navigate('Main', {
      screen: 'LearningTab',
      params: {screen: 'TestInstructions', params: {testId}},
    });
  };
  const openProject = () => {
    const projectId = semester?.projects[0]?.id;
    if (!projectId) return openContent();
    navigation.navigate('Main', {
      screen: 'LearningTab',
      params: {screen: 'ProjectDetail', params: {projectId}},
    });
  };
  const openLive = () => {
    if (liveClass && ['live', 'starting', 'reconnecting'].includes(liveClass.status)) {
      navigation.navigate('Main', {screen: 'LiveTab', params: {screen: 'LiveRoom', params: {liveClassId: liveClass.id}}});
      return;
    }
    navigation.navigate('Main', {screen: 'LiveTab', params: {screen: 'LiveSchedule'}});
  };
  const openNext = () => {
    if (!nextSemester || nextSemester.status === 'locked') return;
    if (nextSemester.status === 'pending_review' || nextSemester.status === 'requirements_complete') {
      navigation.replace('SemesterWait', {enrollmentId, semesterId: nextSemester.id});
      return;
    }
    openContent(nextSemester.id);
  };

  const status = semester?.status;
  return {
    navigation,
    enrollmentId,
    semesterId,
    detail,
    semester,
    nextSemester,
    courseTitle: course.data?.title,
    unread: (home.data?.unreadNotifications ?? 0) > 0,
    checklist,
    hero,
    step,
    stepTotal: checklist.length,
    liveClass,
    liveLine: liveClassLine(liveClass),
    notify,
    setNotify,
    review,
    refresh,
    refreshing: detail.isFetching && !detail.isLoading,
    lastChecked: detail.dataUpdatedAt ? formatSubmittedAt(new Date(detail.dataUpdatedAt).toISOString()) : undefined,
    ready: status === 'requirements_complete',
    pending: status === 'pending_review',
    approved: status === 'approved' || status === 'course_complete',
    changes: status === 'changes_required',
    nextUnlocked: Boolean(nextSemester && nextSemester.status !== 'locked'),
    nextMeta: nextSemesterMeta(nextSemester),
    openNotifications,
    openCourse,
    openContent,
    openTest,
    openProject,
    openLive,
    openNext,
  };
}
