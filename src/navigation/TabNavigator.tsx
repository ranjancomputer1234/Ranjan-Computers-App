import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {themedScreen, useTheme} from '../theme/ThemeProvider';
import type {IconName} from '../assets/icons';
import type {
  CoursesStackParamList,
  HomeStackParamList,
  LearningStackParamList,
  LiveStackParamList,
  ProfileStackParamList,
  TabParamList,
} from './types';
import {HomeScreen} from '../screens/home';
import {CatalogScreen, ExploreSectionsScreen} from '../screens/catalog';
import {SearchScreen} from '../screens/search';
import {NotificationsScreen} from '../screens/notifications';
import {CourseDetailScreen} from '../screens/courses';
import {LessonPlayerScreen} from '../screens/lessons';
import {CompetitiveExamsScreen, ExamDetailScreen} from '../screens/exams';
import {
  TestListScreen,
  TestInstructionsScreen,
  EnrolledCoursesScreen,
  ResultHistoryScreen,
  TestResultScreen,
} from '../screens/assessments';
import {DailyNewsScreen, NewsFeedScreen, NewsArticleScreen} from '../screens/news';
import {GeneralAwarenessScreen, TopicDetailScreen} from '../screens/awareness';
import {AmazingFactsScreen, FactsListScreen, FactDetailScreen} from '../screens/facts';
import {
  InterviewPrepScreen,
  InterviewQuestionScreen,
  InterviewQuestionListScreen,
} from '../screens/interview';
import {LiveRoomScreen, LiveScheduleScreen} from '../screens/live';
import {MyLearningScreen} from '../screens/learning';
import {
  SemesterOutlineScreen,
  SemesterContentScreen,
  ProjectDetailScreen,
} from '../screens/semesters';
import {ProfileScreen, EditProfileScreen} from '../screens/profile';
import {DeleteAccountScreen} from '../screens/profile/DeleteAccountScreen';
import {NotificationSettingsScreen, SettingsScreen} from '../screens/settings';
import {DownloadsScreen} from '../screens/downloads';
import {DocumentListScreen, AdmitCardScreen, CertificateScreen, ProtectedViewerScreen} from '../screens/documents';
import {AboutScreen, FeedbackScreen, HelpSupportScreen, LegalScreen} from '../screens/support';
import {PaymentHistoryScreen, OrderDetailScreen, SubscriptionScreen} from '../screens/payments';
import {usePendingDestinationReplay} from './PendingDestination';
import {RediTabBar} from './RediTabBar';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const LiveStack = createNativeStackNavigator<LiveStackParamList>();
const CoursesStack = createNativeStackNavigator<CoursesStackParamList>();
const LearningStack = createNativeStackNavigator<LearningStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const hideHeader = {headerShown: false as const, freezeOnBlur: true};

function useThemedStackOptions() {
  const theme = useTheme();
  return React.useMemo(
    () => ({
      ...hideHeader,
      statusBarStyle: theme.scheme === 'dark' ? 'light' as const : 'dark' as const,
      statusBarBackgroundColor: theme.scheme === 'dark' ? theme.colors.scroll : '#FFFFFF',
      navigationBarColor: theme.colors.white,
    }),
    [theme.colors.scroll, theme.colors.white, theme.scheme],
  );
}

