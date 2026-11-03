import {Alert} from 'react-native';
import type {PricingFilter} from '../../core/types';
import type {HomeNav} from '../../navigation/types';

const unavailableMessage = 'This content is not available in the app yet.';

export function showLearnerUnavailable() {
  Alert.alert('Not available', unavailableMessage);
}

type Destination =
  | {name: 'CourseDetail'; params: {courseId: string}}
  | {name: 'LessonPlayer'; params: {lessonId: string}}
  | {name: 'ComputerCourses'; params?: {pricing?: PricingFilter}}
  | {name: 'CompetitiveExams'; params?: {pricing?: PricingFilter}}
  | {name: 'DailyNews'; params?: {pricing?: PricingFilter}}
  | {name: 'GeneralAwareness'; params?: {pricing?: PricingFilter}}
  | {name: 'AmazingFacts'; params?: {pricing?: PricingFilter}}
  | {name: 'InterviewPrep'}
  | {name: 'ExamDetail'; params: {examId: string}}
  | {name: 'TestList'; params?: {examId?: string}}
  | {name: 'TestInstructions'; params: {testId: string}}
  | {name: 'NewsFeed'; params: {categoryId: string}}
  | {name: 'NewsArticle'; params: {articleId: string}}
  | {name: 'TopicDetail'; params: {topicId: string}}
  | {name: 'FactsList'; params?: {categoryId?: string}}
  | {name: 'FactDetail'; params: {factId: string}}
  | {name: 'InterviewQuestion'; params: {questionId: string}}
  | {name: 'InterviewQuestionList'; params: {categoryId: string}}
  | {name: 'LiveRoom'; params: {liveClassId: string}}
  | {name: 'LiveTab'; params: {screen: 'LiveSchedule'}};

const CATALOG_KEYS: Record<string, string> = {
  course: 'course',
  courses: 'course',
  'computer-courses': 'course',
  exam: 'exam',
  exams: 'exam',
  'competitive-exams': 'exam',
  news: 'news',
  'daily-news': 'news',
  topic: 'topic',
  topics: 'topic',
  awareness: 'topic',
  'general-awareness': 'topic',
  fact: 'fact',
  facts: 'fact',
  'amazing-facts': 'fact',
  interview: 'interview',
  'interview-prep': 'interview',
  test: 'test',
  tests: 'test',
  live: 'live',
  liveclass: 'live',
  'live-class': 'live',
  'live-classes': 'live',
};

const RECORD_KINDS: Record<string, string> = {
  course: 'course',
  lesson: 'lesson',
  exam: 'exam',
  test: 'test',
  news: 'news',
  fact: 'fact',
  topic: 'topic',
  interviewquestion: 'interviewQuestion',
  interviewcategory: 'interviewCategory',
  liveclass: 'live',
  'live-class': 'live',
  document: 'document',
};

/**
 * Route a banner or explore section from the learner API targetKind and targetRef.
 * Catalog targets look like `catalog` + `course,paid` or `catalog` + `exam`.
 * An explicit section pricing filter wins over the pricing suffix in targetRef.
 */
export function resolvePublishedTarget(
  targetKind: string | undefined,
  targetRef: string | undefined,
  pricing?: PricingFilter,
): Destination | null {
  const kind = (targetKind ?? '').trim();
  const ref = (targetRef ?? '').trim();
  if (!kind) return null;

  const prefixed = parsePrefixedRef(ref);
  if (prefixed) return destinationForCatalog(prefixed.kind, prefixed.id, pricing ?? prefixed.pricing);

  const normalized = kind.toLowerCase();
  if (normalized === 'catalog' || normalized === 'section') {
    const parsed = parseCatalogRef(ref);
    return destinationForCatalog(parsed.kind, parsed.id, pricing ?? parsed.pricing);
  }

  const recordKind = RECORD_KINDS[normalized.replace(/_/g, '')];
  if (recordKind && ref && !CATALOG_KEYS[ref.toLowerCase()]) {
    return destinationForRecord(recordKind, ref);
  }

  if (CATALOG_KEYS[normalized]) {
    const parsed = parseCatalogRef(ref || normalized);
    return destinationForCatalog(parsed.kind || normalized, parsed.id, pricing ?? parsed.pricing);
  }

  return null;
}

