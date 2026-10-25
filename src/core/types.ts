export type EntityId = string;

export type Money = {
  amountMinor: number;
  currency: string;
};

export type ContentKind =
  | 'course'
  | 'lesson'
  | 'test'
  | 'news'
  | 'fact'
  | 'topic'
  | 'interviewQuestion'
  | 'interviewCategory'
  | 'liveClass'
  | 'document'
  | 'exam'
  | 'section';

export type ContentRef = {
  kind: ContentKind;
  id: EntityId;
};

export type AccessReason =
  | 'login_required'
  | 'purchase_required'
  | 'prerequisite_required'
  | 'verification_pending'
  | 'expired'
  | 'revoked'
  | 'unavailable';

export type AccessDecision = {
  state: 'unknown' | 'granted' | 'denied';
  reason?: AccessReason;
  productId?: EntityId;
  expiresAt?: string;
  canPreview: boolean;
  canDownload: boolean;
};

export type LearningProgress = {
  completedLessons: number;
  totalLessons: number;
  percent: number;
  nextLessonId?: EntityId;
  lastPositionSeconds?: number;
  updatedAt: string;
};

export type Page<T> = {
  items: T[];
  nextCursor?: string | null;
  total?: number;
};

export type AppError = {
  code: string;
  message: string;
  httpStatus?: number;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  retryable: boolean;
};

export type PricingFilter = 'all' | 'free' | 'paid';

export type ClayVariantName =
  | 'blue'
  | 'green'
  | 'orange'
  | 'pink'
  | 'purple'
  | 'yellow'
  | 'mint'
  | 'lavender'
  | 'cyan'
  | 'peach'
  | 'cream'
  | 'beige'
  | 'indigo'
  | 'sky'
  | 'red'
  | 'white';

export type CatalogItem = {
  id: EntityId;
  title: string;
  subtitle?: string;
  kind: ContentKind;
  pricing: 'free' | 'paid';
  clay: ClayVariantName;
  icon: string;
  /**
   * Optional raster icon managed by the admin catalogue. When present it
   * takes precedence over `letter` and the bundled `icon` key.
   */
  iconUrl?: string;
  letter?: string;
  iconColor?: string;
  /** Optional backend-managed image URL. */
  imageUrl?: string;
  /** Backend navigation target when the displayed item is an explore section. */
  targetId?: EntityId;
  /** Raw API targetKind (`course`, `catalog`, `section`, and the rest of the handover list). */
  targetKind?: string;
  /** Parent course for lesson search results. */
  courseId?: EntityId;
  access: AccessDecision;
};

export type Course = CatalogItem & {
  kind: 'course';
  description?: string;
  outcomes?: string[];
  prerequisites?: string[];
  rating?: number;
  learnerCount?: number;
  lessonCount?: number;
  isSemester: boolean;
  instructor?: Instructor;
  progress?: LearningProgress;
  productId?: EntityId;
  purchased?: boolean;
  enrolled?: boolean;
};

export type Instructor = {
  id: EntityId;
  name: string;
  title?: string;
  experience?: string;
  rating?: number;
  following?: boolean;
};

export type Lesson = {
  id: EntityId;
  courseId: EntityId;
  title: string;
  index: number;
  durationSeconds?: number;
  state: 'completed' | 'current' | 'available' | 'preview' | 'locked';
  notes?: string;
  hasMedia?: boolean;
};

export type LessonResource = {
  id: EntityId;
  lessonId: EntityId;
  title: string;
  mimeType: string;
  kind: 'pdf' | 'video' | 'notes' | 'audio' | 'other';
  sizeBytes?: number;
  canDownload: boolean;
};

export type Exam = CatalogItem & {
  kind: 'exam';
  relatedExams?: string[];
  testCount?: number;
  learnerCount?: number;
  description?: string;
};

export type TestDefinition = {
  id: EntityId;
  examId?: EntityId;
  title: string;
  questionCount: number;
  durationSeconds: number;
  attemptCount?: number;
  pricing: 'free' | 'paid';
  price?: Money;
  productId?: EntityId;
  marking?: string;
  negativeMarking?: string;
  passThreshold?: number;
  attemptLimit?: number;
  resumePolicy?: string;
  solutionPolicy?: string;
  mode: 'practice' | 'formal';
  access: AccessDecision;
};

