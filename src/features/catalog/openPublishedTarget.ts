import {Alert} from 'react-native';
import type {HomeNav} from '../../navigation/types';

const unavailableMessage = 'This content is not available in the app yet.';

export function showLearnerUnavailable() {
  Alert.alert('Not available', unavailableMessage);
}

/**
 * Route a banner or explore section using the learner API's targetKind and targetRef.
 * Only course, lesson, and the computer-courses section have learner read APIs.
 */
export function openPublishedTarget(
  navigation: HomeNav,
  targetKind: string | undefined,
  targetRef: string | undefined,
) {
  const kind = (targetKind ?? '').trim();
  const ref = (targetRef ?? '').trim();
  if (!kind) return;

  if (kind === 'course' && ref) {
    navigation.navigate('CourseDetail', {courseId: ref});
    return;
  }
  if (kind === 'lesson' && ref) {
    navigation.navigate('LessonPlayer', {lessonId: ref});
    return;
  }
  if (kind === 'section' && isCourseSection(ref)) {
    navigation.navigate('ComputerCourses');
    return;
  }
  if (kind === 'catalog' && isCourseSection(ref)) {
    navigation.navigate('ComputerCourses');
    return;
  }
  showLearnerUnavailable();
}

function isCourseSection(ref: string) {
  const key = ref.toLowerCase();
  return !key || key === 'computer-courses' || key === 'courses' || key === 'course';
}