export function openPublishedTarget(
  navigation: HomeNav,
  targetKind: string | undefined,
  targetRef: string | undefined,
  pricing?: PricingFilter,
) {
  const destination = resolvePublishedTarget(targetKind, targetRef, pricing);
  if (!destination) {
    if ((targetKind ?? '').trim()) showLearnerUnavailable();
    return;
  }
  const navigate = navigation.navigate as (name: string, params?: object) => void;
  if (destination.name === 'LiveTab') {
    navigate('LiveTab', destination.params);
    return;
  }
  if ('params' in destination && destination.params) navigate(destination.name, destination.params);
  else navigate(destination.name);
}

function parsePrefixedRef(ref: string): {kind: string; id?: string; pricing?: PricingFilter} | null {
  const body = unwrapCatalog(ref);
  const match = body.match(
    /^(news-category|awareness-topic|interview-category|course|lesson|exam|test|news|fact|topic|liveClass|live-class):([^,]+)$/i,
  );
  if (!match) return null;
  return {kind: match[1], id: match[2].trim()};
}

function parseCatalogRef(ref: string): {kind: string; id?: string; pricing?: PricingFilter} {
  const body = unwrapCatalog(ref);
  const [rawKind, rawPricing] = body.split(',').map(part => part.trim());
  const pricing = rawPricing?.toLowerCase();
  return {
    kind: (rawKind ?? '').toLowerCase(),
    pricing: pricing === 'free' || pricing === 'paid' || pricing === 'all' ? pricing : undefined,
  };
}

function unwrapCatalog(ref: string): string {
  const wrapped = ref.trim().match(/^catalog\((.+)\)$/i);
  return (wrapped ? wrapped[1] : ref).trim();
}

function destinationForCatalog(
  rawKind: string,
  id: string | undefined,
  pricing?: PricingFilter,
): Destination | null {
  const key = CATALOG_KEYS[rawKind.toLowerCase()] ?? RECORD_KINDS[rawKind.toLowerCase().replace(/_/g, '')];
  const params = pricing && pricing !== 'all' ? {pricing} : undefined;
  if (key === 'course') {
    return id ? {name: 'CourseDetail', params: {courseId: id}} : {name: 'ComputerCourses', params};
  }
  if (key === 'exam') {
    return id ? {name: 'ExamDetail', params: {examId: id}} : {name: 'CompetitiveExams', params};
  }
  if (key === 'news') {
    return id ? {name: 'NewsFeed', params: {categoryId: id}} : {name: 'DailyNews', params};
  }
  if (key === 'topic') {
    return id ? {name: 'TopicDetail', params: {topicId: id}} : {name: 'GeneralAwareness', params};
  }
  if (key === 'fact') {
    return id ? {name: 'FactDetail', params: {factId: id}} : {name: 'AmazingFacts', params};
  }
  if (key === 'interview') {
    return id
      ? {name: 'InterviewQuestionList', params: {categoryId: id}}
      : {name: 'InterviewPrep'};
  }
  if (key === 'test') {
    return id ? {name: 'TestInstructions', params: {testId: id}} : {name: 'TestList'};
  }
  if (key === 'live') {
    return id ? {name: 'LiveRoom', params: {liveClassId: id}} : {name: 'LiveTab', params: {screen: 'LiveSchedule'}};
  }
  if (key === 'lesson' && id) return {name: 'LessonPlayer', params: {lessonId: id}};
  if (key === 'interviewQuestion' && id) return {name: 'InterviewQuestion', params: {questionId: id}};
  if (key === 'interviewCategory' && id) return {name: 'InterviewQuestionList', params: {categoryId: id}};
  return null;
}

function destinationForRecord(kind: string, id: string): Destination | null {
  switch (kind) {
    case 'course':
      return {name: 'CourseDetail', params: {courseId: id}};
    case 'lesson':
      return {name: 'LessonPlayer', params: {lessonId: id}};
    case 'exam':
      return {name: 'ExamDetail', params: {examId: id}};
    case 'test':
      return {name: 'TestInstructions', params: {testId: id}};
    case 'news':
      return {name: 'NewsArticle', params: {articleId: id}};
    case 'fact':
      return {name: 'FactDetail', params: {factId: id}};
    case 'topic':
      return {name: 'TopicDetail', params: {topicId: id}};
    case 'interviewQuestion':
      return {name: 'InterviewQuestion', params: {questionId: id}};
    case 'interviewCategory':
      return {name: 'InterviewQuestionList', params: {categoryId: id}};
    case 'live':
      return {name: 'LiveRoom', params: {liveClassId: id}};
    default:
      return null;
  }
}