export type Attempt = {
  id: EntityId;
  testId: EntityId;
  status: 'in_progress' | 'submitted' | 'scored' | 'expired' | 'abandoned';
  expiresAt?: string;
  revision: number;
  currentIndex: number;
  answers: Record<string, string>;
  startedAt: string;
};

export type Question = {
  id: EntityId;
  prompt: string;
  helper?: string;
  category?: string;
  options: { id: EntityId; label: string }[];
  revealAnswer?: boolean;
  correctOptionId?: EntityId;
};

export type ResultQuestion = {
  id: EntityId;
  prompt: string;
  status: 'correct' | 'wrong' | 'skipped';
  selectedOptionId?: EntityId;
  selectedLabel?: string;
  correctLabel?: string;
  explanation?: string;
  section?: string;
};

export type ResultSection = { name: string; score: number; max: number };

export type TestResult = {
  attemptId: EntityId;
  testId: EntityId;
  testTitle?: string;
  score: number;
  maxScore: number;
  percent: number;
  rank?: number;
  rankTotal?: number;
  accuracy?: number;
  timeTakenSeconds?: number;
  sections?: ResultSection[];
  questions: ResultQuestion[];
  solutionsAvailable: boolean;
};

export type NewsCategory = CatalogItem & { kind: 'section' };
export type NewsArticle = {
  id: EntityId;
  categoryId: EntityId;
  title: string;
  byline?: string;
  publishedAt: string;
  readingMinutes?: number;
  excerpt?: string;
  body?: string[];
  highlights?: string[];
  tags?: string[];
  featured?: boolean;
  /** Optional backend-managed image URL. */
  imageUrl?: string;
  access: AccessDecision;
  imageTint: ClayVariantName;
};

export type AwarenessTopic = CatalogItem & {
  schema: 'pairs' | 'list' | 'article';
  summaryChips?: string[];
  entries: {
    id: EntityId;
    label: string;
    value: string;
    group?: string;
    iconColor?: string;
  }[];
};

export type Fact = {
  id: EntityId;
  categoryId: EntityId;
  text: string;
  explanation?: string;
  reactionCount: number;
  reacted: boolean;
  bookmarked: boolean;
  featured?: boolean;
  quizId?: EntityId;
};

export type InterviewCategory = CatalogItem;
export type InterviewQuestion = {
  id: EntityId;
  categoryId: EntityId;
  prompt: string;
  modelAnswer?: string;
};

export type LiveClass = {
  id: EntityId;
  title: string;
  startsAt: string;
  endsAt: string;
  instructorName: string;
  status:
    | 'scheduled'
    | 'starting'
    | 'live'
    | 'reconnecting'
    | 'ended'
    | 'cancelled';
  batch?: string;
  durationLabel?: string;
  viewerCount?: number;
  recordingAvailable: boolean;
  reminderSet?: boolean;
};

export type Enrollment = {
  id: EntityId;
  courseId: EntityId;
  kind: 'standard' | 'semester';
  purchasedAt?: string;
  progress: LearningProgress;
};

export type Semester = {
  id: EntityId;
  enrollmentId: EntityId;
  index: number;
  title: string;
  status:
    | 'locked'
    | 'available'
    | 'in_progress'
    | 'requirements_complete'
    | 'pending_review'
    | 'changes_required'
    | 'approved'
    | 'course_complete';
  lessonCount: number;
  testCount: number;
  projectCount: number;
  completedLessons?: number;
  testScorePercent?: number;
  testGrade?: string;
  submittedAt?: string;
  reviewFeedback?: string;
  estimatedUnlockAt?: string;
  progressPercent?: number;
  unlockReason?: string;
};

export type Project = {
  id: EntityId;
  semesterId: EntityId;
  title: string;
  instructions: string;
  status:
    | 'not_started'
    | 'draft'
    | 'submitted'
    | 'accepted'
    | 'changes_required';
  feedback?: string;
};