function sharedHomeScreens(Stack: typeof HomeStack) {
  return (
    <>
      <Stack.Screen name="Search" component={themedScreen(SearchScreen)} />
      <Stack.Screen name="Notifications" component={themedScreen(NotificationsScreen)} />
      <Stack.Screen name="ComputerCourses" component={themedScreen(CatalogScreen)} />
      <Stack.Screen name="CompetitiveExams" component={themedScreen(CompetitiveExamsScreen)} />
      <Stack.Screen name="DailyNews" component={themedScreen(DailyNewsScreen)} />
      <Stack.Screen name="GeneralAwareness" component={themedScreen(GeneralAwarenessScreen)} />
      <Stack.Screen name="AmazingFacts" component={themedScreen(AmazingFactsScreen)} />
      <Stack.Screen name="InterviewPrep" component={themedScreen(InterviewPrepScreen)} />
      <Stack.Screen name="ExploreSections" component={themedScreen(ExploreSectionsScreen)} />
      <Stack.Screen name="CourseDetail" component={themedScreen(CourseDetailScreen)} />
      <Stack.Screen name="LessonPlayer" component={themedScreen(LessonPlayerScreen)} />
      <Stack.Screen name="ProtectedViewer" component={themedScreen(ProtectedViewerScreen)} />
      <Stack.Screen name="ExamDetail" component={themedScreen(ExamDetailScreen)} />
      <Stack.Screen name="TestList" component={themedScreen(TestListScreen)} />
      <Stack.Screen name="TestInstructions" component={themedScreen(TestInstructionsScreen)} />
      <Stack.Screen name="NewsFeed" component={themedScreen(NewsFeedScreen)} />
      <Stack.Screen name="NewsArticle" component={themedScreen(NewsArticleScreen)} />
      <Stack.Screen name="TopicDetail" component={themedScreen(TopicDetailScreen)} />
      <Stack.Screen name="FactsList" component={themedScreen(FactsListScreen)} />
      <Stack.Screen name="FactDetail" component={themedScreen(FactDetailScreen)} />
      <Stack.Screen name="InterviewQuestion" component={themedScreen(InterviewQuestionScreen)} />
      <Stack.Screen name="InterviewQuestionList" component={themedScreen(InterviewQuestionListScreen)} />
      <Stack.Screen name="LiveRoom" component={themedScreen(LiveRoomScreen)} />
    </>
  );
}

function HomeStackNav() {
  const screenOptions = useThemedStackOptions();
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Home" component={themedScreen(HomeScreen)} />
      {sharedHomeScreens(HomeStack)}
    </HomeStack.Navigator>
  );
}

function LiveStackNav() {
  const screenOptions = useThemedStackOptions();
  return (
    <LiveStack.Navigator screenOptions={screenOptions}>
      <LiveStack.Screen name="LiveSchedule" component={themedScreen(LiveScheduleScreen)} />
      <LiveStack.Screen name="LiveRoom" component={themedScreen(LiveRoomScreen)} />
      <LiveStack.Screen name="LessonPlayer" component={themedScreen(LessonPlayerScreen)} />
      <LiveStack.Screen name="ProtectedViewer" component={themedScreen(ProtectedViewerScreen)} />
      <LiveStack.Screen name="Notifications" component={themedScreen(NotificationsScreen)} />
    </LiveStack.Navigator>
  );
}

function CoursesStackNav() {
  const screenOptions = useThemedStackOptions();
  return (
    <CoursesStack.Navigator screenOptions={screenOptions}>
      <CoursesStack.Screen name="CoursesHome" component={themedScreen(CatalogScreen)} />
      {sharedHomeScreens(CoursesStack as unknown as typeof HomeStack)}
    </CoursesStack.Navigator>
  );
}

function LearningStackNav() {
  const screenOptions = useThemedStackOptions();
  return (
    <LearningStack.Navigator screenOptions={screenOptions}>
      <LearningStack.Screen name="MyLearning" component={themedScreen(MyLearningScreen)} />
      <LearningStack.Screen name="Downloads" component={themedScreen(DownloadsScreen)} />
      <LearningStack.Screen name="Notifications" component={themedScreen(NotificationsScreen)} />
      <LearningStack.Screen name="CourseDetail" component={themedScreen(CourseDetailScreen)} />
      <LearningStack.Screen name="LessonPlayer" component={themedScreen(LessonPlayerScreen)} />
      <LearningStack.Screen name="ProtectedViewer" component={themedScreen(ProtectedViewerScreen)} />
      <LearningStack.Screen name="SemesterOutline" component={themedScreen(SemesterOutlineScreen)} />
      <LearningStack.Screen name="SemesterContent" component={themedScreen(SemesterContentScreen)} />
      <LearningStack.Screen name="ProjectDetail" component={themedScreen(ProjectDetailScreen)} />
      <LearningStack.Screen name="TestInstructions" component={themedScreen(TestInstructionsScreen)} />
      <LearningStack.Screen name="TestResult" component={themedScreen(TestResultScreen)} />
      <LearningStack.Screen name="ResultHistory" component={themedScreen(ResultHistoryScreen)} />
      <LearningStack.Screen name="EnrolledCourses" component={themedScreen(EnrolledCoursesScreen)} />
      <LearningStack.Screen name="DocumentList" component={themedScreen(DocumentListScreen)} />
      <LearningStack.Screen name="AdmitCard" component={themedScreen(AdmitCardScreen)} />
      <LearningStack.Screen name="Certificate" component={themedScreen(CertificateScreen)} />
      <LearningStack.Screen name="NewsArticle" component={themedScreen(NewsArticleScreen)} />
      <LearningStack.Screen name="FactDetail" component={themedScreen(FactDetailScreen)} />
      <LearningStack.Screen name="InterviewQuestion" component={themedScreen(InterviewQuestionScreen)} />
    </LearningStack.Navigator>
  );
}

