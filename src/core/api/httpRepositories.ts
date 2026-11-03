import {http, isAppError, tokenStore} from './http';
import {appConfig} from '../config';
import {learnerDeviceIdentity} from '../installation';
import {assertOfflineGrant, offlineFiles} from '../offlineFiles';
import type {CatalogQuery, Repositories} from '../repositories';
import {getAccountScoped, setAccountScoped} from '../storage';
import type {
  AccessDecision,
  Attempt,
  AwarenessTopic,
  Bookmark,
  CatalogItem,
  ClayVariantName,
  Course,
  DownloadItem,
  Enrollment,
  Exam,
  Fact,
  InterviewQuestion,
  IssuedDocument,
  LearnerProfile,
  Lesson,
  LiveClass,
  NewsArticle,
  Page,
  PricingFilter,
  Question,
  SessionTokens,
  TestDefinition,
  TestResult,
} from '../types';
import type {DownloadAuthorization} from '../offlineFiles';

type ApiLearner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  accountState: LearnerProfile['accountState'];
  verifiedEmail?: boolean;
  verifiedPhone?: boolean;
  batchId?: string | null;
};

type ApiAuth = {accessToken: string; learner: ApiLearner};

type ApiAccess = {
  granted: boolean;
  reason?: string | null;
  canDownload: boolean;
  canPreview: boolean;
  expiresAt?: string | null;
  source?: string | null;
};

type ApiLesson = {
  id: string;
  courseId?: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  durationMinutes?: number | null;
  contentType?: string;
  isPreview?: boolean;
  hasMedia?: boolean;
  resourceId?: string | null;
  resources?: Array<{
    id: string;
    title?: string | null;
    mimeType?: string | null;
    kind?: 'pdf' | 'video' | 'audio' | 'notes' | 'other' | null;
  }>;
};

type ApiCourse = {
  id: string;
  slug?: string;
  title: string;
  shortTitle?: string | null;
  summary?: string | null;
  description?: string | null;
  commercialMode: 'free' | 'paid' | 'included' | 'invite_only' | 'hidden_internal';
  deliveryType?: 'standard' | 'semester_certification';
  coverImageUrl?: string | null;
  estimatedMinutes?: number | null;
  lessons?: ApiLesson[];
  access?: ApiAccess | null;
};

type ApiSection = {
  id: string;
  title: string;
  description?: string | null;
  badge?: string | null;
  category?: string;
  iconKey?: string | null;
  themeKey?: string | null;
  imageUrl?: string | null;
  targetKind?: string | null;
  targetRef?: string | null;
  pricingFilter?: 'all' | 'free' | 'paid';
};

type ApiBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  imageUrl?: string | null;
  altText?: string | null;
  themeKey?: string | null;
  targetKind?: string | null;
  targetRef?: string | null;
};

type ApiHome = {
  banners: ApiBanner[];
  sections: ApiSection[];
  featuredCourses: ApiCourse[];
  continuing: Array<{
    lessonId: string;
    title: string;
    courseId: string;
    courseTitle: string;
    progressPct: number;
  }>;
};

type ApiSearch = {
  courses: ApiCourse[];
  lessons: Array<ApiLesson & {course?: {title?: string}}>;
};

type ApiEnrollment = {
  id: string;
  courseId: string;
  source: string;
  status: string;
  startsAt?: string;
  updatedAt?: string;
  course?: {id: string; title: string; slug?: string; lifecycle?: string};
};

type ApiDocument = {
  id: string;
  documentType: 'admit_card' | 'certificate' | 'receipt';
  status: IssuedDocument['status'];
  serial?: string | null;
  title: string;
  courseId?: string | null;
  resourceId?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  verificationToken?: string;
  shareForbidden?: boolean;
};

type ApiDownloadAuthorization = {
  resourceId: string;
  kind: 'pdf' | 'video' | 'audio' | 'notes' | 'other';
  title: string;
  mimeType: string;
  byteSize?: number | null;
  contentVersion: number;
  delivery: {
    method: string;
    url: string;
    expiresAt: string;
    integrity?: {algo?: string; hash?: string} | null;
    encryption?: {algo?: string; packagingFormat?: string} | null;
    exportForbidden?: boolean;
  };
  offlineAuthorization?: {
    grantId: string;
    validFrom: string;
    validUntil: string;
    kid: string;
    signature: string;
    payload: Record<string, unknown>;
  } | null;
  drm?: {status?: string; offlineAllowed?: boolean; message?: string} | null;
  policy?: {
    openInsideAppOnly?: boolean;
    shareExportPrintForbidden?: boolean;
    publicStorageForbidden?: boolean;
  };
  playback?: {
    type?: string;
    url?: string | null;
    expiresInSeconds?: number | null;
    status?: string;
  } | null;
};

type ApiVerification = {
  valid: boolean;
  status: string;
  message?: string;
  title?: string;
  serial?: string;
  issuer?: string;
  identity?: {displayName?: string};
};

type ApiOfflineCrypto = {
  kid: string;
  algorithm: string;
  status: string;
};

const EMPTY_ACCESS: AccessDecision = {
  state: 'denied',
  reason: 'unavailable',
  canPreview: false,
  canDownload: false,
};

async function get<T>(url: string, params?: object): Promise<T> {
  const response = await http.get<T>(url, {params});
  return response.data;
}

async function post<T>(url: string, body?: object): Promise<T> {
  const response = await http.post<T>(url, body);
  return response.data;
}

async function patch<T>(url: string, body?: object): Promise<T> {
  const response = await http.patch<T>(url, body);
  return response.data;
}

async function put<T>(url: string, body?: object): Promise<T> {
  const response = await http.put<T>(url, body);
  return response.data;
}

