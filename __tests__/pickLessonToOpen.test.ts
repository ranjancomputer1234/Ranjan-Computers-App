import {pickLessonToOpen} from '../src/features/catalog/pickLessonToOpen';
import type {Lesson} from '../src/core/types';

function lesson(id: string, index: number, state: Lesson['state']): Lesson {
  return {id, courseId: 'course', title: id, index, state};
}

describe('pickLessonToOpen', () => {
  it('opens a preview lesson when that is the only published lesson', () => {
    const next = pickLessonToOpen([lesson('intro', 1, 'preview')], {enrolled: true});
    expect(next?.id).toBe('intro');
  });

  it('starts an enrolled learner at the first playable lesson', () => {
    const next = pickLessonToOpen(
      [lesson('intro', 1, 'preview'), lesson('formulas', 2, 'available')],
      {enrolled: true},
    );
    expect(next?.id).toBe('intro');
  });

  it('follows the saved resume lesson', () => {
    const next = pickLessonToOpen(
      [lesson('intro', 1, 'preview'), lesson('formulas', 2, 'available')],
      {enrolled: true, nextLessonId: 'formulas'},
    );
    expect(next?.id).toBe('formulas');
  });

  it('opens the first lesson for an enrolled learner when the list is still locked', () => {
    const next = pickLessonToOpen([lesson('one', 1, 'locked'), lesson('two', 2, 'locked')], {enrolled: true});
    expect(next?.id).toBe('one');
  });

  it('does not open a locked lesson before enrollment', () => {
    expect(pickLessonToOpen([lesson('one', 1, 'locked')])).toBeUndefined();
  });
});
