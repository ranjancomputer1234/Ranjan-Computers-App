import {
  buildChecklist,
  currentChecklistStep,
  formatEstimate,
  formatSubmittedAt,
  gradeFromPercent,
  liveClassLine,
  nextSemesterMeta,
  pickWaitLiveClass,
  waitHero,
} from '../src/features/semesters/hooks/useSemesterWait';
import type {Lesson, LiveClass, Semester} from '../src/core/types';

const baseSemester: Semester = {
  id: 'sem-1',
  enrollmentId: 'enr-tally-cert',
  index: 1,
  title: 'Fundamentals of Accounting',
  status: 'pending_review',
  lessonCount: 12,
  testCount: 2,
  projectCount: 0,
  completedLessons: 12,
  testScorePercent: 92,
  testGrade: 'A',
  submittedAt: '2026-09-10T14:20:00+05:30',
};

const lessons = (completed: number, total: number): Lesson[] =>
  Array.from({length: total}, (_, index) => ({
    id: `l-${index}`,
    courseId: 'course-tally-cert',
    title: `Lesson ${index + 1}`,
    index: index + 1,
    state: index < completed ? 'completed' : index === completed ? 'current' : 'available',
  }));

describe('semester wait helpers', () => {
  it('maps scores to grades', () => {
    expect(gradeFromPercent(92)).toBe('A');
    expect(gradeFromPercent(81)).toBe('B');
    expect(gradeFromPercent(70)).toBe('C');
    expect(gradeFromPercent(undefined)).toBeUndefined();
  });

  it('formats the submitted timestamp used on the checklist', () => {
    expect(formatSubmittedAt('2026-09-10T14:20:00+05:30')).toBe('10 Sep 2026 · 14:20');
    expect(formatEstimate('2026-09-13T09:00:00+05:30')).toBe('13 Sep 2026');
  });

  it('builds a 3-step checklist matching the wait screen', () => {
    const items = buildChecklist({
      ...baseSemester,
      lessons: lessons(12, 12),
      tests: [],
      projects: [],
    });
    expect(items).toHaveLength(3);
    expect(items.map(item => item.state)).toEqual(['ok', 'ok', 'pend']);
    expect(items[0].value).toBe('12/12');
    expect(items[1].value).toBe('92%');
    expect(items[2].chip).toBe('PENDING');
    expect(currentChecklistStep(items)).toBe(3);
    const hero = waitHero(baseSemester, items);
    expect(hero.title).toBe('Semester 1 Completed!');
    expect(hero.subtitle).toContain('92%');
    expect(hero.tone).toBe('amber');
  });

  it('keeps submit as the last incomplete step when work is ready', () => {
    const items = buildChecklist({
      ...baseSemester,
      status: 'requirements_complete',
      submittedAt: undefined,
      lessons: lessons(12, 12),
      tests: [],
      projects: [],
    });
    expect(items[2].state).toBe('todo');
    expect(waitHero({...baseSemester, status: 'requirements_complete'}, items).title).toBe(
      'Ready for institute review',
    );
  });

  it('prefers a tally live class for the wait banner', () => {
    const classes: LiveClass[] = [
      {
        id: 'live-fundamentals',
        title: 'Computer Fundamentals',
        startsAt: '2026-09-13T10:00:00+05:30',
        endsAt: '2026-09-13T11:00:00+05:30',
        instructorName: 'Ranjan Sir',
        status: 'live',
        recordingAvailable: false,
      },
      {
        id: 'live-tally',
        title: 'Live Batch — Tally Prime',
        startsAt: '2026-09-15T17:00:00+05:30',
        endsAt: '2026-09-15T18:00:00+05:30',
        instructorName: 'Ranjan Sir',
        status: 'scheduled',
        batch: 'GST batch',
        recordingAvailable: false,
      },
    ];
    const picked = pickWaitLiveClass(classes, 'Tally Prime Professional Certification');
    expect(picked?.id).toBe('live-tally');
    expect(liveClassLine(picked)).toContain('Ranjan Sir');
  });

  it('summarises the locked next semester', () => {
    expect(
      nextSemesterMeta({
        id: 'sem-2',
        enrollmentId: 'enr-tally-cert',
        index: 2,
        title: 'GST Concepts & Taxation',
        status: 'locked',
        lessonCount: 8,
        testCount: 2,
        projectCount: 1,
        estimatedUnlockAt: '2026-09-13T09:00:00+05:30',
      }),
    ).toMatch(/8 lessons · 2 tests · 1 project/);
  });
});