/** Missing learner routes are not published yet. Lists stay empty instead of failing the screen. */
async function getOptional<T>(url: string, params?: object): Promise<T | undefined> {
  try {
    return await get<T>(url, params);
  } catch (error) {
    if (isAppError(error) && error.httpStatus === 404) return undefined;
    throw error;
  }
}

function unavailable<T>(feature: string): Promise<T> {
  return Promise.reject({
    code: 'feature_unavailable',
    message: `${feature} is not available in the learner API yet.`,
    retryable: false,
  });
}

function expiryFromNow(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function toProfile(learner: ApiLearner): LearnerProfile {
  const fullName = [learner.firstName, learner.lastName].filter(Boolean).join(' ').trim();
  return {
    id: learner.id,
    fullName: fullName || learner.email,
    email: learner.email,
    phone: learner.phone || undefined,
    city: learner.city || undefined,
    interests: [],
    stats: {courses: 0, tests: 0, streakDays: 0},
    achievements: [],
    accountState: learner.accountState,
    verifiedEmail: learner.verifiedEmail,
    verifiedPhone: learner.verifiedPhone,
    batchId: learner.batchId || undefined,
  };
}

function toSession(auth: ApiAuth): {tokens: SessionTokens; profile: LearnerProfile} {
  return {
    tokens: {
      accessToken: auth.accessToken,
      accountId: auth.learner.id,
      expiresAt: expiryFromNow(),
    },
    profile: toProfile(auth.learner),
  };
}

function splitName(fullName: string): {firstName: string; lastName: string} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {firstName: parts.shift() ?? '', lastName: parts.join(' ')};
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

function toAccess(access: ApiAccess | null | undefined, courseMode?: ApiCourse['commercialMode']): AccessDecision {
  if (!access) {
    return courseMode === 'free'
      ? {state: 'granted', canPreview: true, canDownload: false}
      : {...EMPTY_ACCESS, reason: tokenStore.getAccessToken() ? 'purchase_required' : 'login_required'};
  }
  const reason =
    access.reason === 'entitlement_required'
      ? 'purchase_required'
      : access.reason === 'course_unavailable'
        ? 'unavailable'
        : access.reason === 'expired' || access.reason === 'revoked'
          ? access.reason
          : undefined;
  return {
    state: access.granted ? 'granted' : 'denied',
    reason,
    expiresAt: access.expiresAt || undefined,
    canPreview: access.canPreview,
    canDownload: access.canDownload,
  };
}

function toCourse(course: ApiCourse): Course {
  const access = toAccess(course.access, course.commercialMode);
  return {
    id: course.id,
    title: course.title,
    subtitle: course.summary || course.shortTitle || undefined,
    kind: 'course',
    pricing: course.commercialMode === 'free' ? 'free' : 'paid',
    clay: course.commercialMode === 'free' ? 'mint' : 'blue',
    icon: 'bookopen',
    letter: course.shortTitle?.charAt(0) || course.title.charAt(0),
    imageUrl: course.coverImageUrl || undefined,
    access,
    description: course.description || course.summary || undefined,
    lessonCount: course.lessons?.length,
    isSemester: course.deliveryType === 'semester_certification',
    purchased: access.state === 'granted' && course.commercialMode !== 'free',
    enrolled: course.access?.source === 'enrollment',
  };
}

function toLesson(lesson: ApiLesson, courseId = lesson.courseId ?? '', granted = true): Lesson {
  return {
    id: lesson.id,
    courseId,
    title: lesson.title,
    index: lesson.sortOrder + 1,
    durationSeconds: lesson.durationMinutes ? lesson.durationMinutes * 60 : undefined,
    state: lesson.isPreview ? 'preview' : granted ? 'available' : 'locked',
    notes: lesson.description || undefined,
  };
}

const CLAY = new Set<ClayVariantName>([
  'blue', 'green', 'orange', 'pink', 'purple', 'yellow', 'mint', 'lavender',
  'cyan', 'peach', 'cream', 'beige', 'indigo', 'sky', 'red', 'white',
]);

const THEME_ALIAS: Record<string, ClayVariantName> = {
  teal: 'mint',
};

const ICON_ALIAS: Record<string, string> = {
  calculator: 'chart',
  computer: 'monitor',
};

function toSection(section: ApiSection): CatalogItem {
  const theme = section.themeKey ? THEME_ALIAS[section.themeKey] ?? section.themeKey : undefined;
  const clay = CLAY.has(theme as ClayVariantName) ? (theme as ClayVariantName) : 'blue';
  const supportedKinds = new Set(['course', 'exam', 'news', 'fact', 'topic']);
  const kind = supportedKinds.has(section.targetKind ?? '')
    ? (section.targetKind as CatalogItem['kind'])
    : 'section';
  const iconKey = section.iconKey ? ICON_ALIAS[section.iconKey] ?? section.iconKey : 'book';
  return {
    id: section.id,
    targetId: section.targetRef || undefined,
    targetKind: section.targetKind || undefined,
    title: section.title,
    subtitle: section.description || undefined,
    kind,
    pricing: section.pricingFilter === 'paid' ? 'paid' : 'free',
    pricingFilter: section.pricingFilter === 'free' || section.pricingFilter === 'paid' ? section.pricingFilter : 'all',
    clay,
    icon: iconKey,
    imageUrl: section.imageUrl || undefined,
    access: {state: 'granted', canPreview: true, canDownload: false},
  };
}

function emptyPage<T>(items: T[] = []): Page<T> {
  return {items, nextCursor: null, total: items.length};
}

function toDocument(doc: ApiDocument, learnerName: string): IssuedDocument {
  return {
    id: doc.id,
    kind: doc.documentType,
    status: doc.status,
    title: doc.title,
    learnerName,
    resourceId: doc.resourceId || undefined,
    serial: doc.serial || undefined,
    verificationToken: doc.verificationToken,
    shareForbidden: doc.shareForbidden ?? true,
    details: {
      course: doc.courseId || '',
      admitCardId: doc.documentType === 'admit_card' ? doc.serial || '' : '',
      certificateId: doc.documentType === 'certificate' ? doc.serial || '' : '',
    },
    verified: doc.status === 'issued',
    issuedAt: doc.issuedAt || undefined,
  };
}

const OPEN_ACCESS: AccessDecision = {state: 'granted', canPreview: true, canDownload: false};
const LIVE_STATUSES = new Set<LiveClass['status']>([
  'scheduled', 'starting', 'live', 'reconnecting', 'ended', 'cancelled',
]);

function asRows(payload: unknown): Record<string, unknown>[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? (payload as {items?: unknown; data?: unknown; results?: unknown}).items
        ?? (payload as {data?: unknown}).data
        ?? (payload as {results?: unknown}).results
      : undefined;
  return Array.isArray(list) ? list.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object') : [];
}

function pageOf<T>(payload: unknown, map: (row: Record<string, unknown>) => T): Page<T> {
  const items = asRows(payload).map(map);
  const meta = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as {nextCursor?: string | null; total?: number}
    : undefined;
  return {items, nextCursor: meta?.nextCursor ?? null, total: meta?.total ?? items.length};
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function decision(value: unknown, mode?: string): AccessDecision {
  if (!value || typeof value !== 'object') {
    return mode === 'free' || mode === undefined ? OPEN_ACCESS : {...EMPTY_ACCESS, reason: 'purchase_required'};
  }
  const row = value as ApiAccess & AccessDecision;
  if (row.state === 'granted' || row.state === 'denied' || row.state === 'unknown') {
    return {
      state: row.state,
      reason: row.reason,
      productId: row.productId,
      expiresAt: row.expiresAt,
      canPreview: Boolean(row.canPreview),
      canDownload: Boolean(row.canDownload),
    };
  }
  if (typeof row.granted === 'boolean') return toAccess(row, mode as ApiCourse['commercialMode']);
  return OPEN_ACCESS;
}

function pricingOf(row: Record<string, unknown>): 'free' | 'paid' {
  return row.pricing === 'paid' || row.commercialMode === 'paid' ? 'paid' : 'free';
}

function toExam(row: Record<string, unknown>): Exam {
  return {
    id: String(row.id),
    title: text(row.title) ?? 'Exam',
    subtitle: text(row.summary) ?? text(row.subtitle) ?? text(row.description),
    kind: 'exam',
    pricing: pricingOf(row),
    clay: 'purple',
    icon: text(row.iconKey) ?? 'target',
    imageUrl: text(row.imageUrl) ?? text(row.coverImageUrl),
    access: decision(row.access, text(row.commercialMode)),
    description: text(row.description) ?? text(row.summary),
    relatedExams: Array.isArray(row.relatedExams) ? row.relatedExams.map(String) : undefined,
    testCount: typeof row.testCount === 'number' ? row.testCount : undefined,
    learnerCount: typeof row.learnerCount === 'number' ? row.learnerCount : undefined,
  };
}

function toTest(row: Record<string, unknown>): TestDefinition {
  const minutes = typeof row.durationMinutes === 'number' ? row.durationMinutes : undefined;
  return {
    id: String(row.id),
    examId: text(row.examId),
    title: text(row.title) ?? 'Test',
    questionCount: typeof row.questionCount === 'number' ? row.questionCount : Array.isArray(row.questions) ? row.questions.length : 0,
    durationSeconds: typeof row.durationSeconds === 'number' ? row.durationSeconds : minutes ? minutes * 60 : 0,
    attemptCount: typeof row.attemptCount === 'number' ? row.attemptCount : undefined,
    pricing: pricingOf(row),
    marking: text(row.marking),
    negativeMarking: text(row.negativeMarking),
    passThreshold: typeof row.passThreshold === 'number' ? row.passThreshold : undefined,
    attemptLimit: typeof row.attemptLimit === 'number' ? row.attemptLimit : undefined,
    resumePolicy: text(row.resumePolicy),
    solutionPolicy: text(row.solutionPolicy),
    mode: row.mode === 'formal' ? 'formal' : 'practice',
    access: decision(row.access, text(row.commercialMode)),
  };
}

function toQuestion(row: Record<string, unknown>): Question {
  const options = Array.isArray(row.options) ? row.options : [];
  return {
    id: String(row.id),
    prompt: text(row.prompt) ?? text(row.question) ?? '',
    helper: text(row.helper),
    category: text(row.category),
    options: options.filter((option): option is Record<string, unknown> => Boolean(option) && typeof option === 'object').map(option => ({
      id: String(option.id),
      label: text(option.label) ?? text(option.text) ?? '',
    })),
    revealAnswer: typeof row.revealAnswer === 'boolean' ? row.revealAnswer : undefined,
    correctOptionId: text(row.correctOptionId),
  };
}

function toAttempt(row: Record<string, unknown>): Attempt & {questions: Question[]} {
  const answers = row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers)
    ? Object.fromEntries(Object.entries(row.answers as Record<string, unknown>).map(([key, value]) => [key, String(value)]))
    : {};
  const status = row.status;
  return {
    id: String(row.id),
    testId: text(row.testId) ?? '',
    status: status === 'submitted' || status === 'scored' || status === 'expired' || status === 'abandoned' ? status : 'in_progress',
    expiresAt: text(row.expiresAt),
    revision: typeof row.revision === 'number' ? row.revision : 0,
    currentIndex: typeof row.currentIndex === 'number' ? row.currentIndex : 0,
    answers,
    startedAt: text(row.startedAt) ?? new Date().toISOString(),
    questions: asRows(row.questions).map(toQuestion),
  };
}

function toResult(row: Record<string, unknown>): TestResult {
  const questions = asRows(row.questions).map(question => {
    const status: 'correct' | 'wrong' | 'skipped' =
      question.status === 'correct' || question.status === 'wrong' ? question.status : 'skipped';
    return {
      id: String(question.id),
      prompt: text(question.prompt) ?? '',
      status,
      selectedOptionId: text(question.selectedOptionId),
      selectedLabel: text(question.selectedLabel),
      correctLabel: text(question.correctLabel),
      explanation: text(question.explanation),
      section: text(question.section),
    };
  });
  return {
    attemptId: text(row.attemptId) ?? String(row.id ?? ''),
    testId: text(row.testId) ?? '',
    testTitle: text(row.testTitle) ?? text(row.title),
    score: typeof row.score === 'number' ? row.score : 0,
    maxScore: typeof row.maxScore === 'number' ? row.maxScore : 0,
    percent: typeof row.percent === 'number' ? row.percent : 0,
    rank: typeof row.rank === 'number' ? row.rank : undefined,
    rankTotal: typeof row.rankTotal === 'number' ? row.rankTotal : undefined,
    accuracy: typeof row.accuracy === 'number' ? row.accuracy : undefined,
    timeTakenSeconds: typeof row.timeTakenSeconds === 'number' ? row.timeTakenSeconds : undefined,
    questions,
    solutionsAvailable: Boolean(row.solutionsAvailable),
  };
}

function toArticle(row: Record<string, unknown>): NewsArticle {
  const body = Array.isArray(row.body) ? row.body.map(part => String(part)) : text(row.body) ? [String(row.body)] : undefined;
  return {
    id: String(row.id),
    categoryId: text(row.categoryId) ?? text(row.category) ?? 'news',
    title: text(row.title) ?? 'News',
    byline: text(row.byline),
    publishedAt: text(row.publishedAt) ?? text(row.createdAt) ?? new Date(0).toISOString(),
    readingMinutes: typeof row.readingMinutes === 'number' ? row.readingMinutes : typeof row.readingTime === 'number' ? row.readingTime : undefined,
    excerpt: text(row.excerpt) ?? text(row.summary),
    body,
    highlights: Array.isArray(row.highlights) ? row.highlights.map(String) : undefined,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : undefined,
    featured: Boolean(row.featured),
    imageUrl: text(row.imageUrl) ?? text(row.heroImageUrl),
    access: decision(row.access, text(row.commercialMode)),
    imageTint: 'orange',
  };
}

function toTopic(row: Record<string, unknown>): AwarenessTopic {
  const schema = row.schema === 'list' || row.schema === 'article' ? row.schema : 'pairs';
  return {
    id: String(row.id),
    title: text(row.title) ?? 'Topic',
    subtitle: text(row.summary) ?? text(row.subtitle),
    kind: 'topic',
    pricing: pricingOf(row),
    clay: 'lavender',
    icon: text(row.iconKey) ?? 'book',
    imageUrl: text(row.imageUrl),
    access: decision(row.access, text(row.commercialMode)),
    schema,
    summaryChips: Array.isArray(row.summaryChips) ? row.summaryChips.map(String) : undefined,
    entries: asRows(row.entries).map(entry => ({
      id: String(entry.id),
      label: text(entry.label) ?? '',
      value: text(entry.value) ?? text(entry.text) ?? '',
      group: text(entry.group),
      iconColor: text(entry.iconColor),
    })),
  };
}

function toFact(row: Record<string, unknown>): Fact {
  return {
    id: String(row.id),
    categoryId: text(row.categoryId) ?? 'facts',
    text: text(row.text) ?? text(row.title) ?? '',
    explanation: text(row.explanation),
    reactionCount: typeof row.reactionCount === 'number' ? row.reactionCount : 0,
    reacted: Boolean(row.reacted),
    bookmarked: Boolean(row.bookmarked),
    featured: Boolean(row.featured),
    quizId: text(row.quizId) ?? text(row.relatedQuizId),
  };
}

function toInterviewQuestion(row: Record<string, unknown>): InterviewQuestion {
  return {
    id: String(row.id),
    categoryId: text(row.categoryId) ?? 'interview',
    prompt: text(row.prompt) ?? text(row.question) ?? text(row.title) ?? '',
    modelAnswer: text(row.modelAnswer) ?? text(row.answer),
  };
}

function toLiveClass(row: Record<string, unknown>): LiveClass {
  const status = LIVE_STATUSES.has(row.status as LiveClass['status']) ? row.status as LiveClass['status'] : 'scheduled';
  const instructor = row.instructor && typeof row.instructor === 'object' ? text((row.instructor as {name?: string}).name) : undefined;
  return {
    id: String(row.id),
    title: text(row.title) ?? 'Live class',
    startsAt: text(row.startsAt) ?? text(row.startAt) ?? new Date().toISOString(),
    endsAt: text(row.endsAt) ?? text(row.endAt) ?? text(row.startsAt) ?? new Date().toISOString(),
    instructorName: text(row.instructorName) ?? instructor ?? 'Instructor',
    status,
    batch: text(row.batch) ?? text(row.batchName),
    durationLabel: text(row.durationLabel),
    viewerCount: typeof row.viewerCount === 'number' ? row.viewerCount : undefined,
    recordingAvailable: Boolean(row.recordingAvailable),
    reminderSet: Boolean(row.reminderSet),
  };
}

function catalogCard(row: Record<string, unknown>, kind: CatalogItem['kind'], icon: string, clay: ClayVariantName): CatalogItem {
  return {
    id: String(row.id),
    title: text(row.title) ?? text(row.name) ?? 'Untitled',
    subtitle: text(row.summary) ?? text(row.subtitle) ?? text(row.description),
    kind,
    pricing: pricingOf(row),
    clay,
    icon: text(row.iconKey) ?? icon,
    imageUrl: text(row.imageUrl) ?? text(row.coverImageUrl),
    access: decision(row.access, text(row.commercialMode)),
  };
}

function filterCatalog(items: CatalogItem[], query: {search?: string; pricing?: PricingFilter}): CatalogItem[] {
  let next = items;
  const term = query.search?.trim().toLocaleLowerCase();
  if (term) next = next.filter(item => `${item.title} ${item.subtitle ?? ''}`.toLocaleLowerCase().includes(term));
  if (query.pricing && query.pricing !== 'all') next = next.filter(item => item.pricing === query.pricing);
  return next;
}

/** Query string the six explore catalogues send. See docs/handover. */
function catalogParams(query: Pick<CatalogQuery, 'search' | 'pricing' | 'cursor'>) {
  return {
    ...(query.search?.trim() ? {search: query.search.trim()} : {}),
    ...(query.pricing && query.pricing !== 'all' ? {pricing: query.pricing} : {}),
    ...(query.cursor ? {cursor: query.cursor} : {}),
  };
}

function asCatalogPage<T>(
  payload: unknown,
  map: (row: Record<string, unknown>) => T,
): Page<T> | undefined {
  if (Array.isArray(payload)) return pageOf(payload, map);
  if (payload && typeof payload === 'object') {
    const record = payload as {items?: unknown; data?: unknown; results?: unknown};
    if (Array.isArray(record.items) || Array.isArray(record.data) || Array.isArray(record.results)) {
      return pageOf(payload, map);
    }
  }
  return undefined;
}

function finishCatalogPage(page: Page<CatalogItem>, query: CatalogQuery): Page<CatalogItem> {
  if (page.nextCursor) return page;
  const items = filterCatalog(page.items, query);
  return {items, nextCursor: null, total: items.length};
}

function courseFromRow(row: Record<string, unknown>): Course {
  return toCourse(row as unknown as ApiCourse);
}

async function listCourses(query: CatalogQuery): Promise<Page<CatalogItem>> {
  const payload = await getOptional<unknown>('/courses', catalogParams(query));
  const page = payload ? asCatalogPage(payload, courseFromRow) : undefined;
  if (page) return page;

  // GET /courses is not on the learner API yet. Until the handover list exists,
  // show featured courses from /home, or search hits when the learner typed a query.
  let items: Course[];
  if (query.search?.trim()) {
    const result = await get<ApiSearch>('/search', {q: query.search.trim()});
    items = result.courses.map(toCourse);
  } else {
    const home = await get<ApiHome>('/home');
    items = (home.featuredCourses ?? []).map(toCourse);
  }
  if (query.pricing && query.pricing !== 'all') {
    items = items.filter(item => item.pricing === query.pricing);
  }
  return emptyPage(items);
}

async function listPublishedKind(
  kind: 'exam' | 'news' | 'topic' | 'fact' | 'interview',
  query: CatalogQuery,
): Promise<Page<CatalogItem>> {
  const params = catalogParams(query);
  if (kind === 'exam') {
    const payload = await getOptional<unknown>('/exams', params);
    return payload ? asCatalogPage(payload, toExam) ?? emptyPage() : emptyPage();
  }
  if (kind === 'news') {
    const categories = await getOptional<unknown>('/news/categories', params);
    const page = categories
      ? asCatalogPage(categories, row => catalogCard(row, 'news', 'news', 'orange'))
      : undefined;
    if (page) return page;
    const articles = await getOptional<unknown>('/news', params);
    const seen = new Set<string>();
    const derived = articles
      ? asRows(articles).flatMap(row => {
          const id = text(row.categoryId) ?? text(row.category);
          if (!id || seen.has(id)) return [];
          seen.add(id);
          return [catalogCard({...row, id, title: text(row.categoryTitle) ?? id}, 'news', 'news', 'orange')];
        })
      : [];
    return emptyPage(derived);
  }
  if (kind === 'topic') {
    const payload = await getOptional<unknown>('/awareness/topics', params);
    return payload
      ? asCatalogPage(payload, row => catalogCard(row, 'topic', 'book', 'lavender')) ?? emptyPage()
      : emptyPage();
  }
  if (kind === 'fact') {
    const categories = await getOptional<unknown>('/facts/categories', params);
    const page = categories
      ? asCatalogPage(categories, row => catalogCard(row, 'fact', 'bulb', 'green'))
      : undefined;
    if (page) return page;
    const facts = await getOptional<unknown>('/facts', params);
    const seen = new Set<string>();
    const derived = facts
      ? asRows(facts).flatMap(row => {
          const id = text(row.categoryId);
          if (!id || seen.has(id)) return [];
          seen.add(id);
          return [catalogCard({id, title: text(row.categoryTitle) ?? id}, 'fact', 'bulb', 'green')];
        })
      : [];
    return emptyPage(derived);
  }
  const categories = await getOptional<unknown>('/interview/categories', params);
  const page = categories
    ? asCatalogPage(categories, row => catalogCard(row, 'interviewCategory', 'users', 'mint'))
    : undefined;
  if (page) return page;
  const questions = await getOptional<unknown>('/interview/questions', params);
  const seen = new Set<string>();
  const derived = questions
    ? asRows(questions).flatMap(row => {
        const id = text(row.categoryId);
        if (!id || seen.has(id)) return [];
        seen.add(id);
        return [catalogCard({id, title: text(row.categoryTitle) ?? id}, 'interviewCategory', 'users', 'mint')];
      })
    : [];
  return emptyPage(derived);
}

async function publishedLiveClasses(fromIso?: string, toIso?: string): Promise<LiveClass[]> {
  const now = Date.now();
  const payload = await getOptional<unknown>('/live-classes', {
    from: fromIso ?? new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    to: toIso ?? new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(),
  });
  return payload ? asRows(payload).map(toLiveClass) : [];
}

export function createHttpRepositories(): Repositories {
  const fetchProfile = async () => toProfile(await get<ApiLearner>('/me'));

  return {
    auth: {
      login: async (identifier, password) => {
        if (!identifier.includes('@')) {
          return unavailable('Phone-number sign-in');
        }
        return toSession(await post<ApiAuth>('/auth/login', {email: identifier.toLowerCase(), password}));
      },
      register: async input => {
        const split = splitName(input.fullName ?? '');
        const firstName = (input.firstName ?? split.firstName).trim();
        const lastName = (input.lastName ?? split.lastName).trim();
        if (!firstName || !lastName) {
          return unavailable('A first and last name');
        }
        const body = {
          firstName,
          lastName,
          email: input.email.toLowerCase(),
          password: input.password,
          ...(normalizePhone(input.phone) ? {phone: normalizePhone(input.phone)} : {}),
          ...(input.city?.trim() ? {city: input.city.trim()} : {}),
        };
        return toSession(await post<ApiAuth>('/auth/register', body));
      },
      verifyChallenge: () => unavailable('Contact verification'),
      forgotPassword: () => unavailable('Password recovery'),
      verifyResetCode: () => unavailable('Password recovery'),
      resetPassword: () => unavailable('Password recovery'),
      exchangeGoogle: () => unavailable('Google sign-in'),
      logout: async () => {
        try {
          await post('/auth/logout');
        } catch {
          // Logout still discards the token on this device when the server call fails.
        }
      },
      me: fetchProfile,
      updateMe: async profile => {
        const name = profile.fullName ? splitName(profile.fullName) : {};
        const body = {
          ...name,
          ...(profile.phone !== undefined ? {phone: normalizePhone(profile.phone)} : {}),
          ...(profile.city !== undefined ? {city: profile.city} : {}),
          appVersion: appConfig.versionName,
        };
        return toProfile(await patch<ApiLearner>('/me', body));
      },
    },
    catalog: {
      home: async () => {
        const signedIn = Boolean(tokenStore.getAccessToken());
        const [home, liveClasses] = await Promise.all([
          get<ApiHome>(signedIn ? '/home/me' : '/home'),
          publishedLiveClasses().catch(() => [] as LiveClass[]),
        ]);
        return {
          greetingName: undefined,
          banners: home.banners.flatMap(banner => {
            const imageUrl = banner.imageUrl || undefined;
            if (!imageUrl) return [];
            return [{
              id: banner.id,
              title: banner.title,
              imageUrl,
              altText: banner.altText || undefined,
              targetKind: banner.targetKind || undefined,
              targetId: banner.targetRef || undefined,
              themeKey: banner.themeKey || undefined,
            }];
          }),
          sections: home.sections.map(toSection),
          featuredCourses: home.featuredCourses.map(toCourse),
          liveClasses,
          continueLearning: home.continuing.slice(0, 5).map(current => ({
            courseId: current.courseId,
            lessonId: current.lessonId,
            title: current.courseTitle,
            lessonLabel: current.title,
            percent: current.progressPct,
          })),
          unreadNotifications: 0,
        };
      },
      list: async query => {
        if (query.kind === 'course') return listCourses(query);
        return finishCatalogPage(await listPublishedKind(query.kind, query), query);
      },
      course: async id => {
        const path = tokenStore.getAccessToken() ? `/courses/${id}/access` : `/courses/${id}`;
        return toCourse(await get<ApiCourse>(path));
      },
      exam: async id => toExam(await get<Record<string, unknown>>(`/exams/${id}`)),
      search: async (q, type) => {
        if (!q.trim()) return emptyPage([]);
        if (type && type !== 'COURSE') return emptyPage([]);
        const result = await get<ApiSearch>('/search', {q: q.trim()});
        const courses = result.courses.map(course => ({...toCourse(course), badge: 'COURSE'}));
        const lessons = type
          ? []
          : result.lessons.map(lesson => ({
              id: lesson.id,
              targetId: lesson.id,
              courseId: lesson.courseId,
              title: lesson.title,
              subtitle: lesson.course?.title,
              kind: 'lesson' as const,
              pricing: 'free' as const,
              clay: 'blue' as const,
              icon: 'play',
              access: {state: 'granted' as const, canPreview: true, canDownload: false},
              badge: 'LESSON',
            }));
        return emptyPage([...courses, ...lessons]);
      },
    },
    learning: {
      enrollments: async () => {
        const rows = await get<ApiEnrollment[]>('/me/enrollments');
        return rows.filter(row => row.status === 'active').map<Enrollment>(row => ({
          id: row.id,
          courseId: row.courseId,
          kind: 'standard',
          purchasedAt: row.startsAt,
          progress: {
            completedLessons: 0,
            totalLessons: 0,
            percent: 0,
            updatedAt: row.updatedAt || row.startsAt || new Date(0).toISOString(),
          },
        }));
      },
      enroll: async courseId => {
        const row = await post<ApiEnrollment>(`/courses/${courseId}/enroll`);
        return {
          id: row.id,
          courseId: row.courseId,
          kind: 'standard',
          purchasedAt: row.startsAt,
          progress: {completedLessons: 0, totalLessons: 0, percent: 0, updatedAt: row.updatedAt || new Date().toISOString()},
        };
      },
      lessons: async courseId => {
        const [lessons, course] = await Promise.all([
          get<ApiLesson[]>(`/courses/${courseId}/lessons`),
          tokenStore.getAccessToken()
            ? get<ApiCourse>(`/courses/${courseId}/access`)
            : get<ApiCourse>(`/courses/${courseId}`),
        ]);
        const granted = course.commercialMode === 'free' || Boolean(course.access?.granted);
        return lessons.map(lesson => toLesson(lesson, courseId, granted));
      },
      lesson: async id => {
        const lesson = await get<ApiLesson>(`/lessons/${id}`);
        const listed = lesson.resources ?? [];
        const resources = (listed.length ? listed : lesson.resourceId ? [{id: lesson.resourceId, title: lesson.title, kind: lesson.contentType === 'video' ? 'video' as const : 'other' as const}] : []).map(resource => ({
          id: resource.id,
          lessonId: lesson.id,
          title: resource.title || lesson.title,
          mimeType: resource.mimeType || (resource.kind === 'video' ? 'application/vnd.apple.mpegurl' : 'application/octet-stream'),
          kind: resource.kind || (lesson.contentType === 'video' ? 'video' as const : 'other' as const),
          canDownload: true,
        }));
        return {
          ...toLesson(lesson, lesson.courseId ?? ''),
          hasMedia: Boolean(lesson.hasMedia),
          resources,
        };
      },
      saveProgress: (lessonId, positionSeconds, progressPct) =>
        post(`/lessons/${lessonId}/progress`, {
          positionSeconds: Math.max(0, Math.floor(positionSeconds)),
          ...(progressPct === undefined ? {} : {progressPct: Math.max(0, Math.min(100, Math.round(progressPct)))}),
        }).then(() => undefined),
      completeLesson: lessonId => post(`/lessons/${lessonId}/complete`).then(() => undefined),
      bookmarks: async () => {
        const account = tokenStore.getAccountId();
        return account ? getAccountScoped<Bookmark[]>(account, 'bookmarks', []) : [];
      },
      setBookmark: async (ref, saved) => {
        const account = tokenStore.getAccountId();
        if (!account) return unavailable('Saved items');
        const current = await getAccountScoped<Bookmark[]>(account, 'bookmarks', []);
        const next = saved
          ? [...current.filter(item => item.ref.kind !== ref.kind || item.ref.id !== ref.id), {
              id: `${ref.kind}:${ref.id}`,
              ref,
              title: 'Saved item',
              clay: 'blue' as const,
              icon: 'bookmark',
            }]
          : current.filter(item => item.ref.kind !== ref.kind || item.ref.id !== ref.id);
        await setAccountScoped(account, 'bookmarks', next);
      },
      semesters: () => Promise.resolve([]),
      semester: () => unavailable('Semester learning'),
      submitReview: () => unavailable('Semester review'),
      project: () => unavailable('Projects'),
      submitProject: () => unavailable('Projects'),
    },
    assessments: {
      tests: async examId => {
        const payload = await getOptional<unknown>('/tests', examId ? {examId} : undefined);
        return payload ? asRows(payload).map(toTest) : [];
      },
      test: async id => toTest(await get<Record<string, unknown>>(`/tests/${id}`)),
      startAttempt: async testId => toAttempt(await post<Record<string, unknown>>(`/tests/${testId}/attempts`)),
      attempt: async id => toAttempt(await get<Record<string, unknown>>(`/attempts/${id}`)),
      saveAnswer: (attemptId, questionId, optionId, revision) =>
        put<{revision: number}>(`/attempts/${attemptId}/answers/${questionId}`, {optionId, revision}),
      submit: async (attemptId, revision) => toResult(await post<Record<string, unknown>>(`/attempts/${attemptId}/submit`, {revision})),
      result: async attemptId => toResult(await get<Record<string, unknown>>(`/attempts/${attemptId}/result`)),
      history: async () => {
        if (!tokenStore.getAccessToken()) return [];
        const payload = await getOptional<unknown>('/me/attempts');
        return payload ? asRows(payload).map(toResult) : [];
      },
      dailyPractice: kind => get<{testId: string}>('/practice/daily', {kind}),
    },
    content: {
      news: async (categoryId, cursor) => {
        const payload = await getOptional<unknown>('/news', {categoryId, cursor});
        return payload ? pageOf(payload, toArticle) : emptyPage();
      },
      article: async id => toArticle(await get<Record<string, unknown>>(`/news/${id}`)),
      topic: async id => toTopic(await get<Record<string, unknown>>(`/awareness/topics/${id}`)),
      facts: async (categoryId, cursor) => {
        const payload = await getOptional<unknown>('/facts', {categoryId, cursor});
        return payload ? pageOf(payload, toFact) : emptyPage();
      },
      fact: async id => toFact(await get<Record<string, unknown>>(`/facts/${id}`)),
      reactFact: async (id, reacted) => toFact(await put<Record<string, unknown>>(`/facts/${id}/reaction`, {reacted})),
      interviewQuestions: async categoryId => {
        const payload = await getOptional<unknown>('/interview/questions', categoryId ? {categoryId} : undefined);
        return payload ? asRows(payload).map(toInterviewQuestion) : [];
      },
      interviewQuestion: async id => toInterviewQuestion(await get<Record<string, unknown>>(`/interview/questions/${id}`)),
    },
    live: {
      schedule: (fromIso, toIso) => publishedLiveClasses(fromIso, toIso),
      get: async id => toLiveClass(await get<Record<string, unknown>>(`/live-classes/${id}`)),
      join: async id => {
        const row = await post<{playbackUrl?: string; chatAvailable?: boolean; expiresAt?: string}>(`/live-classes/${id}/join`);
        return {playbackUrl: row.playbackUrl, chatAvailable: Boolean(row.chatAvailable), expiresAt: row.expiresAt};
      },
      setHand: (id, raised) => put<{raised: boolean}>(`/live-classes/${id}/hand`, {raised}),
      setReminder: (id, enabled) => put(`/live-classes/${id}/reminder`, {enabled}).then(() => undefined),
      sendChat: (id, body, clientId) => post(`/live-classes/${id}/chat`, {body, clientId}),
      chatHistory: async id => {
        const payload = await getOptional<unknown>(`/live-classes/${id}/chat`);
        return payload
          ? asRows(payload).map(row => ({
              id: String(row.id),
              body: text(row.body) ?? '',
              at: text(row.at) ?? text(row.createdAt) ?? new Date().toISOString(),
              mine: Boolean(row.mine),
              senderName: text(row.senderName),
              faculty: Boolean(row.faculty),
            }))
          : [];
      },
    },
    commerce: {
      restore: () => unavailable('Purchases'),
      quote: () => unavailable('Purchases'),
      createOrder: () => unavailable('Purchases'),
      getOrder: () => unavailable('Purchases'),
      verify: () => unavailable('Purchases'),
      history: () => Promise.resolve([]),
      entitlements: async () => {
        const rows = await get<Array<{courseId?: string | null; scopeRef?: string; state: string; canDownload: boolean; canPreview: boolean; endsAt?: string | null}>>('/me/entitlements');
        return rows.map(row => ({
          productId: row.courseId || row.scopeRef || '',
          access: {
            state: row.state === 'active' ? 'granted' as const : 'denied' as const,
            reason: row.state === 'expired' ? 'expired' as const : row.state === 'revoked' ? 'revoked' as const : undefined,
            expiresAt: row.endsAt || undefined,
            canDownload: row.canDownload,
            canPreview: row.canPreview,
          },
        }));
      },
    },
    account: {
      requestDeletion: () => unavailable('Account deletion'),
      notifications: () => Promise.resolve(emptyPage()),
      markRead: async () => undefined,
      clearAll: async () => ({mode: 'mark_read'}),
      registerPushDevice: async () => undefined,
      unregisterPushDevice: async () => undefined,
      documents: async kind => {
        const [rows, profile] = await Promise.all([
          get<ApiDocument[]>('/me/documents'),
          fetchProfile(),
        ]);
        return rows
          .filter(row => !kind || row.documentType === kind)
          .map(row => toDocument(row, profile.fullName));
      },
      document: async id => {
        const [row, profile] = await Promise.all([
          get<ApiDocument>(`/me/documents/${id}`),
          fetchProfile(),
        ]);
        return toDocument(row, profile.fullName);
      },
      authorizeDownload: async resourceId => {
        const identity = await learnerDeviceIdentity();
        const auth = await post<ApiDownloadAuthorization>(
          `/resources/${resourceId}/download-authorization`,
          {deviceId: identity.deviceId, installationId: identity.installationId},
        );
        const crypto = await get<ApiOfflineCrypto>('/crypto/offline-verification');
        const playback = auth.playback?.type
          ? {
              type: auth.playback.type,
              url: auth.playback.url,
              expiresInSeconds: auth.playback.expiresInSeconds,
              status: auth.playback.status,
            }
          : null;
        const mapped = {
          resourceId: auth.resourceId,
          url: auth.delivery?.url ?? '',
          expiresAt: auth.delivery?.expiresAt ?? auth.offlineAuthorization?.validUntil ?? new Date(0).toISOString(),
          offlineUntil: auth.offlineAuthorization?.validUntil,
          sha256: auth.delivery?.integrity?.hash,
          mimeType: auth.mimeType,
          kind: auth.kind,
          encryptionAlgorithm: auth.delivery?.encryption?.algo,
          packagingFormat: auth.delivery?.encryption?.packagingFormat,
          openInsideAppOnly: auth.policy?.openInsideAppOnly ?? true,
          exportForbidden:
            auth.policy?.shareExportPrintForbidden ??
            auth.delivery?.exportForbidden ??
            true,
          publicStorageForbidden: auth.policy?.publicStorageForbidden ?? true,
          offlineGrant: auth.offlineAuthorization || undefined,
          playback,
          drmStatus: auth.drm?.status,
          drmMessage: auth.drm?.message,
        } satisfies DownloadAuthorization;
        assertOfflineGrant(mapped);
        if (!crypto.kid || crypto.kid !== mapped.offlineGrant?.kid || crypto.algorithm !== 'HMAC-SHA256') {
          throw new Error('Offline authorization does not match the server key.');
        }
        if (crypto.status !== 'configured' && crypto.status !== 'using_dev_fallback') {
          throw new Error('Offline authorization is not configured.');
        }
        if (mapped.kind === 'video' && mapped.playback?.url && mapped.playback.type !== 'mux_hls' && mapped.playback.type !== 'cloudinary_hls') {
          throw new Error('This video cannot be played inside the app.');
        }
        return mapped;
      },
      verifyDocument: async token => {
        const result = await get<ApiVerification>(`/documents/verify/${encodeURIComponent(token)}`);
        return {
          valid: result.valid,
          status: result.status,
          message: result.message,
          title: result.title,
          serial: result.serial,
          issuer: result.issuer,
          displayName: result.identity?.displayName,
        };
      },
      downloads: async () => {
        const account = tokenStore.getAccountId();
        if (!account) return [];
        const rows = await offlineFiles.list(account);
        return rows.map<DownloadItem>(row => ({
          id: row.resourceId,
          resourceId: row.resourceId,
          title: row.title,
          kind: row.kind,
          bytes: row.bytes,
          status: row.available ? 'completed' : 'expired',
          progress: row.available ? 1 : 0,
        }));
      },
      support: () => unavailable('Support content'),
      legal: () => unavailable('Legal content'),
    },
  };
}

export type {Page};
