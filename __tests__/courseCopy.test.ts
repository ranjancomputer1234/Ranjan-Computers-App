import {formatLearningTime, isInternalTestCourse, isPlaceholderCopy, lessonNotes, presentCourse, syllabusItems} from '../src/features/catalog/courseCopy';
import {isLoginIdentifier} from '../src/features/auth/schema';
import type {Course} from '../src/core/types';

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: 'cmw3vzvuj0022v3902sx34gsy',
    title: 'GST Basics for Small Business',
    kind: 'course',
    pricing: 'paid',
    clay: 'blue',
    icon: 'bookopen',
    access: {state: 'denied', canPreview: false, canDownload: false},
    description: 'Dummy paid course for local testing. Lesson files are short public sample clips.',
    isSemester: false,
    ...overrides,
  };
}

describe('course copy', () => {
  it('replaces the GST testing overview with a real description, outcomes and syllabus', () => {
    const presented = presentCourse(course(), 'gst-basics');
    expect(presented.description).toContain('Goods and Services Tax');
    expect(presented.description).not.toMatch(/dummy|sample clip/i);
    expect(presented.outcomes).toEqual(expect.arrayContaining([
      expect.stringMatching(/CGST, SGST, and IGST/),
    ]));
    expect(presented.syllabus?.map(item => item.title)).toEqual(['What is GST', 'Filing a simple return']);
  });

  it('writes the GST lessons out instead of keeping the one-line placeholder notes', () => {
    const notes = lessonNotes('cmw3vzvuj0022v3902sx34gsy', 'cmw3vzwh60024v390gl35d01f', 'What is GST', 'Tax on supply of goods and services.');
    expect(notes).toContain('GSTIN');
    expect(notes).not.toBe('Tax on supply of goods and services.');
  });

  it('hides internal test courses and recognises placeholder copy', () => {
    expect(isInternalTestCourse({title: 'Test Course', slug: 'Test1'})).toBe(true);
    expect(isInternalTestCourse({title: 'GST Basics for Small Business', slug: 'gst-basics'})).toBe(false);
    expect(isPlaceholderCopy('Dummy course for local testing. Lesson files are short public sample clips.')).toBe(true);
    expect(syllabusItems(['What is GST', 'Filing a simple return'])?.map(item => item.title)).toEqual([
      'What is GST',
      'Filing a simple return',
    ]);
    expect(syllabusItems([])).toBeUndefined();
    expect(formatLearningTime(22)).toBe('22 min');
    expect(formatLearningTime(90)).toBe('1 hr 30 min');
  });
});

describe('login identifier', () => {
  it('accepts email and a 10-digit Indian mobile number', () => {
    expect(isLoginIdentifier('riya@learner.local')).toBe(true);
    expect(isLoginIdentifier('9876543210')).toBe(true);
    expect(isLoginIdentifier('+919876543210')).toBe(true);
    expect(isLoginIdentifier('12345')).toBe(false);
  });
});
