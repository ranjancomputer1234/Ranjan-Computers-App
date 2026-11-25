import {resolvePublishedTarget} from '../src/features/catalog/openPublishedTarget';

describe('resolvePublishedTarget', () => {
  it('opens the course catalogue for catalog(course, paid) and keeps the section pricing filter', () => {
    expect(resolvePublishedTarget('catalog', 'course,paid', 'all')).toEqual({
      name: 'ComputerCourses',
      params: undefined,
    });
  });

  it('opens competitive exams for a catalog exam target', () => {
    expect(resolvePublishedTarget('catalog', 'exam', 'all')).toEqual({
      name: 'CompetitiveExams',
      params: undefined,
    });
  });

  it('opens computer courses from the welcome banner slug', () => {
    expect(resolvePublishedTarget('section', 'computer-courses')).toEqual({
      name: 'ComputerCourses',
      params: undefined,
    });
  });

  it('opens a course or lesson when the API sends an id', () => {
    expect(resolvePublishedTarget('course', 'crs_tally')).toEqual({
      name: 'CourseDetail',
      params: {courseId: 'crs_tally'},
    });
    expect(resolvePublishedTarget('lesson', 'lsn_start')).toEqual({
      name: 'LessonPlayer',
      params: {lessonId: 'lsn_start'},
    });
  });

  it('uses the pricing suffix when the section does not send its own filter', () => {
    expect(resolvePublishedTarget('catalog', 'course,paid')).toEqual({
      name: 'ComputerCourses',
      params: {pricing: 'paid'},
    });
  });
});
