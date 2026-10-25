import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp, NavigatorScreenParams, RouteProp} from '@react-navigation/native';

export type PricingFilter = 'all' | 'free' | 'paid';

export type HomeStackParamList = {
  Home: undefined;
  Search: {query?: string} | undefined;
  Notifications: undefined;
  ComputerCourses: {pricing?: PricingFilter} | undefined;
  CompetitiveExams: {pricing?: PricingFilter} | undefined;
  DailyNews: {pricing?: PricingFilter} | undefined;
  GeneralAwareness: {pricing?: PricingFilter} | undefined;
  AmazingFacts: {pricing?: PricingFilter} | undefined;
  InterviewPrep: undefined;
  ExploreSections: undefined;
  CourseDetail: {courseId: string};
  LessonPlayer: {courseId?: string; lessonId: string; enrollmentId?: string};
  ProtectedViewer: {resourceId: string; title: string; mimeType: string; kind: 'pdf' | 'video' | 'notes' | 'audio' | 'other'};
  ExamDetail: {examId: string};
  TestList: {examId?: string} | undefined;
  TestInstructions: {testId: string};
  NewsFeed: {categoryId: string};
  NewsArticle: {articleId: string};
  TopicDetail: {topicId: string};
  FactsList: {
    categoryId?: string;
    categoryTitle?: string;
    categorySubtitle?: string;
  } | undefined;
  FactDetail: {factId: string};
  InterviewQuestion: {questionId: string};
  InterviewQuestionList: {categoryId: string};
  LiveRoom: {liveClassId: string};
};

export type LiveStackParamList = {
  LiveSchedule: undefined;
  LiveRoom: {liveClassId: string};
  Notifications: undefined;
  LessonPlayer: {courseId?: string; lessonId: string; enrollmentId?: string};
  ProtectedViewer: {resourceId: string; title: string; mimeType: string; kind: 'pdf' | 'video' | 'notes' | 'audio' | 'other'};
};

export type CoursesStackParamList = HomeStackParamList & {
  CoursesHome: {pricing?: PricingFilter} | undefined;
};

export type LearningStackParamList = {
  TestInstructions: {testId: string};
  MyLearning: undefined;
  Downloads: undefined;
  Notifications: undefined;
  CourseDetail: {courseId: string};
  LessonPlayer: {courseId?: string; lessonId: string; enrollmentId?: string};
  ProtectedViewer: {resourceId: string; title: string; mimeType: string; kind: 'pdf' | 'video' | 'notes' | 'audio' | 'other'};
  SemesterOutline: {enrollmentId: string};
  SemesterContent: {enrollmentId: string; semesterId: string};
  ProjectDetail: {projectId: string};
  TestResult: {attemptId: string};
  ResultHistory: undefined;
  EnrolledCourses: undefined;
  DocumentList: {kind?: 'admit_card' | 'certificate'} | undefined;
  AdmitCard: {documentId: string};
  Certificate: {documentId: string};
  NewsArticle: {articleId: string};
  FactDetail: {factId: string};
  InterviewQuestion: {questionId: string};
};

export type ProfileStackParamList = {
  CourseDetail: {courseId: string};
  LessonPlayer: {courseId?: string; lessonId: string; enrollmentId?: string};
  ProtectedViewer: {resourceId: string; title: string; mimeType: string; kind: 'pdf' | 'video' | 'notes' | 'audio' | 'other'};
  SemesterOutline: {enrollmentId: string};
  SemesterContent: {enrollmentId: string; semesterId: string};
  ProjectDetail: {projectId: string};
  TestInstructions: {testId: string};
  TestResult: {attemptId: string};
  DeleteAccount: undefined;
  ProfileHome: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Downloads: undefined;
  EnrolledCourses: undefined;
  ResultHistory: undefined;
  DocumentList: {kind?: 'admit_card' | 'certificate'} | undefined;
  AdmitCard: {documentId: string};
  Certificate: {documentId: string};
  HelpSupport: undefined;
  About: undefined;
  Feedback: undefined;
  Legal: {slug: string};
  PaymentHistory: undefined;
  OrderDetail: {orderId: string};
  Subscription: undefined;
};

export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  LiveTab: NavigatorScreenParams<LiveStackParamList>;
  CoursesTab: NavigatorScreenParams<CoursesStackParamList>;
  LearningTab: NavigatorScreenParams<LearningStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Onboarding: undefined;
  PublicLegal: {slug: string};
  Login: {returnTo?: string} | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyContact: {challengeId: string; mode: 'register' | 'reset' | 'profile'};
  ResetPassword: {challengeId: string};
  Main: NavigatorScreenParams<TabParamList>;
  DailyQuiz: {testId: string; attemptId?: string};
  TestRunner: {attemptId: string};
  Checkout: {productId: string; returnTo?: string};
  PaymentSuccess: {orderId: string};
  PaymentFailure: {orderId: string};
  PaymentPending: {orderId: string};
  SemesterWait: {enrollmentId: string; semesterId: string};
};

export type RootNav = NativeStackNavigationProp<RootStackParamList>;
export type TabNav = CompositeNavigationProp<BottomTabNavigationProp<TabParamList>, RootNav>;
export type HomeNav = CompositeNavigationProp<NativeStackNavigationProp<HomeStackParamList>, TabNav>;

export type ScreenRoute<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;
