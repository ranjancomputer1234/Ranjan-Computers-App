import type {
  AccessDecision,
  Attempt,
  AwarenessTopic,
  Bookmark,
  CatalogItem,
  ContentRef,
  Course,
  DownloadItem,
  Enrollment,
  Exam,
  Fact,
  HomeDashboard,
  InterviewQuestion,
  IssuedDocument,
  LearnerProfile,
  Lesson,
  LessonResource,
  LiveClass,
  NewsArticle,
  NotificationItem,
  PushDeviceRegistration,
  Order,
  Page,
  PaymentMethodId,
  PricingFilter,
  Project,
  Question,
  Semester,
  TestDefinition,
  TestResult,
} from './types';

export type CatalogQuery = {
  kind: 'course' | 'exam' | 'news' | 'topic' | 'fact' | 'interview';
  search?: string;
  pricing?: PricingFilter;
  cursor?: string;
};

export type Repositories = {
  auth: AuthRepository;
  catalog: CatalogRepository;
  learning: LearningRepository;
  assessments: AssessmentRepository;
  content: ContentRepository;
  live: LiveRepository;
  commerce: CommerceRepository;
  account: AccountRepository;
};

export type AuthRepository = {
  login: (identifier: string, password: string) => Promise<{tokens: import('./types').SessionTokens; profile: LearnerProfile}>;
  register: (input: {fullName?: string; firstName?: string; lastName?: string; email: string; phone?: string; city?: string; password: string}) => Promise<{tokens: import('./types').SessionTokens; profile: LearnerProfile}>;
  verifyChallenge: (challengeId: string, code: string) => Promise<{tokens: import('./types').SessionTokens; profile: LearnerProfile}>;
  forgotPassword: (identifier: string) => Promise<{challengeId: string}>;
  verifyResetCode: (challengeId: string, code: string) => Promise<{resetToken: string}>;
  resetPassword: (challengeId: string, password: string) => Promise<void>;
  exchangeGoogle: (idToken: string) => Promise<{tokens: import('./types').SessionTokens; profile: LearnerProfile}>;
  logout: () => Promise<void>;
  me: () => Promise<LearnerProfile>;
  updateMe: (patch: Partial<LearnerProfile>) => Promise<LearnerProfile>;
};

export type CatalogRepository = {
  home: () => Promise<HomeDashboard>;
  list: (query: CatalogQuery) => Promise<Page<CatalogItem>>;
  course: (id: string) => Promise<Course>;
  exam: (id: string) => Promise<Exam>;
  search: (q: string, type?: string, cursor?: string) => Promise<Page<CatalogItem & {badge: string}>>;
};

export type LearningRepository = {
  enrollments: () => Promise<Enrollment[]>;
  enroll: (courseId: string) => Promise<Enrollment>;
  lessons: (courseId: string) => Promise<Lesson[]>;
  lesson: (id: string) => Promise<Lesson & {resources: LessonResource[]; playbackUrl?: string}>;
  saveProgress: (lessonId: string, positionSeconds: number, progressPct?: number) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  bookmarks: () => Promise<Bookmark[]>;
  setBookmark: (ref: ContentRef, saved: boolean) => Promise<void>;
  semesters: (enrollmentId: string) => Promise<Semester[]>;
  semester: (enrollmentId: string, semesterId: string) => Promise<Semester & {lessons: Lesson[]; tests: TestDefinition[]; projects: Project[]}>;
  submitReview: (enrollmentId: string, semesterId: string) => Promise<void>;
  project: (id: string) => Promise<Project>;
  submitProject: (id: string, payload: {text?: string; fileId?: string}) => Promise<Project>;
};

export type AssessmentRepository = {
  tests: (examId?: string) => Promise<TestDefinition[]>;
  test: (id: string) => Promise<TestDefinition>;
  startAttempt: (testId: string) => Promise<Attempt>;
  attempt: (id: string) => Promise<Attempt & {questions: Question[]}>;
  saveAnswer: (attemptId: string, questionId: string, optionId: string, revision: number) => Promise<{revision: number}>;
  submit: (attemptId: string, revision: number) => Promise<TestResult>;
  result: (attemptId: string) => Promise<TestResult>;
  history: () => Promise<TestResult[]>;
  dailyPractice: (kind: 'facts' | 'interview') => Promise<{testId: string}>;
};

export type ContentRepository = {
  news: (categoryId?: string, cursor?: string) => Promise<Page<NewsArticle>>;
  article: (id: string) => Promise<NewsArticle>;
  topic: (id: string) => Promise<AwarenessTopic>;
  facts: (categoryId?: string, cursor?: string) => Promise<Page<Fact>>;
  fact: (id: string) => Promise<Fact>;
  reactFact: (id: string, reacted: boolean) => Promise<Fact>;
  interviewQuestions: (categoryId?: string) => Promise<InterviewQuestion[]>;
  interviewQuestion: (id: string) => Promise<InterviewQuestion>;
};

export type LiveRepository = {
  schedule: (fromIso: string, toIso: string) => Promise<LiveClass[]>;
  get: (id: string) => Promise<LiveClass>;
  join: (id: string) => Promise<{playbackUrl?: string; chatAvailable: boolean; expiresAt?: string}>;
  setHand: (id: string, raised: boolean) => Promise<{raised: boolean}>;
  setReminder: (id: string, enabled: boolean) => Promise<void>;
  sendChat: (id: string, body: string, clientId: string) => Promise<{id: string; body: string; at: string}>;
  chatHistory: (id: string) => Promise<{id: string; body: string; at: string; mine?: boolean; senderName?: string; faculty?: boolean}[]>;
};

export type CommerceRepository = {
  restore: (purchases: Record<string, unknown>[]) => Promise<Order[]>;
  quote: (productId: string, coupon?: string) => Promise<Order['quote'] & {productId: string; title: string}>;
  createOrder: (
    productId: string,
    coupon?: string,
    idempotencyKey?: string,
    method?: PaymentMethodId,
  ) => Promise<Order>;
  getOrder: (id: string) => Promise<Order>;
  verify: (orderId: string, providerPayload?: Record<string, unknown>) => Promise<Order>;
  history: () => Promise<Order[]>;
  entitlements: () => Promise<{productId: string; access: AccessDecision}[]>;
};

export type AccountRepository = {
  requestDeletion: () => Promise<{requestId: string; status: 'requested' | 'deleted'; message?: string}>;
  notifications: (cursor?: string, category?: string) => Promise<Page<NotificationItem>>;
  markRead: (id: string) => Promise<void>;
  clearAll: () => Promise<{mode: 'archive' | 'mark_read'}>;
  registerPushDevice: (device: PushDeviceRegistration) => Promise<void>;
  unregisterPushDevice: (installationId: string) => Promise<void>;
  documents: (kind?: 'admit_card' | 'certificate') => Promise<IssuedDocument[]>;
  document: (id: string) => Promise<IssuedDocument>;
  verifyDocument: (token: string) => Promise<{valid: boolean; status: string; message?: string; title?: string; serial?: string; issuer?: string; displayName?: string}>;
  authorizeDownload: (resourceId: string) => Promise<import('./offlineFiles').DownloadAuthorization>;
  downloads: () => Promise<DownloadItem[]>;
  support: () => Promise<{faqs: {q: string; a: string}[]; email?: string; phone?: string}>;
  legal: (slug: string) => Promise<{title: string; body: string}>;
};