function ProfileStackNav() {
  const screenOptions = useThemedStackOptions();
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen name="ProfileHome" component={themedScreen(ProfileScreen)} />
      <ProfileStack.Screen name="Settings" component={themedScreen(SettingsScreen)} />
      <ProfileStack.Screen name="NotificationSettings" component={themedScreen(NotificationSettingsScreen)} />
      <ProfileStack.Screen name="EditProfile" component={themedScreen(EditProfileScreen)} />
      <ProfileStack.Screen name="DeleteAccount" component={themedScreen(DeleteAccountScreen)} />
      <ProfileStack.Screen name="CourseDetail" component={themedScreen(CourseDetailScreen)} />
      <ProfileStack.Screen name="LessonPlayer" component={themedScreen(LessonPlayerScreen)} />
      <ProfileStack.Screen name="ProtectedViewer" component={themedScreen(ProtectedViewerScreen)} />
      <ProfileStack.Screen name="SemesterOutline" component={themedScreen(SemesterOutlineScreen)} />
      <ProfileStack.Screen name="SemesterContent" component={themedScreen(SemesterContentScreen)} />
      <ProfileStack.Screen name="ProjectDetail" component={themedScreen(ProjectDetailScreen)} />
      <ProfileStack.Screen name="TestInstructions" component={themedScreen(TestInstructionsScreen)} />
      <ProfileStack.Screen name="TestResult" component={themedScreen(TestResultScreen)} />
      <ProfileStack.Screen name="Notifications" component={themedScreen(NotificationsScreen)} />
      <ProfileStack.Screen name="Downloads" component={themedScreen(DownloadsScreen)} />
      <ProfileStack.Screen name="EnrolledCourses" component={themedScreen(EnrolledCoursesScreen)} />
      <ProfileStack.Screen name="ResultHistory" component={themedScreen(ResultHistoryScreen)} />
      <ProfileStack.Screen name="DocumentList" component={themedScreen(DocumentListScreen)} />
      <ProfileStack.Screen name="AdmitCard" component={themedScreen(AdmitCardScreen)} />
      <ProfileStack.Screen name="Certificate" component={themedScreen(CertificateScreen)} />
      <ProfileStack.Screen name="HelpSupport" component={themedScreen(HelpSupportScreen)} />
      <ProfileStack.Screen name="About" component={themedScreen(AboutScreen)} />
      <ProfileStack.Screen name="Feedback" component={themedScreen(FeedbackScreen)} />
      <ProfileStack.Screen name="Legal" component={themedScreen(LegalScreen)} />
      <ProfileStack.Screen name="PaymentHistory" component={themedScreen(PaymentHistoryScreen)} />
      <ProfileStack.Screen name="OrderDetail" component={themedScreen(OrderDetailScreen)} />
      <ProfileStack.Screen name="Subscription" component={themedScreen(SubscriptionScreen)} />
    </ProfileStack.Navigator>
  );
}

const tabs: {name: keyof TabParamList; label: string; icon: IconName; component: React.ComponentType}[] = [
  {name: 'HomeTab', label: 'Home', icon: 'home', component: themedScreen(HomeStackNav)},
  {name: 'LiveTab', label: 'Live', icon: 'live', component: themedScreen(LiveStackNav)},
  {name: 'CoursesTab', label: 'Courses', icon: 'bookopen', component: themedScreen(CoursesStackNav)},
  {name: 'LearningTab', label: 'My Learning', icon: 'bookmark', component: themedScreen(LearningStackNav)},
  {name: 'ProfileTab', label: 'Profile', icon: 'user', component: themedScreen(ProfileStackNav)},
];

// React Navigation treats `tabBar` as a render callback rather than mounting
// that function as a React component. Return an element here so RediTabBar's
// hooks execute inside a real component boundary.
function renderRediTabBar(props: BottomTabBarProps) {
  return <RediTabBar {...props} tabs={tabs} />;
}

export function TabNavigator() {
  usePendingDestinationReplay();
  return (
    <Tabs.Navigator
      detachInactiveScreens
      backBehavior="history"
      tabBar={renderRediTabBar}
      screenOptions={hideHeader}>
      {tabs.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tabs.Navigator>
  );
}
