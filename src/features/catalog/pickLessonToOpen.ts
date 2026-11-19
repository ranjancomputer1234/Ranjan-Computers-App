import type {Lesson} from '../../core/types';

/** First lesson the learner can start. Preview lessons count; locked ones do only after enrollment. */
export function pickLessonToOpen(
  lessons: Lesson[],
  options: {nextLessonId?: string; enrolled?: boolean} = {},
): Lesson | undefined {
  const ordered = [...lessons].sort((a, b) => a.index - b.index);
  const preferred = options.nextLessonId
    ? ordered.find(lesson => lesson.id === options.nextLessonId)
    : undefined;
  if (preferred && (options.enrolled || preferred.state !== 'locked')) return preferred;
  const playable = ordered.find(lesson => lesson.state !== 'locked');
  if (playable) return playable;
  return options.enrolled ? ordered[0] : undefined;
}
