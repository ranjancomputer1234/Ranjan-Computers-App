import {http, tokenStore} from './http';
import {appConfig} from '../config';
import {learnerDeviceIdentity} from '../installation';
import {assertOfflineGrant, offlineFiles} from '../offlineFiles';
import type {Repositories} from '../repositories';
import {getAccountScoped, setAccountScoped} from '../storage';
import type {
  AccessDecision,
  Bookmark,
  CatalogItem,
  ClayVariantName,
  Course,
  DownloadItem,
  Enrollment,
  IssuedDocument,
  LearnerProfile,
  Lesson,
  Page,
  SessionTokens,
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
        const home = await get<ApiHome>(signedIn ? '/home/me' : '/home');
        return {
          greetingName: undefined,
          banners: home.banners.map(banner => ({
            id: banner.id,
            title: banner.title,
            subtitle: banner.subtitle || undefined,
            ctaLabel: banner.ctaLabel || undefined,
            imageUrl: banner.imageUrl || undefined,
            targetKind: banner.targetKind || undefined,
            targetId: banner.targetRef || undefined,
            themeKey: banner.themeKey || undefined,
          })),
          sections: home.sections.map(toSection),
          featuredCourses: home.featuredCourses.map(toCourse),
          liveClasses: [],
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
        let items: CatalogItem[];
        if (query.kind === 'course') {
          if (query.search?.trim()) {
            const result = await get<ApiSearch>('/search', {q: query.search.trim()});
            items = result.courses.map(toCourse);
          } else {
            const home = await get<ApiHome>('/home');
            items = home.featuredCourses.map(toCourse);
          }
        } else {
          const sections = await get<ApiSection[]>('/categories');
          items = sections.map(toSection).filter(item => item.kind === query.kind);
          if (query.search?.trim()) {
            const term = query.search.trim().toLocaleLowerCase();
            items = items.filter(item => `${item.title} ${item.subtitle ?? ''}`.toLocaleLowerCase().includes(term));
          }
        }
        if (query.pricing && query.pricing !== 'all') {
          items = items.filter(item => item.pricing === query.pricing);
        }
        return emptyPage(items);
      },
      course: async id => {
        const path = tokenStore.getAccessToken() ? `/courses/${id}/access` : `/courses/${id}`;
        return toCourse(await get<ApiCourse>(path));
      },
      exam: () => unavailable('Exam preparation'),
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
      tests: () => Promise.resolve([]),
      test: () => unavailable('Learner tests'),
      startAttempt: () => unavailable('Learner tests'),
      attempt: () => unavailable('Learner tests'),
      saveAnswer: () => unavailable('Learner tests'),
      submit: () => unavailable('Learner tests'),
      result: () => unavailable('Learner tests'),
      history: () => Promise.resolve([]),
      dailyPractice: () => unavailable('Daily practice'),
    },
    content: {
      news: () => Promise.resolve(emptyPage()),
      article: () => unavailable('Learner news'),
      topic: () => unavailable('General awareness'),
      facts: () => Promise.resolve(emptyPage()),
      fact: () => unavailable('Facts'),
      reactFact: () => unavailable('Fact reactions'),
      interviewQuestions: () => Promise.resolve([]),
      interviewQuestion: () => unavailable('Interview preparation'),
    },
    live: {
      schedule: () => Promise.resolve([]),
      get: () => unavailable('Live classes'),
      join: () => unavailable('Live classes'),
      setHand: () => unavailable('Live classes'),
      setReminder: () => unavailable('Live classes'),
      sendChat: () => unavailable('Live chat'),
      chatHistory: () => Promise.resolve([]),
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