export type Order = {
  id: EntityId;
  productId: EntityId;
  title: string;
  quote: {
    storeProductId?: string;
    mrpMinor: number;
    discountMinor: number;
    totalMinor: number;
    currency: string;
    coupon?: string;
    couponDiscountMinor?: number;
    expiresAt: string;
    methods: PaymentMethodId[];
  };
  status:
    | 'idle'
    | 'creatingOrder'
    | 'awaitingProvider'
    | 'verifying'
    | 'paidAccessPending'
    | 'succeeded'
    | 'cancelled'
    | 'failed'
    | 'unknownNeedsRecheck';
  paidAt?: string;
  method?: PaymentMethodId;
  methodDetail?: string;
  receiptId?: string;
};

export type PaymentMethodId = 'upi' | 'card' | 'netbanking' | 'wallet';

export type IssuedDocument = {
  id: EntityId;
  kind: 'admit_card' | 'certificate' | 'receipt';
  status:
    | 'not_issued'
    | 'generation_pending'
    | 'generated'
    | 'approval_pending'
    | 'issued'
    | 'revoked'
    | 'superseded'
    | 'expired'
    | 'generation_failed';
  title: string;
  learnerName: string;
  details: Record<string, string>;
  resourceId?: EntityId;
  serial?: string;
  verificationToken?: string;
  shareForbidden?: boolean;
  verificationUrl?: string;
  verified: boolean;
  issuedAt?: string;
};

export type NotificationCategory = 'classes' | 'tests' | 'news' | 'offers' | 'system';

export type NotificationItem = {
  id: EntityId;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  category: NotificationCategory;
  source?: 'admin' | 'automatic';
  priority?: 'normal' | 'high';
  actionLabel?: string;
  target?: ContentRef;
};

export type PushDeviceRegistration = {
  installationId: string;
  provider: 'fcm';
  platform: 'android';
  appVersion: string;
  locale: string;
  timezone: string;
  categories: Exclude<NotificationCategory, 'system'>[];
};

export type LearnerProfile = {
  id: EntityId;
  fullName: string;
  email?: string;
  phone?: string;
  phoneMasked?: string;
  avatarUrl?: string;
  currentlyLearning?: string;
  city?: string;
  interests: string[];
  memberSince?: string;
  stats: { courses: number; tests: number; streakDays: number };
  achievements: {
    id: EntityId;
    label: string;
    clay: ClayVariantName;
    icon: string;
  }[];
  accountState?:
    | 'pending_verification'
    | 'active'
    | 'suspended'
    | 'deletion_requested'
    | 'deleted'
    | 'blocked';
  verifiedEmail?: boolean;
  verifiedPhone?: boolean;
  batchId?: string;
};

export type Bookmark = {
  id: EntityId;
  ref: ContentRef;
  title: string;
  subtitle?: string;
  clay: ClayVariantName;
  icon: string;
};

export type DownloadItem = {
  id: EntityId;
  resourceId: EntityId;
  title: string;
  kind: 'video' | 'notes' | 'pdf' | 'audio';
  bytes: number;
  status:
    | 'queued'
    | 'downloading'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'expired';
  progress: number;
};

export type HomeDashboard = {
  greetingName?: string;
  banners: Array<{
    id: EntityId;
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    imageUrl?: string;
    targetKind?: string;
    targetId?: EntityId;
    themeKey?: string;
  }>;
  sections: CatalogItem[];
  featuredCourses: Course[];
  liveClasses: LiveClass[];
  continueLearning: Array<{
    courseId: EntityId;
    lessonId: EntityId;
    enrollmentId?: EntityId;
    title: string;
    lessonLabel: string;
    percent: number;
  }>;
  unreadNotifications: number;
};

export type SessionStatus =
  | 'bootstrapping'
  | 'guest'
  | 'authenticated'
  | 'loggedOut'
  | 'recoveryRequired';

export type SessionTokens = {
  accessToken: string;
  refreshToken?: string;
  accountId: string;
  expiresAt: string;
};
